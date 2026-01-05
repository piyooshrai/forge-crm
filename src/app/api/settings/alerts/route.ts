import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AlertCategory } from '@prisma/client';

// Only SUPER_ADMIN can access alert settings
async function checkSuperAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    return { authorized: false, error: 'Forbidden', status: 403 };
  }

  return { authorized: true, session };
}

// Default thresholds for each alert category
const defaultThresholds: Record<AlertCategory, { red: number; yellow: number; green: number; schedule?: string }> = {
  QUOTA: { red: 50, yellow: 80, green: 100 },       // Percentage of quota
  STALE: { red: 14, yellow: 7, green: 0 },          // Days since activity
  ACTIVITY: { red: 50, yellow: 75, green: 100 },    // Percentage of target
  TASK: { red: 3, yellow: 1, green: 0 },            // Overdue tasks count
  MARKETING: { red: 30, yellow: 50, green: 70 },    // Success percentage
  MARKETING_WEEKLY: { red: 30, yellow: 50, green: 70, schedule: '0 17 * * 5' },  // Friday 5pm
  MONTHLY: { red: 50, yellow: 80, green: 100 },     // Monthly review thresholds
};

// GET - Fetch all alert configurations and global settings
export async function GET() {
  const authCheck = await checkSuperAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    // Get all alert configs
    let alertConfigs = await prisma.alertConfig.findMany({
      orderBy: { alertCategory: 'asc' },
    });

    // All expected categories
    const allCategories: AlertCategory[] = ['QUOTA', 'STALE', 'ACTIVITY', 'TASK', 'MARKETING', 'MARKETING_WEEKLY', 'MONTHLY'];

    // Find missing categories and create them
    const existingCategories = new Set(alertConfigs.map(c => c.alertCategory));
    const missingCategories = allCategories.filter(cat => !existingCategories.has(cat));

    if (missingCategories.length > 0) {
      for (const category of missingCategories) {
        const defaults = defaultThresholds[category];
        await prisma.alertConfig.create({
          data: {
            alertCategory: category,
            enabled: true,
            schedule: defaults.schedule || '0 9 * * 1-5',
            redThreshold: defaults.red,
            yellowThreshold: defaults.yellow,
            greenThreshold: defaults.green,
            ccRecipients: [],
            bccAdmin: false,
            testMode: false,
          },
        });
      }

      alertConfigs = await prisma.alertConfig.findMany({
        orderBy: { alertCategory: 'asc' },
      });
    }

    // Get global settings (create if doesn't exist)
    let globalSettings = await prisma.globalAlertSettings.findFirst();

    if (!globalSettings) {
      globalSettings = await prisma.globalAlertSettings.create({
        data: {
          fromEmail: 'alerts@forge-crm.com',
          bccAllToAdmin: false,
          adminEmail: 'admin@forge-crm.com',
          testMode: false,
        },
      });
    }

    // Get active user exclusions
    const now = new Date();
    const exclusions = await prisma.userAlertExclusion.findMany({
      where: {
        endDate: { gte: now },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // Get alert history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const alertHistory = await prisma.emailLog.findMany({
      where: {
        sentAt: { gte: thirtyDaysAgo },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    // Get all users for exclusion dropdown
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      alertConfigs,
      globalSettings,
      exclusions,
      alertHistory,
      users,
    });
  } catch (error) {
    console.error('Error fetching alert settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update alert configurations or global settings
export async function PATCH(req: NextRequest) {
  const authCheck = await checkSuperAdmin();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await req.json();
    const { type, id, data } = body;

    if (type === 'alertConfig') {
      const config = await prisma.alertConfig.update({
        where: { id },
        data: {
          enabled: data.enabled,
          schedule: data.schedule,
          redThreshold: data.redThreshold,
          yellowThreshold: data.yellowThreshold,
          greenThreshold: data.greenThreshold,
          ccRecipients: data.ccRecipients,
          bccAdmin: data.bccAdmin,
          testMode: data.testMode,
        },
      });
      return NextResponse.json(config);
    }

    if (type === 'globalSettings') {
      const settings = await prisma.globalAlertSettings.update({
        where: { id },
        data: {
          fromEmail: data.fromEmail,
          bccAllToAdmin: data.bccAllToAdmin,
          adminEmail: data.adminEmail,
          testMode: data.testMode,
        },
      });
      return NextResponse.json(settings);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error updating alert settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
