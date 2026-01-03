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

    const users = await prisma.user.findMany({
      where: { role: { in: ['SALES_REP', 'MARKETING_REP'] } },
    });

    if (users.length === 0) {
      return NextResponse.json({
        topPerformers: [],
        teamAverage: 0,
        daysLeftInMonth,
        hasData: false,
      });
    }

    const userMetrics: Array<{
      id: string;
      name: string;
      quotaPercent: number;
      quotaActual: number;
      quotaTarget: number;
    }> = [];

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

      const wonDeals = await prisma.deal.aggregate({
        where: {
          ownerId: user.id,
          stage: DealStage.CLOSED_WON,
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountTotal: true },
      });
      const quotaActual = wonDeals._sum.amountTotal || 0;
      const quotaPercent = quotaTarget > 0 ? (quotaActual / quotaTarget) * 100 : 0;

      userMetrics.push({
        id: user.id,
        name: user.name,
        quotaPercent,
        quotaActual,
        quotaTarget,
      });
    }

    // Sort by percentage descending
    userMetrics.sort((a, b) => b.quotaPercent - a.quotaPercent);

    // Top 3 with ranks
    const topPerformers = userMetrics.slice(0, 3).map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));

    // Team average
    const teamAverage = userMetrics.length > 0
      ? userMetrics.reduce((sum, u) => sum + u.quotaPercent, 0) / userMetrics.length
      : 0;

    const hasData = userMetrics.some(u => u.quotaActual > 0);

    return NextResponse.json({
      topPerformers,
      teamAverage: Math.round(teamAverage),
      daysLeftInMonth,
      hasData,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({
      topPerformers: [],
      teamAverage: 0,
      daysLeftInMonth: 0,
      hasData: false,
    });
  }
}
