import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DealStage } from '@prisma/client';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const recentWins = await prisma.deal.findMany({
      where: { stage: DealStage.CLOSED_WON },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        owner: { select: { name: true } },
      },
    });

    if (recentWins.length === 0) {
      return NextResponse.json({
        recentWins: [],
        hasData: false,
      });
    }

    const formattedWins = recentWins.map(deal => ({
      dealName: deal.name,
      amount: deal.amountTotal || 0,
      ownerName: deal.owner.name,
      closedAt: deal.updatedAt,
    }));

    return NextResponse.json({
      recentWins: formattedWins,
      hasData: true,
    });
  } catch (error) {
    console.error('Recent wins error:', error);
    return NextResponse.json({
      recentWins: [],
      hasData: false,
    });
  }
}
