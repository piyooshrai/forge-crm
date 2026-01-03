import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DealStage } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ hasData: false });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Get user's quota
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

    // Get user's actual performance
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

    // Calculate rank among all users
    const allUsers = await prisma.user.findMany({
      where: { role: { in: ['SALES_REP', 'MARKETING_REP'] } },
    });

    const userPerformances: Array<{ id: string; percent: number }> = [];

    for (const u of allUsers) {
      const uQuota = await prisma.userQuota.findUnique({
        where: {
          userId_year_month: {
            userId: u.id,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
      });
      const uTarget = uQuota?.targetAmount || 3000;

      const uWon = await prisma.deal.aggregate({
        where: {
          ownerId: u.id,
          stage: DealStage.CLOSED_WON,
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountTotal: true },
      });
      const uActual = uWon._sum.amountTotal || 0;
      const uPercent = uTarget > 0 ? (uActual / uTarget) * 100 : 0;

      userPerformances.push({ id: u.id, percent: uPercent });
    }

    userPerformances.sort((a, b) => b.percent - a.percent);
    const rank = userPerformances.findIndex(u => u.id === user.id) + 1;
    const totalUsers = allUsers.length;

    // Determine status
    let status: 'crushing' | 'on-track' | 'behind' | 'critical';
    if (quotaPercent >= 100) {
      status = 'crushing';
    } else if (quotaPercent >= 80) {
      status = 'on-track';
    } else if (quotaPercent >= 50) {
      status = 'behind';
    } else {
      status = 'critical';
    }

    return NextResponse.json({
      name: user.name,
      quotaPercent,
      quotaActual,
      quotaTarget,
      rank,
      totalUsers,
      status,
      daysLeft,
      hasData: true,
    });
  } catch (error) {
    console.error('User preview error:', error);
    return NextResponse.json({ hasData: false });
  }
}
