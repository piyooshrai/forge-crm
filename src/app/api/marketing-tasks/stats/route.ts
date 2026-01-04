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
  const leadsGenerated = tasks.filter(t => t.leadGenerated).length;

  // Breakdown by type
  const taskTypes = Object.values(MarketingTaskType);
  const byType = taskTypes.map(type => {
    const typeTasks = tasks.filter(t => t.type === type);
    const typeWithOutcome = typeTasks.filter(t => t.outcome);
    const typeSuccess = typeWithOutcome.filter(t => t.outcome === 'SUCCESS').length;
    const typeFailed = typeWithOutcome.filter(t => t.outcome === 'FAILED').length;
    const typeLeads = typeTasks.filter(t => t.leadGenerated).length;
    return {
      type,
      count: typeTasks.length,
      success: typeSuccess,
      failed: typeFailed,
      successRate: typeWithOutcome.length > 0 ? Math.round((typeSuccess / typeWithOutcome.length) * 100) : 0,
      leadsGenerated: typeLeads,
    };
  }).filter(t => t.count > 0);

  // Sort by success rate for best/worst
  const sortedBySuccess = [...byType].sort((a, b) => b.successRate - a.successRate);
  const bestPerforming = sortedBySuccess.filter(t => t.successRate > 0).slice(0, 3);
  const worstPerforming = sortedBySuccess.filter(t => t.count >= 3 && t.successRate < 30).slice(-3).reverse();

  // Performance by rep (for SUPER_ADMIN)
  let byRep: any[] = [];
  if (user.role === 'SUPER_ADMIN' && !userId) {
    const repMap = new Map<string, { name: string; tasks: typeof tasks }>();
    tasks.forEach(t => {
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
      const repLeads = repTasks.filter(t => t.leadGenerated).length;
      return {
        userId: id,
        name: data.name,
        totalTasks: repTasks.length,
        successRate: repWithOutcome.length > 0 ? Math.round((repSuccess / repWithOutcome.length) * 100) : 0,
        leadsGenerated: repLeads,
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
    },
    byType,
    bestPerforming,
    worstPerforming,
    byRep,
  });
}
