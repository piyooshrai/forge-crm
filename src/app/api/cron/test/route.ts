import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail, RECIPIENTS } from '@/lib/email/ses-client';
import { getCcRecipients } from '@/lib/email/helpers';
import { generateQuotaAlertEmail } from '@/lib/email/templates/quota';
import { generateStaleAlertEmail } from '@/lib/email/templates/stale';
import { generateActivityAlertEmail } from '@/lib/email/templates/activity';
import { generateTaskAlertEmail } from '@/lib/email/templates/task';
import { generateMonthlyReviewEmail } from '@/lib/email/templates/monthly-review';
import { AlertType, AlertSeverity } from '@prisma/client';

// Test endpoint - sends sample emails to specified address
export async function GET(req: NextRequest) {
  const testEmail = req.nextUrl.searchParams.get('email') || 'piyoosh.rai@the-algo.com';
  const testType = req.nextUrl.searchParams.get('type') || 'all'; // all, quota, stale, activity, task, monthly

  // Get a real user for the userId (required for logging)
  const testUser = await prisma.user.findFirst({
    where: { role: 'SALES_REP' },
  });

  if (!testUser) {
    return NextResponse.json({ error: 'No test user found' }, { status: 404 });
  }

  const results: Array<{ type: string; severity: string; status: string; error?: string }> = [];
  const testPeriod = `TEST-${Date.now()}`;

  try {
    // ============ QUOTA ALERTS ============
    if (testType === 'all' || testType === 'quota') {
      // RED - Bad performance
      const quotaRed = generateQuotaAlertEmail({
        userName: 'John Smith',
        quotaTarget: 3000,
        quotaActual: 1350,
        daysRemaining: 8,
        severity: 'RED',
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.QUOTA_RED,
          severity: AlertSeverity.RED,
          subject: quotaRed.subject,
          htmlBody: quotaRed.html,
          textBody: quotaRed.text,
          ccRecipients: [], // No CC for test
          quotaTarget: 3000,
          quotaActual: 1350,
          period: testPeriod,
        });
        results.push({ type: 'QUOTA_RED', severity: 'RED', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'QUOTA_RED', severity: 'RED', status: 'failed', error: e.message });
      }

      // GREEN - Exceeded quota
      const quotaGreen = generateQuotaAlertEmail({
        userName: 'Sarah Johnson',
        quotaTarget: 3000,
        quotaActual: 3360,
        daysRemaining: 12,
        severity: 'GREEN',
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.QUOTA_GREEN,
          severity: AlertSeverity.GREEN,
          subject: quotaGreen.subject,
          htmlBody: quotaGreen.html,
          textBody: quotaGreen.text,
          ccRecipients: [],
          quotaTarget: 3000,
          quotaActual: 3360,
          period: testPeriod,
        });
        results.push({ type: 'QUOTA_GREEN', severity: 'GREEN', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'QUOTA_GREEN', severity: 'GREEN', status: 'failed', error: e.message });
      }

      // YELLOW - On track
      const quotaYellow = generateQuotaAlertEmail({
        userName: 'Mike Chen',
        quotaTarget: 3000,
        quotaActual: 2610,
        daysRemaining: 12,
        severity: 'YELLOW',
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.QUOTA_YELLOW,
          severity: AlertSeverity.YELLOW,
          subject: quotaYellow.subject,
          htmlBody: quotaYellow.html,
          textBody: quotaYellow.text,
          ccRecipients: [],
          quotaTarget: 3000,
          quotaActual: 2610,
          period: testPeriod,
        });
        results.push({ type: 'QUOTA_YELLOW', severity: 'YELLOW', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'QUOTA_YELLOW', severity: 'YELLOW', status: 'failed', error: e.message });
      }
    }

    // ============ STALE ALERTS ============
    if (testType === 'all' || testType === 'stale') {
      // RED - Critical stale items
      const staleRed = generateStaleAlertEmail({
        userName: 'John Smith',
        severity: 'RED',
        staleDeals: [
          { id: 'deal-1', name: 'Acme Corp - Cloud Migration', daysSinceUpdate: 18 },
          { id: 'deal-2', name: 'TechStart Inc - IT Support Contract', daysSinceUpdate: 16 },
          { id: 'deal-3', name: 'Global Systems - Staff Augmentation', daysSinceUpdate: 15 },
        ],
        staleLeads: [
          { id: 'lead-1', name: 'DataFlow Solutions', daysSinceUpdate: 12 },
          { id: 'lead-2', name: 'CloudNine Enterprises', daysSinceUpdate: 9 },
        ],
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.STALE_RED,
          severity: AlertSeverity.RED,
          subject: staleRed.subject,
          htmlBody: staleRed.html,
          textBody: staleRed.text,
          ccRecipients: [],
          period: testPeriod,
        });
        results.push({ type: 'STALE_RED', severity: 'RED', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'STALE_RED', severity: 'RED', status: 'failed', error: e.message });
      }

      // YELLOW - Reminder
      const staleYellow = generateStaleAlertEmail({
        userName: 'Sarah Johnson',
        severity: 'YELLOW',
        staleDeals: [
          { id: 'deal-4', name: 'InnovateTech - Software License', daysSinceUpdate: 10 },
        ],
        staleLeads: [
          { id: 'lead-3', name: 'StartupXYZ', daysSinceUpdate: 5 },
          { id: 'lead-4', name: 'Enterprise Co', daysSinceUpdate: 4 },
        ],
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.STALE_YELLOW,
          severity: AlertSeverity.YELLOW,
          subject: staleYellow.subject,
          htmlBody: staleYellow.html,
          textBody: staleYellow.text,
          ccRecipients: [],
          period: testPeriod,
        });
        results.push({ type: 'STALE_YELLOW', severity: 'YELLOW', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'STALE_YELLOW', severity: 'YELLOW', status: 'failed', error: e.message });
      }
    }

    // ============ ACTIVITY ALERTS ============
    if (testType === 'all' || testType === 'activity') {
      // RED - Low activity
      const activityRed = generateActivityAlertEmail({
        userName: 'John Smith',
        severity: 'RED',
        expectedActivities: 20,
        actualActivities: 8,
        activityBreakdown: { calls: 3, emails: 2, meetings: 1, notes: 2 },
        teamAverage: 18,
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.ACTIVITY_RED,
          severity: AlertSeverity.RED,
          subject: activityRed.subject,
          htmlBody: activityRed.html,
          textBody: activityRed.text,
          ccRecipients: [],
          period: testPeriod,
        });
        results.push({ type: 'ACTIVITY_RED', severity: 'RED', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'ACTIVITY_RED', severity: 'RED', status: 'failed', error: e.message });
      }

      // GREEN - High activity
      const activityGreen = generateActivityAlertEmail({
        userName: 'Sarah Johnson',
        severity: 'GREEN',
        expectedActivities: 20,
        actualActivities: 34,
        activityBreakdown: { calls: 12, emails: 10, meetings: 6, notes: 6 },
        teamAverage: 18,
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.ACTIVITY_GREEN,
          severity: AlertSeverity.GREEN,
          subject: activityGreen.subject,
          htmlBody: activityGreen.html,
          textBody: activityGreen.text,
          ccRecipients: [],
          period: testPeriod,
        });
        results.push({ type: 'ACTIVITY_GREEN', severity: 'GREEN', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'ACTIVITY_GREEN', severity: 'GREEN', status: 'failed', error: e.message });
      }
    }

    // ============ TASK ALERTS ============
    if (testType === 'all' || testType === 'task') {
      const now = new Date();

      // RED - Multiple overdue
      const taskRed = generateTaskAlertEmail({
        userName: 'John Smith',
        severity: 'RED',
        overdueTasks: [
          { id: 't1', title: 'Send proposal to Acme Corp', dueDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), daysOverdue: 8 },
          { id: 't2', title: 'Follow up with TechStart decision maker', dueDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), daysOverdue: 6 },
          { id: 't3', title: 'Schedule demo for Global Systems', dueDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), daysOverdue: 4 },
          { id: 't4', title: 'Review contract terms with legal', dueDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), daysOverdue: 4 },
          { id: 't5', title: 'Update Q1 forecast', dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), daysOverdue: 3 },
        ],
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.TASK_RED,
          severity: AlertSeverity.RED,
          subject: taskRed.subject,
          htmlBody: taskRed.html,
          textBody: taskRed.text,
          ccRecipients: [],
          period: testPeriod,
        });
        results.push({ type: 'TASK_RED', severity: 'RED', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'TASK_RED', severity: 'RED', status: 'failed', error: e.message });
      }

      // YELLOW - Single overdue
      const taskYellow = generateTaskAlertEmail({
        userName: 'Mike Chen',
        severity: 'YELLOW',
        overdueTasks: [
          { id: 't6', title: 'Send pricing quote to DataFlow', dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), daysOverdue: 2 },
        ],
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.TASK_YELLOW,
          severity: AlertSeverity.YELLOW,
          subject: taskYellow.subject,
          htmlBody: taskYellow.html,
          textBody: taskYellow.text,
          ccRecipients: [],
          period: testPeriod,
        });
        results.push({ type: 'TASK_YELLOW', severity: 'YELLOW', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'TASK_YELLOW', severity: 'YELLOW', status: 'failed', error: e.message });
      }
    }

    // ============ MONTHLY REVIEW ============
    if (testType === 'all' || testType === 'monthly') {
      // RED - Below expectations
      const monthlyRed = generateMonthlyReviewEmail({
        userName: 'John Smith',
        severity: 'RED',
        month: 'December 2025',
        quotaTarget: 3000,
        quotaActual: 1860,
        totalDealsWon: 2,
        totalDealsClosed: 8,
        totalActivities: 44,
        winRate: 25,
        averageDealSize: 930,
        rank: 4,
        teamSize: 4,
        staleDealCount: 6,
        taskCompletionRate: 65,
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.MONTHLY_RED,
          severity: AlertSeverity.RED,
          subject: monthlyRed.subject,
          htmlBody: monthlyRed.html,
          textBody: monthlyRed.text,
          ccRecipients: [],
          quotaTarget: 3000,
          quotaActual: 1860,
          period: testPeriod,
        });
        results.push({ type: 'MONTHLY_RED', severity: 'RED', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'MONTHLY_RED', severity: 'RED', status: 'failed', error: e.message });
      }

      // GREEN - Excellent
      const monthlyGreen = generateMonthlyReviewEmail({
        userName: 'Sarah Johnson',
        severity: 'GREEN',
        month: 'December 2025',
        quotaTarget: 3000,
        quotaActual: 3540,
        totalDealsWon: 7,
        totalDealsClosed: 12,
        totalActivities: 96,
        winRate: 58,
        averageDealSize: 506,
        rank: 1,
        teamSize: 4,
        staleDealCount: 0,
        taskCompletionRate: 95,
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.MONTHLY_GREEN,
          severity: AlertSeverity.GREEN,
          subject: monthlyGreen.subject,
          htmlBody: monthlyGreen.html,
          textBody: monthlyGreen.text,
          ccRecipients: [],
          quotaTarget: 3000,
          quotaActual: 3540,
          period: testPeriod,
        });
        results.push({ type: 'MONTHLY_GREEN', severity: 'GREEN', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'MONTHLY_GREEN', severity: 'GREEN', status: 'failed', error: e.message });
      }

      // YELLOW - On target
      const monthlyYellow = generateMonthlyReviewEmail({
        userName: 'Mike Chen',
        severity: 'YELLOW',
        month: 'December 2025',
        quotaTarget: 3000,
        quotaActual: 2700,
        totalDealsWon: 4,
        totalDealsClosed: 9,
        totalActivities: 72,
        winRate: 44,
        averageDealSize: 675,
        rank: 2,
        teamSize: 4,
        staleDealCount: 2,
        taskCompletionRate: 82,
      });

      try {
        await sendAlertEmail({
          userId: testUser.id,
          userEmail: testEmail,
          alertType: AlertType.MONTHLY_YELLOW,
          severity: AlertSeverity.YELLOW,
          subject: monthlyYellow.subject,
          htmlBody: monthlyYellow.html,
          textBody: monthlyYellow.text,
          ccRecipients: [],
          quotaTarget: 3000,
          quotaActual: 2700,
          period: testPeriod,
        });
        results.push({ type: 'MONTHLY_YELLOW', severity: 'YELLOW', status: 'sent' });
      } catch (e: any) {
        results.push({ type: 'MONTHLY_YELLOW', severity: 'YELLOW', status: 'failed', error: e.message });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({
      success: failed === 0,
      message: `Sent ${sent} test emails to ${testEmail}${failed > 0 ? `, ${failed} failed` : ''}`,
      testEmail,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Test cron failed:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message,
      results
    }, { status: 500 });
  }
}
