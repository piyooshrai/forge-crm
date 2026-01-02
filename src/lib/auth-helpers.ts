import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function canCreateDeal(role: UserRole): boolean {
  return role === UserRole.SALES_REP || role === UserRole.SUPER_ADMIN;
}

export function canEditDeal(role: UserRole): boolean {
  return role === UserRole.SALES_REP || role === UserRole.SUPER_ADMIN;
}

export function canSetDealStage(role: UserRole, stage: string): boolean {
  if (role === UserRole.SUPER_ADMIN) return true;
  if (role === UserRole.SALES_REP) return true;
  // MARKETING_REP cannot set Closed Won/Lost
  if (role === UserRole.MARKETING_REP) {
    return stage !== 'CLOSED_WON' && stage !== 'CLOSED_LOST';
  }
  return false;
}

export function canCreateLead(role: UserRole): boolean {
  return true; // Everyone can create leads
}

export function canEditLead(role: UserRole): boolean {
  return role === UserRole.MARKETING_REP || role === UserRole.SUPER_ADMIN;
}

