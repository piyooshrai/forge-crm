import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MarketingTaskType, MarketingTaskOutcome } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  const userId = searchParams.get('userId');
  const productId = searchParams.get('productId');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const where: any = {
    taskDate: { gte: startDate },
  };

  // MARKETING_REP sees only own stats, SUPER_ADMIN can see all or filter
  if (user.role !== 'SUPER_ADMIN') {
    where.userId = user.id;
  } else if (userId) {
    where.userId = userId;
  }

  // Filter by product if specified
  if (productId) {
    where.productId = productId;
  }

  // Get all tasks in period
  const tasks = await prisma.marketingTask.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
    },
  });

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status !== 'IN_PROGRESS').length;
  const tasksWithOutcome = tasks.filter(t => t.outcome);
  const successTasks = tasksWithOutcome.filter(t => t.outcome === 'SUCCESS').length;
  const partialTasks = tasksWithOutcome.filter(t => t.outcome === 'PARTIAL').length;
  const failedTasks = tasksWithOutcome.filter(t => t.outcome === 'FAILED').length;
  const successRate = tasksWithOutcome.length > 0 ? Math.round((successTasks / tasksWithOutcome.length) * 100) : 0;
  // Use leadsGeneratedCount for accurate count, fallback to leadGenerated boolean
  const leadsGenerated = tasks.reduce((sum, t) => sum + (t.leadsGeneratedCount || (t.leadGenerated ? 1 : 0)), 0);

  // ICP engagement stats
  const icpEngagementTasks = tasks.filter(t => t.icpEngagement).length;
  const icpEngagementRate = completedTasks > 0 ? Math.round((icpEngagementTasks / completedTasks) * 100) : 0;

  // Breakdown by type with detailed metrics
  const taskTypes = Object.values(MarketingTaskType);
  const byType = taskTypes.map(type => {
    const typeTasks = tasks.filter(t => t.type === type);
    const typeWithOutcome = typeTasks.filter(t => t.outcome);
    const typeSuccess = typeWithOutcome.filter(t => t.outcome === 'SUCCESS').length;
    const typePartial = typeWithOutcome.filter(t => t.outcome === 'PARTIAL').length;
    const typeFailed = typeWithOutcome.filter(t => t.outcome === 'FAILED').length;
    const typeLeads = typeTasks.reduce((sum, t) => sum + (t.leadsGeneratedCount || (t.leadGenerated ? 1 : 0)), 0);
    const typeIcpEngagement = typeTasks.filter(t => t.icpEngagement).length;

    // Calculate average engagement metrics for this type
    const avgMetrics: any = {};
    if (type === 'SOCIAL_POST') {
      const withLikes = typeTasks.filter(t => t.likes != null);
      const withComments = typeTasks.filter(t => t.comments != null);
      const withShares = typeTasks.filter(t => t.shares != null);
      avgMetrics.avgLikes = withLikes.length > 0 ? Math.round(withLikes.reduce((s, t) => s + (t.likes || 0), 0) / withLikes.length) : 0;
      avgMetrics.avgComments = withComments.length > 0 ? Math.round(withComments.reduce((s, t) => s + (t.comments || 0), 0) / withComments.length) : 0;
      avgMetrics.avgShares = withShares.length > 0 ? Math.round(withShares.reduce((s, t) => s + (t.shares || 0), 0) / withShares.length) : 0;
    } else if (type === 'LINKEDIN_OUTREACH') {
      const interested = typeTasks.filter(t => t.responseType === 'INTERESTED').length;
      const notInterested = typeTasks.filter(t => t.responseType === 'NOT_INTERESTED').length;
      const noResponse = typeTasks.filter(t => t.responseType === 'NO_RESPONSE').length;
      const connectionsAccepted = typeTasks.filter(t => t.connectionAccepted).length;
      avgMetrics.responseBreakdown = { interested, notInterested, noResponse };
      avgMetrics.connectionAcceptRate = typeTasks.length > 0 ? Math.round((connectionsAccepted / typeTasks.length) * 100) : 0;
    } else if (type === 'BLOG_POST') {
      const withViews = typeTasks.filter(t => t.views != null);
      avgMetrics.avgViews = withViews.length > 0 ? Math.round(withViews.reduce((s, t) => s + (t.views || 0), 0) / withViews.length) : 0;
    } else if (type === 'EMAIL_CAMPAIGN' || type === 'COLD_EMAIL') {
      const withSent = typeTasks.filter(t => t.sent != null && t.sent > 0);
      const totalSent = withSent.reduce((s, t) => s + (t.sent || 0), 0);
      const totalOpens = withSent.reduce((s, t) => s + (t.opens || 0), 0);
      const totalReplies = withSent.reduce((s, t) => s + (t.replies || 0), 0);
      avgMetrics.openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;
      avgMetrics.replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0;
    } else if (type === 'EVENT' || type === 'WEBINAR') {
      const withAttendees = typeTasks.filter(t => t.attendees != null);
      const withMeetings = typeTasks.filter(t => t.meetingsBooked != null);
      avgMetrics.avgAttendees = withAttendees.length > 0 ? Math.round(withAttendees.reduce((s, t) => s + (t.attendees || 0), 0) / withAttendees.length) : 0;
      avgMetrics.totalMeetingsBooked = withMeetings.reduce((s, t) => s + (t.meetingsBooked || 0), 0);
    }

    return {
      type,
      count: typeTasks.length,
      success: typeSuccess,
      partial: typePartial,
      failed: typeFailed,
      successRate: typeWithOutcome.length > 0 ? Math.round((typeSuccess / typeWithOutcome.length) * 100) : 0,
      leadsGenerated: typeLeads,
      icpEngagement: typeIcpEngagement,
      icpEngagementRate: typeTasks.length > 0 ? Math.round((typeIcpEngagement / typeTasks.length) * 100) : 0,
      ...avgMetrics,
    };
  }).filter(t => t.count > 0);

  // Sort by success rate for best/worst
  const sortedBySuccess = [...byType].sort((a, b) => b.successRate - a.successRate);
  const bestPerforming = sortedBySuccess.filter(t => t.successRate > 0).slice(0, 3);
  const worstPerforming = sortedBySuccess.filter(t => t.count >= 3 && t.successRate < 30).slice(-3).reverse();

  // Performance by rep (for SUPER_ADMIN) - always fetch all reps for dropdown
  let byRep: any[] = [];
  if (user.role === 'SUPER_ADMIN') {
    // Get all marketing tasks in period (unfiltered by user) to build rep list
    const allTasksInPeriod = await prisma.marketingTask.findMany({
      where: {
        taskDate: { gte: startDate },
        ...(productId && { productId }),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const repMap = new Map<string, { name: string; tasks: typeof allTasksInPeriod }>();
    allTasksInPeriod.forEach(t => {
      const key = t.userId;
      if (!repMap.has(key)) {
        repMap.set(key, { name: t.user.name, tasks: [] });
      }
      repMap.get(key)!.tasks.push(t);
    });

    byRep = Array.from(repMap.entries()).map(([id, data]) => {
      const repTasks = data.tasks;
      const repWithOutcome = repTasks.filter(t => t.outcome);
      const repSuccess = repWithOutcome.filter(t => t.outcome === 'SUCCESS').length;
      const repLeads = repTasks.reduce((sum, t) => sum + (t.leadsGeneratedCount || (t.leadGenerated ? 1 : 0)), 0);
      const repIcpEngagement = repTasks.filter(t => t.icpEngagement).length;
      return {
        userId: id,
        name: data.name,
        totalTasks: repTasks.length,
        successRate: repWithOutcome.length > 0 ? Math.round((repSuccess / repWithOutcome.length) * 100) : 0,
        leadsGenerated: repLeads,
        icpEngagementRate: repTasks.length > 0 ? Math.round((repIcpEngagement / repTasks.length) * 100) : 0,
      };
    }).sort((a, b) => b.successRate - a.successRate);
  }

  return NextResponse.json({
    period: { days, startDate: startDate.toISOString() },
    summary: {
      totalTasks,
      completedTasks,
      successTasks,
      partialTasks,
      failedTasks,
      successRate,
      leadsGenerated,
      icpEngagementTasks,
      icpEngagementRate,
    },
    byType,
    bestPerforming,
    worstPerforming,
    byRep,
  });
}
