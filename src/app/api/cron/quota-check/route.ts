import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail } from '@/lib/email/ses-client';
import { getCcRecipients, getDaysRemainingInMonth, getCurrentPeriod, getMonthDateRange, isUserInGracePeriod, getAlertSubject } from '@/lib/email/helpers';
import { generateQuotaAlertEmail } from '@/lib/email/templates/quota';
import { AlertType, AlertSeverity, DealStage } from '@prisma/client';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  // Verify this is a legitimate cron call
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentPeriod = getCurrentPeriod();
    const daysRemaining = getDaysRemainingInMonth();
    const { start: monthStart, end: monthEnd } = getMonthDateRange(currentYear, currentMonth);

    // Get all users with SALES_REP or MARKETING_REP role
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['SALES_REP', 'MARKETING_REP'] },
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

    for (const user of users) {
      // Get or create user quota for this month
      let userQuota = await prisma.userQuota.findUnique({
        where: {
          userId_year_month: {
            userId: user.id,
            year: currentYear,
            month: currentMonth,
          },
        },
      });

      if (!userQuota) {
        userQuota = await prisma.userQuota.create({
          data: {
            userId: user.id,
            year: currentYear,
            month: currentMonth,
            targetAmount: 3000, // Default quota
          },
        });
      }

      // Calculate actual quota achieved (CLOSED_WON deals this month)
      const wonDeals = await prisma.deal.aggregate({
        where: {
          ownerId: user.id,
          stage: DealStage.CLOSED_WON,
          updatedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: { amountTotal: true },
      });

      const quotaActual = wonDeals._sum.amountTotal || 0;
      const quotaPercentage = (quotaActual / userQuota.targetAmount) * 100;

      // Determine severity
      let alertType: AlertType | null = null;
      let severity: AlertSeverity | null = null;

      if (quotaPercentage >= 100) {
        alertType = AlertType.QUOTA_GREEN;
        severity = AlertSeverity.GREEN;
      } else if (quotaPercentage >= 80) {
        alertType = AlertType.QUOTA_YELLOW;
        severity = AlertSeverity.YELLOW;
      } else if (quotaPercentage < 50 && daysRemaining < 10) {
        alertType = AlertType.QUOTA_RED;
        severity = AlertSeverity.RED;
      }

      // Skip if no alert needed
      if (!alertType || !severity) {
        results.push({ userId: user.id, userName: user.name, status: 'no_alert_needed' });
        continue;
      }

      // Check if alert already sent for this period
      const existingAlert = await prisma.quotaAlert.findUnique({
        where: {
          userId_alertType_period: {
            userId: user.id,
            alertType,
            period: currentPeriod,
          },
        },
      });

      if (existingAlert) {
        results.push({ userId: user.id, userName: user.name, status: 'already_sent', severity });
        continue;
      }

      // Generate and send email
      const emailContent = generateQuotaAlertEmail({
        userName: user.name,
        quotaTarget: userQuota.targetAmount,
        quotaActual,
        daysRemaining,
        severity,
      });

      const ccRecipients = getCcRecipients(severity);
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
          quotaTarget: userQuota.targetAmount,
          quotaActual,
          period: currentPeriod,
        });

        // Record alert to prevent duplicates
        await prisma.quotaAlert.create({
          data: {
            userId: user.id,
            alertType,
            severity,
            period: currentPeriod,
          },
        });

        results.push({ userId: user.id, userName: user.name, status: 'alert_sent', severity });
      } catch (emailError) {
        console.error(`Failed to send quota alert to ${user.email}:`, emailError);
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
    console.error('Quota check cron failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
