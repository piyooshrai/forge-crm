import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail, RECIPIENTS } from '@/lib/email/ses-client';
import { getCcRecipients, getPreviousMonth, daysSince } from '@/lib/email/helpers';
import { generateMonthlyReviewEmail } from '@/lib/email/templates/monthly-review';
import { AlertType, AlertSeverity, DealStage } from '@prisma/client';

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { year, month, name: monthName, start: monthStart, end: monthEnd } = getPreviousMonth();
    const period = `${year}-${String(month).padStart(2, '0')}`;

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['SALES_REP', 'MARKETING_REP'] },
      },
    });

    // Calculate rankings
    const userMetrics: Array<{
      user: typeof users[0];
      quotaActual: number;
      percentage: number;
    }> = [];

    for (const user of users) {
      const wonDeals = await prisma.deal.aggregate({
        where: {
          ownerId: user.id,
          stage: DealStage.CLOSED_WON,
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountTotal: true },
      });

      let userQuota = await prisma.userQuota.findUnique({
        where: {
          userId_year_month: { userId: user.id, year, month },
        },
      });

      const quotaTarget = userQuota?.targetAmount || 3000;
      const quotaActual = wonDeals._sum.amountTotal || 0;
      const percentage = (quotaActual / quotaTarget) * 100;

      userMetrics.push({ user, quotaActual, percentage });
    }

    // Sort by percentage for ranking
    userMetrics.sort((a, b) => b.percentage - a.percentage);

    const results: Array<{ userId: string; userName: string; status: string; severity?: string; percentage?: number }> = [];

    for (let i = 0; i < userMetrics.length; i++) {
      const { user, quotaActual, percentage } = userMetrics[i];
      const rank = i + 1;

      // Get quota for previous month
      let userQuota = await prisma.userQuota.findUnique({
        where: {
          userId_year_month: { userId: user.id, year, month },
        },
      });

      const quotaTarget = userQuota?.targetAmount || 3000;

      // Get won deals in previous month
      const wonDeals = await prisma.deal.findMany({
        where: {
          ownerId: user.id,
          stage: DealStage.CLOSED_WON,
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
      });

      // Get all closed deals in previous month
      const closedDeals = await prisma.deal.findMany({
        where: {
          ownerId: user.id,
          stage: { in: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
      });

      // Get total activities
      const activityCount = await prisma.activity.count({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      // Count stale deals
      const activeDeals = await prisma.deal.findMany({
        where: {
          ownerId: user.id,
          stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
        },
        select: { updatedAt: true },
      });
      const staleDealCount = activeDeals.filter(d => daysSince(d.updatedAt) > 14).length;

      // Task completion rate
      const totalTasks = await prisma.task.count({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });
      const completedTasks = await prisma.task.count({
        where: {
          userId: user.id,
          completed: true,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

      // Calculate metrics
      const totalDealsWon = wonDeals.length;
      const totalDealsClosed = closedDeals.length;
      const winRate = totalDealsClosed > 0 ? (totalDealsWon / totalDealsClosed) * 100 : 0;
      const averageDealSize = totalDealsWon > 0 ? quotaActual / totalDealsWon : 0;

      // Determine severity
      let alertType: AlertType;
      let severity: AlertSeverity;

      if (percentage >= 100) {
        alertType = AlertType.MONTHLY_GREEN;
        severity = AlertSeverity.GREEN;
      } else if (percentage >= 80) {
        alertType = AlertType.MONTHLY_YELLOW;
        severity = AlertSeverity.YELLOW;
      } else {
        alertType = AlertType.MONTHLY_RED;
        severity = AlertSeverity.RED;
      }

      // Check for existing alert
      const existingAlert = await prisma.quotaAlert.findUnique({
        where: {
          userId_alertType_period: { userId: user.id, alertType, period },
        },
      });

      if (existingAlert) {
        results.push({ userId: user.id, userName: user.name, status: 'already_sent', severity, percentage });
        continue;
      }

      const emailContent = generateMonthlyReviewEmail({
        userName: user.name,
        severity,
        month: monthName,
        quotaTarget,
        quotaActual,
        totalDealsWon,
        totalDealsClosed,
        totalActivities: activityCount,
        winRate,
        averageDealSize,
        rank,
        teamSize: users.length,
        staleDealCount,
        taskCompletionRate,
      });

      // Special CC logic for monthly review
      let ccRecipients: string[];

      if (severity === AlertSeverity.RED) {
        // RED monthly: HR + CEO
        ccRecipients = [RECIPIENTS.HR, RECIPIENTS.CEO];
      } else if (severity === AlertSeverity.YELLOW) {
        // YELLOW monthly: HR + Sam
        ccRecipients = [RECIPIENTS.HR, RECIPIENTS.SAM];
      } else {
        // GREEN: HR only
        ccRecipients = [RECIPIENTS.HR];
      }

      try {
        await sendAlertEmail({
          userId: user.id,
          userEmail: user.email,
          alertType,
          severity,
          subject: emailContent.subject,
          htmlBody: emailContent.html,
          textBody: emailContent.text,
          ccRecipients,
          quotaTarget,
          quotaActual,
          period,
        });

        await prisma.quotaAlert.create({
          data: { userId: user.id, alertType, severity, period },
        });

        results.push({ userId: user.id, userName: user.name, status: 'alert_sent', severity, percentage });
      } catch (emailError) {
        console.error(`Failed to send monthly review to ${user.email}:`, emailError);
        results.push({ userId: user.id, userName: user.name, status: 'email_failed', severity, percentage });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      period,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Monthly review cron failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
