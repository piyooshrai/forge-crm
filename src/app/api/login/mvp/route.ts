import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DealStage } from '@prisma/client';

export const revalidate = 300;

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    const now = new Date();

    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
    lastWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { role: { in: ['SALES_REP', 'MARKETING_REP'] } },
    });

    if (users.length === 0) {
      return NextResponse.json({ mvp: null, hasData: false });
    }

    const userMetrics: Array<{
      name: string;
      role: string;
      quotaPercent: number;
      winRate: number;
      activitiesCount: number;
      staleDealCount: number;
      score: number;
    }> = [];

    for (const user of users) {
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
      const winRate = totalClosed > 0 ? Math.round((dealsWon / totalClosed) * 100) : 0;

      const activitiesCount = await prisma.activity.count({
        where: {
          userId: user.id,
          createdAt: { gte: lastWeekStart, lte: lastWeekEnd },
        },
      });

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
      const quotaPercent = quotaTarget > 0 ? Math.round((quotaActual / quotaTarget) * 100) : 0;

      const activeDeals = await prisma.deal.findMany({
        where: {
          ownerId: user.id,
          stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
        },
        select: { updatedAt: true },
      });
      const staleDealCount = activeDeals.filter(d => daysSince(d.updatedAt) > 14).length;

      const score = revenue + (activitiesCount * 10) + (winRate * 5) + (dealsWon * 100) - (staleDealCount * 50);

      userMetrics.push({
        name: user.name,
        role: user.role === 'SALES_REP' ? 'Sales Representative' : 'Marketing Representative',
        quotaPercent,
        winRate,
        activitiesCount,
        staleDealCount,
        score,
      });
    }

    userMetrics.sort((a, b) => b.score - a.score);
    const topUser = userMetrics[0];

    if (!topUser || topUser.score <= 0) {
      return NextResponse.json({ mvp: null, hasData: false });
    }

    return NextResponse.json({
      mvp: {
        name: topUser.name,
        role: topUser.role,
        quotaPercent: topUser.quotaPercent,
        winRate: topUser.winRate,
        activitiesCount: topUser.activitiesCount,
        staleDealCount: topUser.staleDealCount,
      },
      hasData: true,
    });
  } catch (error) {
    console.error('MVP error:', error);
    return NextResponse.json({ mvp: null, hasData: false });
  }
}
