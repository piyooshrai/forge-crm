interface OverviewStepProps {
  onNext: () => void;
}

export default function OverviewStep({ onNext }: OverviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome, Administrator
        </h1>
        <p className="text-white/60">
          You have full access to manage the system.
        </p>
      </div>

      {/* Your Role */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-cyan-400 mb-3">Your Role</h3>
        <p className="text-2xl font-bold text-white mb-2">Super Admin</p>
        <p className="text-white/50 text-sm">
          Full access to all system features, user management, and performance dashboards.
        </p>
      </div>

      {/* Key Areas */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Key Areas You&apos;ll Manage</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-white font-medium">User Management</p>
            </div>
            <p className="text-white/50 text-sm">Add, edit, and manage team members. Control roles and permissions.</p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-white font-medium">Performance Dashboard</p>
            </div>
            <p className="text-white/50 text-sm">Monitor team performance, quotas, and success metrics at a glance.</p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-white font-medium">Alert System</p>
            </div>
            <p className="text-white/50 text-sm">Receive automated alerts about performance issues and required actions.</p>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-white font-medium">System Settings</p>
            </div>
            <p className="text-white/50 text-sm">Configure quotas, thresholds, and system-wide settings.</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Navigation</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/dashboard</p>
            <p className="text-xs text-white/50">CEO performance overview</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/users</p>
            <p className="text-xs text-white/50">Manage team members</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/deals</p>
            <p className="text-xs text-white/50">View all sales deals</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/leads</p>
            <p className="text-xs text-white/50">View all marketing leads</p>
          </div>
        </div>
      </div>

      {/* Accountability Note */}
      <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Your Responsibility</h3>
        <p className="text-white/70 text-sm">
          As a Super Admin, you&apos;ll receive CC on all performance alerts. This ensures full visibility into
          team performance. Use the dashboard to identify issues early and take action.
        </p>
      </div>
    </div>
  );
}
