import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canCreateLead } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const region = searchParams.get('region');

  const where: any = {};
  if (status && status !== 'all') {
    where.status = status;
  }
  if (source && source !== 'all') {
    where.source = source;
  }
  if (region && region !== 'all') {
    where.regionTags = { has: region };
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      convertedToDeal: {
        select: { id: true, name: true, stage: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canCreateLead(session.user.role as any)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  const lead = await prisma.lead.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      title: body.title,
      source: body.source,
      status: body.status || 'NEW',
      regionTags: body.regionTags || [],
      ownerId: session.user.id,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(lead);
}
