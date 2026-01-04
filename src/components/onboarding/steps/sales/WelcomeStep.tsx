interface WelcomeStepProps {
  monthlyQuota: number;
  onNext: () => void;
}

export default function WelcomeStep({ monthlyQuota, onNext }: WelcomeStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to The Algorithm&apos;s Forge
        </h1>
        <p className="text-white/60">
          You&apos;re joining a high-performance, data-driven team.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Your Role */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-cyan-400 mb-3">Your Role</h3>
          <p className="text-2xl font-bold text-white mb-1">Sales Representative</p>
          <p className="text-white/50 text-sm">
            Monthly Quota: <span className="text-cyan-400 font-medium">{formatCurrency(monthlyQuota)}</span>
          </p>
        </div>

        {/* What You'll Do */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold text-cyan-400 mb-3">What You&apos;ll Do</h3>
          <ul className="space-y-2 text-white/70 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">+</span>
              Manage deals through the pipeline
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">+</span>
              Log every activity (calls, meetings, emails)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">+</span>
              Close deals and hit your quota
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">+</span>
              Respond to automated alerts
            </li>
          </ul>
        </div>
      </div>

      {/* How You're Measured */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-cyan-400 mb-3">How You&apos;re Measured</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold text-white">100%+</p>
            <p className="text-xs text-white/50">Quota Attainment</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold text-white">50%+</p>
            <p className="text-xs text-white/50">Win Rate</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-white/50">Stale Deals</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-white/50">Overdue Tasks</p>
          </div>
        </div>
      </div>

      {/* Accountability */}
      <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
        <h3 className="text-lg font-semibold text-red-400 mb-3">Accountability</h3>
        <ul className="space-y-2 text-white/70 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-red-400">!</span>
            Daily/weekly/monthly automated performance emails
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">!</span>
            Performance visible to entire team (leaderboards)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">!</span>
            RED alerts escalate to HR
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">!</span>
            GREEN alerts = recognition sent to HR
          </li>
        </ul>
      </div>

      {/* Grace Period Notice */}
      <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Grace Period</h3>
        <p className="text-white/70 text-sm">
          For the first <span className="text-cyan-400 font-medium">14 days</span>, alerts will be marked
          with [ONBOARDING] so everyone knows you&apos;re ramping up. After that, full accountability starts.
          Use this time to learn the system.
        </p>
      </div>
    </div>
  );
}
