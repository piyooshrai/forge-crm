import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail } from '@/lib/email/ses-client';
import { getCcRecipients, getPreviousMonth, isUserInGracePeriod, getAlertSubject } from '@/lib/email/helpers';
import { generateMarketingMonthlyEmail } from '@/lib/email/templates/marketing';
import { AlertType, AlertSeverity } from '@prisma/client';

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name: monthName, start: monthStart, end: monthEnd, year, month } = getPreviousMonth();
    const period = `${year}-${String(month).padStart(2, '0')}-marketing`;

    // Get all marketing reps
    const users = await prisma.user.findMany({
      where: {
        role: 'MARKETING_REP',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hiredAt: true,
      },
    });

    // Calculate overall stats for ranking
    const allUserStats: Array<{
      userId: string;
      userName: string;
      email: string;
      hiredAt: Date | null;
      totalTasks: number;
      successRate: number;
      leadsGenerated: number;
    }> = [];

    for (const user of users) {
      const userTasks = await prisma.marketingTask.findMany({
        where: {
          userId: user.id,
          taskDate: { gte: monthStart, lte: monthEnd },
        },
      });

      const tasksWithOutcome = userTasks.filter(t => t.outcome);
      const successTasks = tasksWithOutcome.filter(t => t.outcome === 'SUCCESS').length;
      const successRate = tasksWithOutcome.length > 0 ? Math.round((successTasks / tasksWithOutcome.length) * 100) : 0;
      const leadsGenerated = userTasks.filter(t => t.leadGenerated).length;

      allUserStats.push({
        userId: user.id,
        userName: user.name,
        email: user.email,
        hiredAt: user.hiredAt,
        totalTasks: userTasks.length,
        successRate,
        leadsGenerated,
      });
    }

    // Sort by success rate for ranking
    allUserStats.sort((a, b) => b.successRate - a.successRate);

    const results: Array<{ userId: string; userName: string; status: string; successRate?: number }> = [];

    for (let i = 0; i < allUserStats.length; i++) {
      const userStat = allUserStats[i];
      const teamRank = i + 1;
      const teamTotal = allUserStats.length;

      // Check for existing alert
      const existingAlert = await prisma.quotaAlert.findUnique({
        where: {
          userId_alertType_period: { userId: userStat.userId, alertType: AlertType.MARKETING_MONTHLY, period },
        },
      });

      if (existingAlert) {
        results.push({ userId: userStat.userId, userName: userStat.userName, status: 'already_sent', successRate: userStat.successRate });
        continue;
      }

      // Get detailed breakdown by type
      const userTasks = await prisma.marketingTask.findMany({
        where: {
          userId: userStat.userId,
          taskDate: { gte: monthStart, lte: monthEnd },
        },
      });

      const tasksWithOutcome = userTasks.filter(t => t.outcome);
      const successTasks = tasksWithOutcome.filter(t => t.outcome === 'SUCCESS').length;
      const failedTasks = tasksWithOutcome.filter(t => t.outcome === 'FAILED').length;

      // Build by-type breakdown
      const byTypeMap = new Map<string, { count: number; success: number; leads: number }>();
      userTasks.forEach(t => {
        if (!byTypeMap.has(t.type)) {
          byTypeMap.set(t.type, { count: 0, success: 0, leads: 0 });
        }
        const entry = byTypeMap.get(t.type)!;
        entry.count++;
        if (t.outcome === 'SUCCESS') entry.success++;
        if (t.leadGenerated) entry.leads++;
      });

      const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        successRate: data.count > 0 ? Math.round((data.success / data.count) * 100) : 0,
        leadsGenerated: data.leads,
      }));

      // Sort to find best and worst
      const sortedBySuccess = [...byType].sort((a, b) => b.successRate - a.successRate);
      const bestPerforming = sortedBySuccess.length > 0 && sortedBySuccess[0].successRate > 0
        ? sortedBySuccess[0].type
        : undefined;
      const needsImprovement = sortedBySuccess.length > 0 && sortedBySuccess[sortedBySuccess.length - 1].successRate < 25
        ? sortedBySuccess[sortedBySuccess.length - 1].type
        : undefined;

      // Determine severity for CC routing
      const severity: AlertSeverity = userStat.successRate < 15 ? AlertSeverity.RED
        : userStat.successRate >= 40 ? AlertSeverity.GREEN
        : AlertSeverity.YELLOW;

      const emailContent = generateMarketingMonthlyEmail({
        userName: userStat.userName,
        monthName,
        totalTasks: userStat.totalTasks,
        successTasks,
        failedTasks,
        successRate: userStat.successRate,
        leadsGenerated: userStat.leadsGenerated,
        byType,
        bestPerforming,
        needsImprovement,
        teamRank,
        teamTotal,
      });

      const inGracePeriod = isUserInGracePeriod(userStat.hiredAt);
      const subject = getAlertSubject(emailContent.subject, inGracePeriod);

      try {
        await sendAlertEmail({
          userId: userStat.userId,
          userEmail: userStat.email,
          alertType: AlertType.MARKETING_MONTHLY,
          severity,
          subject,
          htmlBody: emailContent.html,
          textBody: emailContent.text,
          ccRecipients: severity === AlertSeverity.RED ? getCcRecipients(severity, true, true) : getCcRecipients(severity),
          period,
        });

        await prisma.quotaAlert.create({
          data: { userId: userStat.userId, alertType: AlertType.MARKETING_MONTHLY, severity, period },
        });

        results.push({ userId: userStat.userId, userName: userStat.userName, status: 'email_sent', successRate: userStat.successRate });
      } catch (emailError) {
        console.error(`Failed to send marketing monthly to ${userStat.email}:`, emailError);
        results.push({ userId: userStat.userId, userName: userStat.userName, status: 'email_failed', successRate: userStat.successRate });
      }
    }

    return NextResponse.json({
      success: true,
      month: monthName,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Marketing monthly cron failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
