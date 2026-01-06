import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, DealStage, LeadSource, MarketingTaskOutcome } from '@prisma/client';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only SUPER_ADMIN can access this dashboard
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get 6 months of data
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);

  // Fetch all necessary data
  const [users, deals, leads, marketingTasks, activities] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        excludeFromReporting: false, // Exclude users hidden from reporting
      },
      select: {
        id: true,
        name: true,
        role: true,
        monthlyQuota: true,
      },
    }),
    prisma.deal.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        id: true,
        stage: true,
        amountTotal: true,
        ownerId: true,
        source: true,
        createdAt: true,
        closeDate: true,
      },
    }),
    prisma.lead.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        id: true,
        source: true,
        isConverted: true,
        ownerId: true,
        createdAt: true,
      },
    }),
    prisma.marketingTask.findMany({
      where: {
        taskDate: { gte: sixMonthsAgo },
        isTemplate: false,
      },
      select: {
        id: true,
        type: true,
        outcome: true,
        userId: true,
        taskDate: true,
      },
    }),
    prisma.activity.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        id: true,
        type: true,
        userId: true,
        dealId: true,
        leadId: true,
        createdAt: true,
      },
    }),
  ]);

  // Calculate monthly data for sparklines
  const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    monthKeys.push(getMonthKey(d));
  }

  // Sales reps and marketing reps
  const salesReps = users.filter(u => u.role === UserRole.SALES_REP || u.role === UserRole.SUPER_ADMIN);
  const marketingReps = users.filter(u => u.role === UserRole.MARKETING_REP || u.role === UserRole.SUPER_ADMIN);

  // === TOP SECTION: KPI Cards with Sparklines ===

  // 1. Sales Team Quota % (per month)
  const quotaTrend = monthKeys.map(monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const monthDeals = deals.filter(d => {
      const closeDate = d.closeDate ? new Date(d.closeDate) : null;
      return closeDate && closeDate >= monthStart && closeDate <= monthEnd && d.stage === DealStage.CLOSED_WON;
    });

    const totalClosed = monthDeals.reduce((sum, d) => sum + (d.amountTotal || 0), 0);
    const totalQuota = salesReps.reduce((sum, u) => sum + u.monthlyQuota, 0);
    const percentage = totalQuota > 0 ? Math.round((totalClosed / totalQuota) * 100) : 0;

    return { month: monthKey, value: percentage };
  });

  const currentQuotaPercent = quotaTrend[quotaTrend.length - 1]?.value || 0;

  // 2. Marketing Success Rate % (per month)
  const marketingTrend = monthKeys.map(monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const monthTasks = marketingTasks.filter(t => {
      const taskDate = new Date(t.taskDate);
      return taskDate >= monthStart && taskDate <= monthEnd && t.outcome;
    });

    const successTasks = monthTasks.filter(t => t.outcome === MarketingTaskOutcome.SUCCESS);
    const percentage = monthTasks.length > 0 ? Math.round((successTasks.length / monthTasks.length) * 100) : 0;

    return { month: monthKey, value: percentage };
  });

  const currentMarketingPercent = marketingTrend[marketingTrend.length - 1]?.value || 0;

  // 3. Total Pipeline Value (per month)
  const pipelineTrend = monthKeys.map(monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // Pipeline value = deals not closed as of that month end
    const pipelineDeals = deals.filter(d => {
      const createdAt = new Date(d.createdAt);
      return createdAt <= monthEnd &&
        !([DealStage.CLOSED_WON, DealStage.CLOSED_LOST] as string[]).includes(d.stage);
    });

    const value = pipelineDeals.reduce((sum, d) => sum + (d.amountTotal || 0), 0);
    return { month: monthKey, value };
  });

  const currentPipelineValue = pipelineTrend[pipelineTrend.length - 1]?.value || 0;

  // === MIDDLE SECTION: People Performance & Channel Performance ===

  // People Performance (Sales Reps - Quota %)
  const thisMonthStart = new Date(currentYear, currentMonth, 1);
  const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  const peoplePerformance = salesReps.map(user => {
    const userDeals = deals.filter(d => {
      const closeDate = d.closeDate ? new Date(d.closeDate) : null;
      return d.ownerId === user.id &&
        closeDate &&
        closeDate >= thisMonthStart &&
        closeDate <= thisMonthEnd &&
        d.stage === DealStage.CLOSED_WON;
    });

    const totalClosed = userDeals.reduce((sum, d) => sum + (d.amountTotal || 0), 0);
    const percentage = user.monthlyQuota > 0 ? Math.round((totalClosed / user.monthlyQuota) * 100) : 0;

    return {
      name: user.name,
      value: percentage,
      type: 'sales' as const,
    };
  });

  // Marketing Reps - Success Rate %
  const marketingPerformance = marketingReps
    .filter(u => u.role === UserRole.MARKETING_REP)
    .map(user => {
      const userTasks = marketingTasks.filter(t => {
        const taskDate = new Date(t.taskDate);
        return t.userId === user.id &&
          taskDate >= thisMonthStart &&
          taskDate <= thisMonthEnd &&
          t.outcome;
      });

      const successTasks = userTasks.filter(t => t.outcome === MarketingTaskOutcome.SUCCESS);
      const percentage = userTasks.length > 0 ? Math.round((successTasks.length / userTasks.length) * 100) : 0;

      return {
        name: user.name,
        value: percentage,
        type: 'marketing' as const,
      };
    });

  const allPeoplePerformance = [...peoplePerformance, ...marketingPerformance]
    .sort((a, b) => b.value - a.value);

  // Channel Performance (Lead source conversion rates)
  const leadSources = Object.values(LeadSource);
  const channelPerformance = leadSources.map(source => {
    const sourceLeads = leads.filter(l => l.source === source);
    const convertedLeads = sourceLeads.filter(l => l.isConverted);
    const conversionRate = sourceLeads.length > 0
      ? Math.round((convertedLeads.length / sourceLeads.length) * 100)
      : 0;

    return {
      channel: source,
      value: conversionRate,
      total: sourceLeads.length,
    };
  })
    .filter(c => c.total > 0)
    .sort((a, b) => b.value - a.value);

  // === BOTTOM SECTION: Effort vs ROI ===

  // Calculate effort (activities + tasks per channel/source)
  const totalActivities = activities.length;

  // Get deal sources and calculate revenue per source
  const closedWonDeals = deals.filter(d => d.stage === DealStage.CLOSED_WON);
  const totalRevenue = closedWonDeals.reduce((sum, d) => sum + (d.amountTotal || 0), 0);

  const effortVsRoi = leadSources.map(source => {
    // Effort: leads from this source + activities on those leads/deals
    const sourceLeads = leads.filter(l => l.source === source);
    const sourceDeals = deals.filter(d => d.source === source);

    // Count activities related to leads from this source
    const leadIds = new Set(sourceLeads.map(l => l.id));
    const dealIds = new Set(sourceDeals.map(d => d.id));

    const sourceActivities = activities.filter(a =>
      (a.leadId && leadIds.has(a.leadId)) || (a.dealId && dealIds.has(a.dealId))
    );

    const effortPercent = totalActivities > 0
      ? Math.round((sourceActivities.length / totalActivities) * 100)
      : 0;

    // ROI: revenue from closed won deals from this source
    const sourceRevenue = closedWonDeals
      .filter(d => d.source === source)
      .reduce((sum, d) => sum + (d.amountTotal || 0), 0);

    const roiPercent = totalRevenue > 0
      ? Math.round((sourceRevenue / totalRevenue) * 100)
      : 0;

    return {
      channel: source,
      effort: effortPercent,
      roi: roiPercent,
      leadsCount: sourceLeads.length,
      revenue: sourceRevenue,
    };
  }).filter(c => c.effort > 0 || c.roi > 0);

  // === ALERT BADGE: People needing attention ===
  const peopleNeedingAttention = allPeoplePerformance
    .filter(p => p.value < 70)
    .map(p => ({
      name: p.name,
      value: p.value,
      type: p.type,
    }));

  // Format channel names for display
  const formatChannelName = (source: string) => {
    const names: Record<string, string> = {
      WEBSITE: 'Website',
      REFERRAL: 'Referrals',
      COLD_CALL: 'Cold Calls',
      LINKEDIN: 'LinkedIn',
      TRADE_SHOW: 'Trade Shows',
      EMAIL_CAMPAIGN: 'Email Campaigns',
      UPWORK: 'Upwork',
      GURU: 'Guru',
      FREELANCER: 'Freelancer',
      OTHER: 'Other',
    };
    return names[source] || source;
  };

  return NextResponse.json({
    topSection: {
      quotaPercent: {
        current: currentQuotaPercent,
        trend: quotaTrend,
        status: currentQuotaPercent >= 100 ? 'green' : currentQuotaPercent >= 70 ? 'yellow' : 'red',
      },
      marketingSuccessRate: {
        current: currentMarketingPercent,
        trend: marketingTrend,
        status: currentMarketingPercent >= 70 ? 'green' : currentMarketingPercent >= 50 ? 'yellow' : 'red',
      },
      pipelineValue: {
        current: currentPipelineValue,
        trend: pipelineTrend,
        status: currentPipelineValue > 0 ? 'green' : 'yellow',
      },
    },
    middleSection: {
      peoplePerformance: allPeoplePerformance.map(p => ({
        ...p,
        displayName: p.name,
      })),
      channelPerformance: channelPerformance.map(c => ({
        ...c,
        displayName: formatChannelName(c.channel),
      })),
    },
    bottomSection: {
      effortVsRoi: effortVsRoi.map(c => ({
        ...c,
        displayName: formatChannelName(c.channel),
      })),
    },
    alerts: {
      peopleNeedingAttention,
      count: peopleNeedingAttention.length,
    },
  });
}
