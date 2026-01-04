import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail } from '@/lib/email/ses-client';
import { getCcRecipients, getCurrentPeriod, daysSince, isUserInGracePeriod, getAlertSubject } from '@/lib/email/helpers';
import { generateStaleAlertEmail } from '@/lib/email/templates/stale';
import { AlertType, AlertSeverity, DealStage, LeadStatus } from '@prisma/client';

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Daily dedup - include date in period
    const currentPeriod = getCurrentPeriod() + '-' + new Date().getDate();

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
      // Get active deals (not closed)
      const deals = await prisma.deal.findMany({
        where: {
          ownerId: user.id,
          stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
        },
        select: { id: true, name: true, updatedAt: true },
      });

      // Get active leads (not converted)
      const leads = await prisma.lead.findMany({
        where: {
          ownerId: user.id,
          isConverted: false,
          status: { notIn: [LeadStatus.UNQUALIFIED] },
        },
        select: { id: true, name: true, updatedAt: true },
      });

      // Categorize stale items
      const staleDealsRed = deals
        .filter(d => daysSince(d.updatedAt) > 14)
        .map(d => ({ id: d.id, name: d.name, daysSinceUpdate: daysSince(d.updatedAt) }));

      const staleDealsYellow = deals
        .filter(d => daysSince(d.updatedAt) >= 7 && daysSince(d.updatedAt) <= 13)
        .map(d => ({ id: d.id, name: d.name, daysSinceUpdate: daysSince(d.updatedAt) }));

      const staleLeadsRed = leads
        .filter(l => daysSince(l.updatedAt) > 7)
        .map(l => ({ id: l.id, name: l.name, daysSinceUpdate: daysSince(l.updatedAt) }));

      const staleLeadsYellow = leads
        .filter(l => daysSince(l.updatedAt) >= 3 && daysSince(l.updatedAt) <= 6)
        .map(l => ({ id: l.id, name: l.name, daysSinceUpdate: daysSince(l.updatedAt) }));

      // Determine severity
      const hasRed = staleDealsRed.length > 0 || staleLeadsRed.length > 0;
      const hasYellow = staleDealsYellow.length > 0 || staleLeadsYellow.length > 0;

      if (!hasRed && !hasYellow) {
        results.push({ userId: user.id, userName: user.name, status: 'no_stale_items' });
        continue;
      }

      // Send RED alert if needed
      if (hasRed) {
        const alertType = AlertType.STALE_RED;
        const existingAlert = await prisma.quotaAlert.findUnique({
          where: {
            userId_alertType_period: { userId: user.id, alertType, period: currentPeriod },
          },
        });

        if (!existingAlert) {
          const emailContent = generateStaleAlertEmail({
            userName: user.name,
            severity: 'RED',
            staleDeals: staleDealsRed,
            staleLeads: staleLeadsRed,
          });

          const inGracePeriod = isUserInGracePeriod(user.hiredAt);
          const subject = getAlertSubject(emailContent.subject, inGracePeriod);

          try {
            await sendAlertEmail({
              userId: user.id,
              userEmail: user.email,
              alertType,
              severity: AlertSeverity.RED,
              subject,
              htmlBody: emailContent.html,
              textBody: emailContent.text,
              ccRecipients: getCcRecipients(AlertSeverity.RED),
              period: currentPeriod,
            });

            await prisma.quotaAlert.create({
              data: { userId: user.id, alertType, severity: AlertSeverity.RED, period: currentPeriod },
            });

            results.push({ userId: user.id, userName: user.name, status: 'red_alert_sent', severity: 'RED' });
          } catch (emailError) {
            console.error(`Failed to send stale RED alert to ${user.email}:`, emailError);
            results.push({ userId: user.id, userName: user.name, status: 'email_failed', severity: 'RED' });
          }
        } else {
          results.push({ userId: user.id, userName: user.name, status: 'already_sent', severity: 'RED' });
        }
      }
      // Send YELLOW alert if needed (and no RED)
      else if (hasYellow) {
        const alertType = AlertType.STALE_YELLOW;
        const existingAlert = await prisma.quotaAlert.findUnique({
          where: {
            userId_alertType_period: { userId: user.id, alertType, period: currentPeriod },
          },
        });

        if (!existingAlert) {
          const emailContent = generateStaleAlertEmail({
            userName: user.name,
            severity: 'YELLOW',
            staleDeals: staleDealsYellow,
            staleLeads: staleLeadsYellow,
          });

          const inGracePeriod = isUserInGracePeriod(user.hiredAt);
          const subject = getAlertSubject(emailContent.subject, inGracePeriod);

          try {
            await sendAlertEmail({
              userId: user.id,
              userEmail: user.email,
              alertType,
              severity: AlertSeverity.YELLOW,
              subject,
              htmlBody: emailContent.html,
              textBody: emailContent.text,
              ccRecipients: getCcRecipients(AlertSeverity.YELLOW),
              period: currentPeriod,
            });

            await prisma.quotaAlert.create({
              data: { userId: user.id, alertType, severity: AlertSeverity.YELLOW, period: currentPeriod },
            });

            results.push({ userId: user.id, userName: user.name, status: 'yellow_alert_sent', severity: 'YELLOW' });
          } catch (emailError) {
            console.error(`Failed to send stale YELLOW alert to ${user.email}:`, emailError);
            results.push({ userId: user.id, userName: user.name, status: 'email_failed', severity: 'YELLOW' });
          }
        } else {
          results.push({ userId: user.id, userName: user.name, status: 'already_sent', severity: 'YELLOW' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stale check cron failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
