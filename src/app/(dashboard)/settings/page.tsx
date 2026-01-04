'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';

export default function SettingsPage() {
  const { data: session } = useSession();

  const user = session?.user;
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const userRole = ((user as any)?.role || 'USER').replace('_', ' ');
  const isSuperAdmin = (user as any)?.role === 'SUPER_ADMIN';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <SectionHeader title="Settings" subtitle="Manage your CRM configuration" className="mb-6" />

      {/* User Info Card */}
      <GlassCard variant="primary" className="p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30">
            <span className="text-2xl font-semibold text-cyan-400">
              {userName.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{userName}</h2>
            <p className="text-sm text-white/60">{userEmail}</p>
            <span className="inline-flex mt-2 rounded-full px-3 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {userRole}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50 mb-1">Role</p>
            <p className="text-sm font-medium text-white">{userRole}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50 mb-1">Email</p>
            <p className="text-sm font-medium text-white">{userEmail}</p>
          </div>
        </div>
      </GlassCard>

      {/* Admin Section - Only for SUPER_ADMIN */}
      {isSuperAdmin && (
        <GlassCard variant="secondary" className="p-6 mb-6">
          <SectionHeader title="Administration" className="mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/settings/users">
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
                <span className="text-2xl mb-2 block">👥</span>
                <p className="text-sm font-medium text-white">User Management</p>
                <p className="text-xs text-white/50 mt-1">Add and manage team members</p>
              </div>
            </Link>
            <Link href="/settings/alerts">
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
                <span className="text-2xl mb-2 block">🔔</span>
                <p className="text-sm font-medium text-white">Alert Management</p>
                <p className="text-xs text-white/50 mt-1">Configure thresholds and schedules</p>
              </div>
            </Link>
            <div className="rounded-lg bg-white/5 border border-white/10 p-4 opacity-60">
              <span className="text-2xl mb-2 block">🔗</span>
              <p className="text-sm font-medium text-white/80">Integrations</p>
              <p className="text-xs text-white/50 mt-1">Coming soon</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Preferences Section */}
      <GlassCard variant="secondary" className="p-6">
        <SectionHeader title="Preferences" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4 opacity-60">
            <span className="text-2xl mb-2 block">🎨</span>
            <p className="text-sm font-medium text-white/80">Appearance</p>
            <p className="text-xs text-white/50 mt-1">Theme and display settings - Coming soon</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4 opacity-60">
            <span className="text-2xl mb-2 block">📧</span>
            <p className="text-sm font-medium text-white/80">Email Preferences</p>
            <p className="text-xs text-white/50 mt-1">Notification settings - Coming soon</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
