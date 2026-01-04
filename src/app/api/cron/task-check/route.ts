import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlertEmail } from '@/lib/email/ses-client';
import { getCcRecipients, getCurrentPeriod, isUserInGracePeriod, getAlertSubject } from '@/lib/email/helpers';
import { generateTaskAlertEmail } from '@/lib/email/templates/task';
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
    // Daily dedup
    const currentPeriod = getCurrentPeriod() + '-' + new Date().getDate();
    const now = new Date();

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

    const results: Array<{ userId: string; userName: string; status: string; severity?: string; overdueCount?: number }> = [];

    for (const user of users) {
      // Get overdue tasks
      const overdueTasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          completed: false,
          dueDate: { lt: now },
        },
        orderBy: { dueDate: 'asc' },
      });

      if (overdueTasks.length === 0) {
        results.push({ userId: user.id, userName: user.name, status: 'no_overdue_tasks', overdueCount: 0 });
        continue;
      }

      let alertType: AlertType;
      let severity: AlertSeverity;

      if (overdueTasks.length >= 3) {
        alertType = AlertType.TASK_RED;
        severity = AlertSeverity.RED;
      } else {
        alertType = AlertType.TASK_YELLOW;
        severity = AlertSeverity.YELLOW;
      }

      // Check for existing alert
      const existingAlert = await prisma.quotaAlert.findUnique({
        where: {
          userId_alertType_period: { userId: user.id, alertType, period: currentPeriod },
        },
      });

      if (existingAlert) {
        results.push({ userId: user.id, userName: user.name, status: 'already_sent', severity, overdueCount: overdueTasks.length });
        continue;
      }

      const taskData = overdueTasks.slice(0, 10).map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate!,
        daysOverdue: Math.floor((now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)),
      }));

      const emailContent = generateTaskAlertEmail({
        userName: user.name,
        severity,
        overdueTasks: taskData,
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

        results.push({ userId: user.id, userName: user.name, status: 'alert_sent', severity, overdueCount: overdueTasks.length });
      } catch (emailError) {
        console.error(`Failed to send task alert to ${user.email}:`, emailError);
        results.push({ userId: user.id, userName: user.name, status: 'email_failed', severity, overdueCount: overdueTasks.length });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Task check cron failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
