import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail } from '@/lib/email/ses-client';
import { getCcRecipients, getCurrentWeekPeriod, getWeekStart, isUserInGracePeriod, getAlertSubject } from '@/lib/email/helpers';
import { generateActivityAlertEmail } from '@/lib/email/templates/activity';
import { AlertType, AlertSeverity, UserRole, ActivityType } from '@prisma/client';

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// Expected activities per week by role
const EXPECTED_ACTIVITIES: Record<string, number> = {
  SALES_REP: 20,
  MARKETING_REP: 15,
};

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentPeriod = getCurrentWeekPeriod();
    const weekStart = getWeekStart();

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['SALES_REP', 'MARKETING_REP'] },
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

    // Calculate team average for comparison
    const allActivities = await prisma.activity.count({
      where: {
        createdAt: { gte: weekStart },
        user: { role: { in: ['SALES_REP', 'MARKETING_REP'] }, excludeFromReporting: false },
      },
    });
    const teamAverage = users.length > 0 ? Math.round(allActivities / users.length) : 0;

    const results: Array<{ userId: string; userName: string; status: string; severity?: string; activityCount?: number }> = [];

    for (const user of users) {
      const expectedActivities = EXPECTED_ACTIVITIES[user.role] || 15;

      // Count activities this week
      const activityCount = await prisma.activity.count({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart },
        },
      });

      // Get activity breakdown
      const activityBreakdown = await prisma.activity.groupBy({
        by: ['type'],
        where: {
          userId: user.id,
          createdAt: { gte: weekStart },
        },
        _count: true,
      });

      const breakdown = {
        calls: activityBreakdown.find(a => a.type === ActivityType.CALL)?._count || 0,
        emails: activityBreakdown.find(a => a.type === ActivityType.EMAIL)?._count || 0,
        meetings: activityBreakdown.find(a => a.type === ActivityType.MEETING)?._count || 0,
        notes: activityBreakdown.find(a => a.type === ActivityType.NOTE)?._count || 0,
      };

      const percentage = (activityCount / expectedActivities) * 100;

      let alertType: AlertType | null = null;
      let severity: AlertSeverity | null = null;

      if (percentage < 50) {
        alertType = AlertType.ACTIVITY_RED;
        severity = AlertSeverity.RED;
      } else if (percentage > 150) {
        alertType = AlertType.ACTIVITY_GREEN;
        severity = AlertSeverity.GREEN;
      }

      if (!alertType || !severity) {
        results.push({ userId: user.id, userName: user.name, status: 'no_alert_needed', activityCount });
        continue;
      }

      // Check for existing alert
      const existingAlert = await prisma.quotaAlert.findUnique({
        where: {
          userId_alertType_period: { userId: user.id, alertType, period: currentPeriod },
        },
      });

      if (existingAlert) {
        results.push({ userId: user.id, userName: user.name, status: 'already_sent', severity, activityCount });
        continue;
      }

      const emailContent = generateActivityAlertEmail({
        userName: user.name,
        severity,
        expectedActivities,
        actualActivities: activityCount,
        activityBreakdown: breakdown,
        teamAverage,
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

        results.push({ userId: user.id, userName: user.name, status: 'alert_sent', severity, activityCount });
      } catch (emailError) {
        console.error(`Failed to send activity alert to ${user.email}:`, emailError);
        results.push({ userId: user.id, userName: user.name, status: 'email_failed', severity, activityCount });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      teamAverage,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Activity check cron failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
