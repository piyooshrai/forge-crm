import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { mockUser } from '@/lib/mock-data';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <SectionHeader title="Settings" subtitle="Manage your CRM configuration" className="mb-6" />

      {/* User Info Card */}
      <GlassCard variant="primary" className="p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30">
            <span className="text-2xl font-semibold text-cyan-400">
              {mockUser.name.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{mockUser.name}</h2>
            <p className="text-sm text-white/60">{mockUser.email}</p>
            <span className="inline-flex mt-2 rounded-full px-3 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {mockUser.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50 mb-1">Role</p>
            <p className="text-sm font-medium text-white">{mockUser.role.replace('_', ' ')}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50 mb-1">Email</p>
            <p className="text-sm font-medium text-white">{mockUser.email}</p>
          </div>
        </div>
      </GlassCard>

      {/* Coming Soon Card */}
      <GlassCard variant="secondary" className="p-8 text-center">
        <div className="flex flex-col items-center">
          <span className="text-5xl mb-4">⚙️</span>
          <h3 className="text-xl font-semibold text-white mb-2">Settings - Coming Soon</h3>
          <p className="text-sm text-white/60 max-w-md">
            Full settings configuration including user management, pipeline customization,
            notification preferences, and integrations will be available soon.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 text-left">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <span className="text-2xl mb-2 block">👥</span>
            <p className="text-sm font-medium text-white/80">User Management</p>
            <p className="text-xs text-white/50 mt-1">Add and manage team members</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <span className="text-2xl mb-2 block">🔔</span>
            <p className="text-sm font-medium text-white/80">Notifications</p>
            <p className="text-xs text-white/50 mt-1">Configure email and alerts</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <span className="text-2xl mb-2 block">🔗</span>
            <p className="text-sm font-medium text-white/80">Integrations</p>
            <p className="text-xs text-white/50 mt-1">Connect external services</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
