import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '20');

  const [deals, leads] = await Promise.all([
    prisma.deal.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { company: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        company: true,
        stage: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.lead.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { company: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        company: true,
        status: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const results = [
    ...deals.map((d) => ({
      id: d.id,
      type: 'deal' as const,
      name: d.name,
      company: d.company,
      label: `${d.name}${d.company ? ` - ${d.company}` : ''}`,
    })),
    ...leads.map((l) => ({
      id: l.id,
      type: 'lead' as const,
      name: l.name,
      company: l.company,
      label: `${l.name}${l.company ? ` - ${l.company}` : ''}`,
    })),
  ];

  return NextResponse.json(results);
}
