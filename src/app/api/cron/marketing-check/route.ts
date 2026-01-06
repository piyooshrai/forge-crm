import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail } from '@/lib/email/ses-client';
import { getCcRecipients, getCurrentWeekPeriod, getWeekStart, isUserInGracePeriod, getAlertSubject } from '@/lib/email/helpers';
import { generateMarketingAlertEmail } from '@/lib/email/templates/marketing';
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
    const currentPeriod = getCurrentWeekPeriod();
    const weekStart = getWeekStart();

    // Get all marketing reps
    const users = await prisma.user.findMany({
      where: {
        role: 'MARKETING_REP',
        excludeFromReporting: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hiredAt: true,
      },
    });

    // Calculate team averages
    const allTasks = await prisma.marketingTask.findMany({
      where: {
        taskDate: { gte: weekStart },
        user: { role: 'MARKETING_REP', excludeFromReporting: false },
        outcome: { not: null },
      },
    });

    const teamSuccesses = allTasks.filter(t => t.outcome === 'SUCCESS').length;
    const teamSuccessRate = allTasks.length > 0 ? Math.round((teamSuccesses / allTasks.length) * 100) : 0;

    const results: Array<{ userId: string; userName: string; status: string; severity?: string; successRate?: number }> = [];

    for (const user of users) {
      // Get user's tasks this week
      const userTasks = await prisma.marketingTask.findMany({
        where: {
          userId: user.id,
          taskDate: { gte: weekStart },
        },
      });

      const totalTasks = userTasks.length;
      const tasksWithOutcome = userTasks.filter(t => t.outcome);
      const successTasks = tasksWithOutcome.filter(t => t.outcome === 'SUCCESS').length;
      const failedTasks = tasksWithOutcome.filter(t => t.outcome === 'FAILED').length;
      const successRate = tasksWithOutcome.length > 0 ? Math.round((successTasks / tasksWithOutcome.length) * 100) : 0;
      const leadsGenerated = userTasks.filter(t => t.leadGenerated).length;

      // Determine alert type based on thresholds
      // RED: <15% success rate with at least 5 tasks
      // GREEN: >50% success rate with at least 5 tasks
      // YELLOW: 15-25% success rate with at least 5 tasks
      let alertType: AlertType | null = null;
      let severity: AlertSeverity | null = null;

      if (tasksWithOutcome.length >= 5) {
        if (successRate < 15) {
          alertType = AlertType.MARKETING_RED;
          severity = AlertSeverity.RED;
        } else if (successRate > 50) {
          alertType = AlertType.MARKETING_GREEN;
          severity = AlertSeverity.GREEN;
        } else if (successRate < 25) {
          alertType = AlertType.MARKETING_YELLOW;
          severity = AlertSeverity.YELLOW;
        }
      }

      if (!alertType || !severity) {
        results.push({ userId: user.id, userName: user.name, status: 'no_alert_needed', successRate });
        continue;
      }

      // Check for existing alert this week
      const existingAlert = await prisma.quotaAlert.findUnique({
        where: {
          userId_alertType_period: { userId: user.id, alertType, period: currentPeriod },
        },
      });

      if (existingAlert) {
        results.push({ userId: user.id, userName: user.name, status: 'already_sent', severity, successRate });
        continue;
      }

      // Get breakdown by type
      const byTypeMap = new Map<string, { count: number; success: number }>();
      userTasks.forEach(t => {
        if (!byTypeMap.has(t.type)) {
          byTypeMap.set(t.type, { count: 0, success: 0 });
        }
        const entry = byTypeMap.get(t.type)!;
        entry.count++;
        if (t.outcome === 'SUCCESS') entry.success++;
      });

      const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        successRate: data.count > 0 ? Math.round((data.success / data.count) * 100) : 0,
      }));

      const emailContent = generateMarketingAlertEmail({
        userName: user.name,
        severity,
        totalTasks,
        successTasks,
        failedTasks,
        successRate,
        leadsGenerated,
        teamAverage: teamSuccessRate,
        byType,
      });

      const inGracePeriod = isUserInGracePeriod(user.hiredAt);
      const subject = getAlertSubject(emailContent.subject, inGracePeriod);

      try {
        await sendAlertEmail({
          userId: user.id,
          userEmail: user.email,
          alertType,
          severity,
          subject,
          htmlBody: emailContent.html,
          textBody: emailContent.text,
          ccRecipients: getCcRecipients(severity),
          period: currentPeriod,
        });

        await prisma.quotaAlert.create({
          data: { userId: user.id, alertType, severity, period: currentPeriod },
        });

        results.push({ userId: user.id, userName: user.name, status: 'alert_sent', severity, successRate });
      } catch (emailError) {
        console.error(`Failed to send marketing alert to ${user.email}:`, emailError);
        results.push({ userId: user.id, userName: user.name, status: 'email_failed', severity, successRate });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      teamSuccessRate,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Marketing check cron failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
