import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail, RECIPIENTS } from '@/lib/email/ses-client';
import { getCurrentWeekPeriod, isUserInGracePeriod, getAlertSubject } from '@/lib/email/helpers';
import { generateMarketingWeeklyEmail, TaskTypeStats, TemplateStats } from '@/lib/email/templates/marketing-weekly';
import { AlertType, AlertSeverity, MarketingTaskType } from '@prisma/client';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// Map task types to display names
const taskTypeDisplayNames: Record<MarketingTaskType, string> = {
  LINKEDIN_OUTREACH: 'LinkedIn Outreach',
  COLD_EMAIL: 'Cold Email',
  SOCIAL_POST: 'Social Posts',
  BLOG_POST: 'Blog Posts',
  EMAIL_CAMPAIGN: 'Email Campaigns',
  EVENT: 'Events',
  WEBINAR: 'Webinars',
  CONTENT_CREATION: 'Content Creation',
  OTHER: 'Other',
};

export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron call
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const weekPeriod = getCurrentWeekPeriod();

    // Get date 7 days ago
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get date 3 days ago (for stale outcome check)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get all marketing reps
    const marketingReps = await prisma.user.findMany({
      where: {
        role: 'MARKETING_REP',
        isActive: true,
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

    const results: Array<{ userId: string; userName: string; status: string; severity?: string }> = [];

    for (const user of marketingReps) {
      // Check for active exclusion
      const exclusion = await prisma.userAlertExclusion.findFirst({
        where: {
          userId: user.id,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });

      if (exclusion) {
        results.push({ userId: user.id, userName: user.name, status: 'excluded' });
        continue;
      }

      // Get all completed tasks for this user in the last 7 days
      const tasks = await prisma.marketingTask.findMany({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          taskDate: { gte: sevenDaysAgo },
          isTemplate: false,
        },
      });

      // Calculate metrics
      const tasksCompleted = tasks.length;
      const tasksWithOutcome = tasks.filter(t => t.outcome !== null);
      const successfulTasks = tasks.filter(t => t.outcome === 'SUCCESS');
      const successRate = tasksWithOutcome.length > 0
        ? (successfulTasks.length / tasksWithOutcome.length) * 100
        : 0;
      const leadsGenerated = tasks.filter(t => t.leadGenerated).length;

      // Tasks with no outcome set after 3+ days
      const tasksNoOutcome = await prisma.marketingTask.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          outcome: null,
          taskDate: { lte: threeDaysAgo },
          isTemplate: false,
        },
      });

      // Calculate by type breakdown
      const tasksByType: TaskTypeStats[] = [];
      for (const taskType of Object.values(MarketingTaskType)) {
        const typeTasks = tasks.filter(t => t.type === taskType);
        const typeWithOutcome = typeTasks.filter(t => t.outcome !== null);
        const typeSuccessful = typeTasks.filter(t => t.outcome === 'SUCCESS');
        const typeLeads = typeTasks.filter(t => t.leadGenerated).length;

        tasksByType.push({
          type: taskType,
          displayName: taskTypeDisplayNames[taskType],
          tasksCompleted: typeTasks.length,
          successRate: typeWithOutcome.length > 0
            ? (typeSuccessful.length / typeWithOutcome.length) * 100
            : 0,
          leadsGenerated: typeLeads,
        });
      }

      // Get template performance (top and bottom performers)
      const templateTasks = tasks.filter(t => t.templateId !== null);
      const templateStats = new Map<string, { name: string; success: number; total: number; leads: number }>();

      for (const task of templateTasks) {
        const templateId = task.templateId!;
        const existing = templateStats.get(templateId) || {
          name: task.templateName || 'Unknown Template',
          success: 0,
          total: 0,
          leads: 0
        };

        if (task.outcome !== null) {
          existing.total++;
          if (task.outcome === 'SUCCESS') {
            existing.success++;
          }
        }
        if (task.leadGenerated) {
          existing.leads++;
        }

        templateStats.set(templateId, existing);
      }

      // Convert to arrays and sort
      const templateArray: TemplateStats[] = Array.from(templateStats.entries())
        .filter(([, stats]) => stats.total >= 2) // Only include templates with 2+ outcomes
        .map(([, stats]) => ({
          templateName: stats.name,
          successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
          leadsGenerated: stats.leads,
        }));

      const topPerformers = templateArray
        .filter(t => t.successRate >= 70)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 3);

      const bottomPerformers = templateArray
        .filter(t => t.successRate < 30)
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, 3);

      // Determine severity
      let severity: AlertSeverity;
      let alertType: AlertType;
      const issues: string[] = [];

      if (successRate < 30 || leadsGenerated < 3 || tasksNoOutcome > 5) {
        severity = AlertSeverity.RED;
        alertType = AlertType.MARKETING_RED;

        if (successRate < 30) {
          issues.push(`Success rate (${Math.round(successRate)}%) is below 30% threshold`);
        }
        if (leadsGenerated < 3) {
          issues.push(`Only ${leadsGenerated} leads generated (target: 5/week)`);
        }
        if (tasksNoOutcome > 5) {
          issues.push(`${tasksNoOutcome} tasks have no outcome set after 3+ days`);
        }
        if (tasksCompleted < 10) {
          issues.push(`Low task volume: only ${tasksCompleted} tasks completed`);
        }
      } else if (successRate < 70 || leadsGenerated < 5) {
        severity = AlertSeverity.YELLOW;
        alertType = AlertType.MARKETING_YELLOW;
      } else {
        severity = AlertSeverity.GREEN;
        alertType = AlertType.MARKETING_GREEN;
      }

      // Check if alert already sent for this week
      const existingAlert = await prisma.quotaAlert.findUnique({
        where: {
          userId_alertType_period: {
            userId: user.id,
            alertType,
            period: weekPeriod,
          },
        },
      });

      if (existingAlert) {
        results.push({ userId: user.id, userName: user.name, status: 'already_sent', severity });
        continue;
      }

      // Generate email
      const emailContent = generateMarketingWeeklyEmail({
        userName: user.name,
        severity,
        tasksCompleted,
        successRate,
        leadsGenerated,
        tasksByType,
        topPerformers,
        bottomPerformers,
        tasksWithNoOutcome: tasksNoOutcome,
        issues,
      });

      // Determine CC recipients based on severity
      // CEO is always CC'd on marketing weekly alerts
      const ccRecipients: string[] = [RECIPIENTS.CEO];
      if (severity === 'RED' || severity === 'GREEN') {
        ccRecipients.push(RECIPIENTS.HR);
      } else if (severity === 'YELLOW') {
        ccRecipients.push(RECIPIENTS.SAM);
      }

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
          ccRecipients,
          period: weekPeriod,
        });

        // Record alert to prevent duplicates
        await prisma.quotaAlert.create({
          data: {
            userId: user.id,
            alertType,
            severity,
            period: weekPeriod,
          },
        });

        results.push({ userId: user.id, userName: user.name, status: 'alert_sent', severity });
      } catch (emailError) {
        console.error(`Failed to send marketing weekly alert to ${user.email}:`, emailError);
        results.push({ userId: user.id, userName: user.name, status: 'email_failed', severity });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Marketing weekly cron failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
