import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canEditDeal, canSetDealStage } from '@/lib/auth-helpers';
import { DealStage, UserRole } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      lineItems: {
        include: {
          product: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      activities: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      tasks: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
      convertedFromLead: {
        select: { id: true, name: true },
      },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  return NextResponse.json(deal);
}

const stageLabels: Record<DealStage, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualified',
  DISCOVERY: 'Discovery',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canEditDeal(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // Check if stage change is allowed
  if (body.stage && !canSetDealStage(session.user.role as UserRole, body.stage)) {
    return NextResponse.json(
      { error: 'You do not have permission to set this stage' },
      { status: 403 }
    );
  }

  // Get current deal to check for stage change
  const currentDeal = await prisma.deal.findUnique({
    where: { id },
    select: { stage: true },
  });

  // Calculate amount for hourly deals
  let amountTotal = body.amountTotal;
  if (body.amountType === 'HOURLY' && body.hourlyRate && body.expectedHours) {
    amountTotal = body.hourlyRate * body.expectedHours;
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...body,
      amountTotal: amountTotal !== undefined ? amountTotal : undefined,
      closeDate: body.closeDate ? new Date(body.closeDate) : undefined,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      lineItems: {
        include: {
          product: true,
        },
      },
      activities: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      tasks: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  // Auto-create activity if stage changed
  if (body.stage && currentDeal && currentDeal.stage !== body.stage) {
    await prisma.activity.create({
      data: {
        type: 'NOTE',
        subject: 'Stage Changed',
        description: `Deal moved from ${stageLabels[currentDeal.stage]} to ${stageLabels[body.stage as DealStage]}`,
        dealId: id,
        userId: session.user.id,
      },
    });
  }

  return NextResponse.json(deal);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only SUPER_ADMIN can delete deals
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  await prisma.deal.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

