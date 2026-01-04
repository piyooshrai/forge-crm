interface DashboardStepProps {
  stepData: Record<string, any>;
}

export default function DashboardStep({ stepData }: DashboardStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">You&apos;re All Set!</h2>
        <p className="text-white/60">
          Your admin account is ready. Here&apos;s what you need to know.
        </p>
      </div>

      {/* CEO Dashboard Preview */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">CEO Dashboard</h3>
        <p className="text-white/70 text-sm mb-4">
          Your main dashboard shows real-time performance across all teams:
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
            <p className="text-xs text-white/50 mb-1">Sales Quota %</p>
            <p className="text-lg font-bold text-cyan-400">Team Progress</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
            <p className="text-xs text-white/50 mb-1">Marketing Success</p>
            <p className="text-lg font-bold text-cyan-400">Success Rate</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
            <p className="text-xs text-white/50 mb-1">Pipeline Value</p>
            <p className="text-lg font-bold text-cyan-400">Total Value</p>
          </div>
        </div>
      </div>

      {/* Alert System */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Automated Alerts</h3>
        <p className="text-white/70 text-sm mb-4">
          You&apos;ll be CC&apos;d on all performance alerts:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-white/70">Daily: Missing activity alerts</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
            <span className="w-3 h-3 rounded-full bg-orange-400"></span>
            <span className="text-white/70">Weekly: Quota progress reviews</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-white/70">Monthly: Performance summaries</span>
          </div>
        </div>
      </div>

      {/* New Hire Grace Period */}
      <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">New Hire Grace Period</h3>
        <p className="text-white/70 text-sm">
          New team members get a <span className="text-cyan-400 font-medium">14-day grace period</span>.
          During this time, alerts will be prefixed with [ONBOARDING] so you know they&apos;re ramping up.
          They&apos;re still CC&apos;d on everything - full accountability from day 1.
        </p>
      </div>

      {/* First Steps */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Recommended First Steps</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold min-w-[24px]">1.</span>
            <span className="text-white/70">Review the CEO Dashboard to see current team performance</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold min-w-[24px]">2.</span>
            <span className="text-white/70">Check the Users page to ensure all team members are set up</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold min-w-[24px]">3.</span>
            <span className="text-white/70">Verify your email to receive performance alerts</span>
          </div>
        </div>
      </div>

      {/* Final Note */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20 text-center">
        <p className="text-white/70">
          Click <span className="text-cyan-400 font-medium">&quot;Go to Dashboard&quot;</span> below to get started.
        </p>
      </div>
    </div>
  );
}
