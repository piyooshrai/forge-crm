import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canCreateDeal } from '@/lib/auth-helpers';
import { Pipeline, DealStage } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canCreateDeal(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const lead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  if (lead.convertedToDealId) {
    return NextResponse.json({ error: 'Lead already converted' }, { status: 400 });
  }

  // Create deal from lead
  const deal = await prisma.deal.create({
    data: {
      name: lead.companyName || 'Untitled Deal',
      pipeline: (body.pipeline as Pipeline) || Pipeline.IT_SERVICES,
      stage: DealStage.LEAD,
      source: lead.source,
      regionTags: lead.regionTags,
      ownerId: lead.ownerId,
      convertedFromLeadId: lead.id,
    },
  });

  // Update lead with deal reference
  await prisma.lead.update({
    where: { id },
    data: {
      convertedToDealId: deal.id,
    },
  });

  return NextResponse.json(deal);
}

