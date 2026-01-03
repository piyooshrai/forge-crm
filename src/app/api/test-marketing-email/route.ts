import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail } from '@/lib/email/ses-client';
import { getCcRecipients, getCurrentWeekPeriod, getWeekStart, getPreviousMonth } from '@/lib/email/helpers';
import { generateMarketingAlertEmail, generateMarketingMonthlyEmail } from '@/lib/email/templates/marketing';
import { AlertType, AlertSeverity } from '@prisma/client';

// TEST ENDPOINT - Remove in production
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'weekly'; // 'weekly' or 'monthly'

  try {
    // Get marketing rep (Mike with updated email)
    const user = await prisma.user.findFirst({
      where: { role: 'MARKETING_REP' },
    });

    if (!user) {
      return NextResponse.json({ error: 'No marketing rep found' }, { status: 404 });
    }

    // Get tasks from last 30 days for testing
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const userTasks = await prisma.marketingTask.findMany({
      where: {
        userId: user.id,
        taskDate: { gte: startDate },
      },
    });

    const totalTasks = userTasks.length;
    const tasksWithOutcome = userTasks.filter(t => t.outcome);
    const successTasks = tasksWithOutcome.filter(t => t.outcome === 'SUCCESS').length;
    const failedTasks = tasksWithOutcome.filter(t => t.outcome === 'FAILED').length;
    const successRate = tasksWithOutcome.length > 0 ? Math.round((successTasks / tasksWithOutcome.length) * 100) : 0;
    const leadsGenerated = userTasks.filter(t => t.leadGenerated).length;

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

    const byType = Array.from(byTypeMap.entries()).map(([taskType, data]) => ({
      type: taskType,
      count: data.count,
      successRate: data.count > 0 ? Math.round((data.success / data.count) * 100) : 0,
      leadsGenerated: data.leads,
    }));

    let emailContent;
    let alertType: AlertType;
    let severity: AlertSeverity;

    if (type === 'monthly') {
      // Monthly email
      const { name: monthName } = getPreviousMonth();

      const sortedBySuccess = [...byType].sort((a, b) => b.successRate - a.successRate);
      const bestPerforming = sortedBySuccess.length > 0 ? sortedBySuccess[0].type : undefined;
      const needsImprovement = sortedBySuccess.length > 0 ? sortedBySuccess[sortedBySuccess.length - 1].type : undefined;

      emailContent = generateMarketingMonthlyEmail({
        userName: user.name,
        monthName,
        totalTasks,
        successTasks,
        failedTasks,
        successRate,
        leadsGenerated,
        byType,
        bestPerforming,
        needsImprovement,
        teamRank: 1,
        teamTotal: 1,
      });

      alertType = AlertType.MARKETING_MONTHLY;
      severity = successRate < 15 ? AlertSeverity.RED : successRate >= 40 ? AlertSeverity.GREEN : AlertSeverity.YELLOW;
    } else {
      // Weekly email
      severity = successRate < 15 ? AlertSeverity.RED : successRate >= 50 ? AlertSeverity.GREEN : successRate < 25 ? AlertSeverity.YELLOW : AlertSeverity.GREEN;
      alertType = severity === AlertSeverity.RED ? AlertType.MARKETING_RED : severity === AlertSeverity.GREEN ? AlertType.MARKETING_GREEN : AlertType.MARKETING_YELLOW;

      emailContent = generateMarketingAlertEmail({
        userName: user.name,
        severity,
        totalTasks,
        successTasks,
        failedTasks,
        successRate,
        leadsGenerated,
        teamAverage: successRate,
        byType: byType.map(t => ({ type: t.type, count: t.count, successRate: t.successRate })),
      });
    }

    // Send the email
    const messageId = await sendAlertEmail({
      userId: user.id,
      userEmail: user.email,
      alertType,
      severity,
      subject: emailContent.subject,
      htmlBody: emailContent.html,
      textBody: emailContent.text,
      ccRecipients: getCcRecipients(severity),
      period: `test-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      type,
      sentTo: user.email,
      subject: emailContent.subject,
      severity,
      stats: { totalTasks, successTasks, failedTasks, successRate, leadsGenerated },
      messageId,
    });
  } catch (error) {
    console.error('Test email failed:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
