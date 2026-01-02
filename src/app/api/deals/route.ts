import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canCreateDeal } from '@/lib/auth-helpers';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pipeline = searchParams.get('pipeline');
  const stage = searchParams.get('stage');

  const where: any = {};
  if (pipeline && pipeline !== 'all') {
    where.pipeline = pipeline;
  }
  if (stage && stage !== 'all') {
    where.stage = stage;
  }

  const deals = await prisma.deal.findMany({
    where,
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      lineItems: {
        include: {
          product: true,
        },
      },
      convertedFromLead: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canCreateDeal(session.user.role as UserRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  // Calculate amount for hourly deals
  let amountTotal = body.amountTotal;
  if (body.amountType === 'HOURLY' && body.hourlyRate && body.expectedHours) {
    amountTotal = body.hourlyRate * body.expectedHours;
  }

  const deal = await prisma.deal.create({
    data: {
      name: body.name,
      pipeline: body.pipeline,
      stage: body.stage || 'LEAD',
      amountType: body.amountType || 'FIXED',
      amountTotal: amountTotal,
      hourlyRate: body.hourlyRate,
      expectedHours: body.expectedHours,
      probability: body.probability || 0,
      closeDate: body.closeDate ? new Date(body.closeDate) : null,
      source: body.source,
      regionTags: body.regionTags || [],
      company: body.company,
      contactEmail: body.contactEmail,
      ownerId: session.user.id,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(deal);
}
