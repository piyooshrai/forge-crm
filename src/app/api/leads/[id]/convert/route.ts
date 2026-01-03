import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canCreateDeal } from '@/lib/auth-helpers';
import { Pipeline, DealStage, UserRole } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canCreateDeal(session.user.role as UserRole)) {
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

  if (lead.isConverted || lead.convertedToDealId) {
    return NextResponse.json({ error: 'Lead already converted' }, { status: 400 });
  }

  // Create deal from lead
  const deal = await prisma.deal.create({
    data: {
      name: body.name || lead.company || lead.name || 'Untitled Deal',
      pipeline: (body.pipeline as Pipeline) || Pipeline.IT_SERVICES,
      stage: DealStage.QUALIFIED, // Start at QUALIFIED stage after conversion
      source: lead.source,
      regionTags: lead.regionTags,
      company: lead.company,
      contactEmail: lead.email,
      ownerId: lead.ownerId,
      convertedFromLeadId: lead.id,
      probability: 30, // Default probability for QUALIFIED stage
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Update lead with deal reference and mark as converted
  await prisma.lead.update({
    where: { id },
    data: {
      isConverted: true,
      convertedToDealId: deal.id,
    },
  });

  return NextResponse.json(deal);
}

