import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Get total steps for each role
function getTotalSteps(role: UserRole): number {
  switch (role) {
    case UserRole.SALES_REP:
      return 5;
    case UserRole.MARKETING_REP:
      return 5;
    case UserRole.SUPER_ADMIN:
      return 2;
    default:
      return 5;
  }
}

// Get redirect path for each role after onboarding
function getRedirectPath(role: UserRole): string {
  switch (role) {
    case UserRole.SALES_REP:
      return '/deals';
    case UserRole.MARKETING_REP:
      return '/marketing/tasks';
    case UserRole.SUPER_ADMIN:
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

// GET: Get onboarding status for current user
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      id: true,
      name: true,
      role: true,
      monthlyQuota: true,
      onboardingCompleted: true,
      onboardingCompletedAt: true,
      onboardingStep: true,
      hiredAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    completed: user.onboardingCompleted,
    completedAt: user.onboardingCompletedAt,
    step: user.onboardingStep,
    totalSteps: getTotalSteps(user.role),
    role: user.role,
    name: user.name,
    monthlyQuota: user.monthlyQuota,
    hiredAt: user.hiredAt,
  });
}

// POST: Mark onboarding as complete
export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true, hiredAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const now = new Date();

  // Update user as completed
  // Only set hiredAt if not already set (for new hires, triggers grace period)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingCompleted: true,
      onboardingCompletedAt: now,
      onboardingStep: getTotalSteps(user.role),
      ...(user.hiredAt === null ? { hiredAt: now } : {}),
    },
  });

  return NextResponse.json({
    success: true,
    completedAt: now.toISOString(),
    redirectTo: getRedirectPath(user.role),
  });
}
