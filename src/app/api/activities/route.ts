import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get('leadId');
  const dealId = searchParams.get('dealId');

  const where: any = {};
  if (leadId) where.leadId = leadId;
  if (dealId) where.dealId = dealId;

  const activities = await prisma.activity.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const activity = await prisma.activity.create({
    data: {
      type: body.type || 'NOTE',
      subject: body.subject,
      description: body.description,
      leadId: body.leadId || null,
      dealId: body.dealId || null,
      userId: session.user.id,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(activity);
}
