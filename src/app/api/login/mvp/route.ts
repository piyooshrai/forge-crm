import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DealStage } from '@prisma/client';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const now = new Date();

    // Get last week's date range
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay()); // Last Sunday
    lastWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6); // Previous Monday
    lastWeekStart.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { role: { in: ['SALES_REP', 'MARKETING_REP'] } },
    });

    if (users.length === 0) {
      return NextResponse.json({ mvp: null, hasData: false });
    }

    const userMetrics: Array<{
      id: string;
      name: string;
      role: string;
      dealsWon: number;
      revenue: number;
      activities: number;
      quotaPercent: number;
      winRate: number;
    }> = [];

    for (const user of users) {
      // Deals won last week
      const wonDeals = await prisma.deal.findMany({
        where: {
          ownerId: user.id,
          stage: DealStage.CLOSED_WON,
          updatedAt: { gte: lastWeekStart, lte: lastWeekEnd },
        },
      });

      const lostDeals = await prisma.deal.count({
        where: {
          ownerId: user.id,
          stage: DealStage.CLOSED_LOST,
          updatedAt: { gte: lastWeekStart, lte: lastWeekEnd },
        },
      });

      const dealsWon = wonDeals.length;
      const revenue = wonDeals.reduce((sum, d) => sum + (d.amountTotal || 0), 0);
      const totalClosed = dealsWon + lostDeals;
      const winRate = totalClosed > 0 ? (dealsWon / totalClosed) * 100 : 0;

      // Activities last week
      const activities = await prisma.activity.count({
        where: {
          userId: user.id,
          createdAt: { gte: lastWeekStart, lte: lastWeekEnd },
        },
      });

      // Quota percent for the month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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

      const monthWonDeals = await prisma.deal.aggregate({
        where: {
          ownerId: user.id,
          stage: DealStage.CLOSED_WON,
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountTotal: true },
      });
      const quotaActual = monthWonDeals._sum.amountTotal || 0;
      const quotaPercent = quotaTarget > 0 ? (quotaActual / quotaTarget) * 100 : 0;

      userMetrics.push({
        id: user.id,
        name: user.name,
        role: user.role === 'SALES_REP' ? 'Sales Representative' : 'Marketing Representative',
        dealsWon,
        revenue,
        activities,
        quotaPercent,
        winRate,
      });
    }

    // Find MVP based on composite score (revenue + activities + win rate)
    const scoredUsers = userMetrics.map(u => ({
      ...u,
      score: u.revenue + (u.activities * 10) + (u.winRate * 5) + (u.dealsWon * 100),
    }));

    scoredUsers.sort((a, b) => b.score - a.score);
    const topUser = scoredUsers[0];

    if (!topUser || topUser.score === 0) {
      return NextResponse.json({ mvp: null, hasData: false });
    }

    // Generate achievements
    const achievements: string[] = [];
    if (topUser.dealsWon > 0) {
      achievements.push(`Closed ${topUser.dealsWon} deal${topUser.dealsWon > 1 ? 's' : ''} worth $${topUser.revenue.toLocaleString()}`);
    }
    if (topUser.activities >= 20) {
      achievements.push(`Logged ${topUser.activities} activities`);
    }
    if (topUser.winRate >= 50) {
      achievements.push(`${Math.round(topUser.winRate)}% win rate`);
    }
    if (achievements.length === 0) {
      achievements.push(`Most active team member last week`);
    }

    return NextResponse.json({
      mvp: {
        name: topUser.name,
        role: topUser.role,
        quotaPercent: Math.round(topUser.quotaPercent),
        winRate: Math.round(topUser.winRate),
        achievements,
      },
      hasData: true,
    });
  } catch (error) {
    console.error('MVP error:', error);
    return NextResponse.json({ mvp: null, hasData: false });
  }
}
