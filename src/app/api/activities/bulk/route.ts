import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActivityOutcome, UserRole } from '@prisma/client';

interface CallEntry {
  dealId?: string;
  leadId?: string;
  contactName?: string;
  duration?: number;
  outcome?: ActivityOutcome;
  notes?: string;
}

interface BulkCallsRequest {
  date: string;
  defaultOutcome?: ActivityOutcome;
  calls: CallEntry[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role as UserRole;
  if (userRole !== 'SALES_REP' && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: BulkCallsRequest = await req.json();

  if (!body.date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  const callDate = new Date(body.date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (callDate > today) {
    return NextResponse.json({ error: 'Cannot log calls for future dates' }, { status: 400 });
  }

  if (!body.calls || body.calls.length === 0) {
    return NextResponse.json({ error: 'At least one call is required' }, { status: 400 });
  }

  for (let i = 0; i < body.calls.length; i++) {
    const call = body.calls[i];
    if (!call.dealId && !call.leadId) {
      return NextResponse.json({
        error: `Call ${i + 1}: Deal or Lead is required`,
      }, { status: 400 });
    }
    if (call.duration !== undefined && call.duration < 0) {
      return NextResponse.json({
        error: `Call ${i + 1}: Duration must be positive`,
      }, { status: 400 });
    }
  }

  const activities = await prisma.$transaction(
    body.calls.map((call) =>
      prisma.activity.create({
        data: {
          type: 'CALL',
          subject: `Call${call.contactName ? ` with ${call.contactName}` : ''}`,
          description: call.notes || null,
          duration: call.duration || null,
          outcome: call.outcome || body.defaultOutcome || null,
          contactName: call.contactName || null,
          leadId: call.leadId || null,
          dealId: call.dealId || null,
          userId: session.user.id,
          createdAt: new Date(body.date),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          lead: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } },
        },
      })
    )
  );

  return NextResponse.json({
    success: true,
    count: activities.length,
    activities,
  });
}
