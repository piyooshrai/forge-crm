import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DealStage } from '@prisma/client';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeftInMonth = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Pipeline value (open deals)
    const pipelineDeals = await prisma.deal.aggregate({
      where: {
        stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
      },
      _sum: { amountTotal: true },
    });
    const pipelineValue = pipelineDeals._sum.amountTotal || 0;

    // Deals closed this month
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

    const dealsClosedThisMonth = closedWonThisMonth;
    const totalClosed = closedWonThisMonth + closedLostThisMonth;
    const winRate = totalClosed > 0 ? Math.round((closedWonThisMonth / totalClosed) * 100) : 0;

    // Team quota calculation
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
      const quotaTarget = userQuota?.targetAmount || 3000;
      totalQuotaTarget += quotaTarget;

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

    // Calculate winning streak
    const recentWonDeals = await prisma.deal.findMany({
      where: { stage: DealStage.CLOSED_WON },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { updatedAt: true },
    });

    const recentLostDeals = await prisma.deal.findMany({
      where: { stage: DealStage.CLOSED_LOST },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { updatedAt: true },
    });

    let currentStreak = { type: 'win' as 'win' | 'loss', count: 0 };

    if (recentWonDeals.length > 0 || recentLostDeals.length > 0) {
      const lastWin = recentWonDeals[0]?.updatedAt;
      const lastLoss = recentLostDeals[0]?.updatedAt;

      if (lastWin && (!lastLoss || lastWin > lastLoss)) {
        // Count consecutive win days
        const winDates = new Set(recentWonDeals.map(d => d.updatedAt.toDateString()));
        let count = 0;
        const checkDate = new Date();
        for (let i = 0; i < 30; i++) {
          if (winDates.has(checkDate.toDateString())) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        currentStreak = { type: 'win', count: Math.max(count, 1) };
      } else if (lastLoss) {
        const lossDates = new Set(recentLostDeals.map(d => d.updatedAt.toDateString()));
        let count = 0;
        const checkDate = new Date();
        for (let i = 0; i < 30; i++) {
          if (lossDates.has(checkDate.toDateString())) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        currentStreak = { type: 'loss', count: Math.max(count, 1) };
      }
    }

    const hasData = dealsClosedThisMonth > 0 || pipelineValue > 0;

    return NextResponse.json({
      currentMonth,
      pipelineValue,
      teamQuotaPercent,
      dealsClosedThisMonth,
      winRate,
      currentStreak,
      daysLeftInMonth,
      hasData,
    });
  } catch (error) {
    console.error('Login stats error:', error);
    return NextResponse.json({
      currentMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      pipelineValue: 0,
      teamQuotaPercent: 0,
      dealsClosedThisMonth: 0,
      winRate: 0,
      currentStreak: { type: 'win', count: 0 },
      daysLeftInMonth: 0,
      hasData: false,
    });
  }
}
