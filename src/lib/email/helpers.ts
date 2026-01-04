import { AlertSeverity } from '@prisma/client';
import { RECIPIENTS } from './ses-client';

// Determine CC recipients based on severity
export function getCcRecipients(
  severity: AlertSeverity,
  includeHR: boolean = true,
  includeCEO: boolean = false
): string[] {
  const cc: string[] = [];

  switch (severity) {
    case 'RED':
      if (includeHR) cc.push(RECIPIENTS.HR);
      if (includeCEO) cc.push(RECIPIENTS.CEO);
      break;
    case 'YELLOW':
      cc.push(RECIPIENTS.SAM);
      break;
    case 'GREEN':
      if (includeHR) cc.push(RECIPIENTS.HR);
      break;
  }

  return cc;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

// Get days remaining in month
export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

// Get current period string (YYYY-MM)
export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Get current week period string (YYYY-Www)
export function getCurrentWeekPeriod(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Get month start and end dates
export function getMonthDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

// Get week start date (Monday)
export function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(now);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// Calculate days since a date
export function daysSince(date: Date): number {
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Get previous month info
export function getPreviousMonth(): { year: number; month: number; name: string; start: Date; end: Date } {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  return {
    year: previousMonth.getFullYear(),
    month: previousMonth.getMonth() + 1,
    name: previousMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    start: previousMonth,
    end: previousMonthEnd,
  };
}

// Grace period: 14 days from hiredAt date
const GRACE_PERIOD_DAYS = 14;

// Check if user is within their onboarding grace period
export function isUserInGracePeriod(hiredAt: Date | null): boolean {
  if (!hiredAt) return false;
  const gracePeriodEnd = new Date(hiredAt);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
  return new Date() < gracePeriodEnd;
}

// Get alert subject with optional [ONBOARDING] prefix for users in grace period
export function getAlertSubject(subject: string, isInGracePeriod: boolean): string {
  return isInGracePeriod ? `[ONBOARDING] ${subject}` : subject;
}

// Get days remaining in grace period
export function getGracePeriodDaysRemaining(hiredAt: Date | null): number {
  if (!hiredAt) return 0;
  const gracePeriodEnd = new Date(hiredAt);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
  const remaining = Math.ceil((gracePeriodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}
