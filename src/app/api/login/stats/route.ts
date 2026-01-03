import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DealStage } from '@prisma/client';

export const revalidate = 300;

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeftInMonth = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const closedWonThisMonth = await prisma.deal.count({
      where: {
        stage: DealStage.CLOSED_WON,
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
    });

    const closedLostThisMonth = await prisma.deal.count({
      where: {
        stage: DealStage.CLOSED_LOST,
        updatedAt: { gte: monthStart, lte: monthEnd },
      },
    });

    const dealsClosedCount = closedWonThisMonth;
    const totalClosed = closedWonThisMonth + closedLostThisMonth;
    const winRate = totalClosed > 0 ? Math.round((closedWonThisMonth / totalClosed) * 100) : 0;

    const users = await prisma.user.findMany({
      where: { role: { in: ['SALES_REP', 'MARKETING_REP'] } },
    });

    let totalQuotaTarget = 0;
    let totalQuotaActual = 0;

    for (const user of users) {
      const userQuota = await prisma.userQuota.findUnique({
        where: {
          userId_year_month: {
            userId: user.id,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
      });
      totalQuotaTarget += userQuota?.targetAmount || 3000;

      const wonDeals = await prisma.deal.aggregate({
        where: {
          ownerId: user.id,
          stage: DealStage.CLOSED_WON,
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountTotal: true },
      });
      totalQuotaActual += wonDeals._sum.amountTotal || 0;
    }

    const teamQuotaPercent = totalQuotaTarget > 0
      ? Math.round((totalQuotaActual / totalQuotaTarget) * 100)
      : 0;

    const hasData = dealsClosedCount > 0 || totalQuotaActual > 0;

    return NextResponse.json({
      currentMonth,
      teamQuotaPercent,
      dealsClosedCount,
      winRate,
      daysLeftInMonth,
      hasData,
    });
  } catch (error) {
    console.error('Login stats error:', error);
    return NextResponse.json({
      currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      teamQuotaPercent: 0,
      dealsClosedCount: 0,
      winRate: 0,
      daysLeftInMonth: 0,
      hasData: false,
    });
  }
}
