interface AlertsInfoStepProps {
  onNext: () => void;
}

export default function AlertsInfoStep({ onNext }: AlertsInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Understanding Alerts</h2>
        <p className="text-white/60">
          The system automatically monitors your performance and sends alerts.
        </p>
      </div>

      {/* Alert Color Codes */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <h3 className="font-semibold text-red-400">RED Alert</h3>
          </div>
          <p className="text-white/70 text-sm mb-2">Critical - Immediate action needed</p>
          <ul className="text-xs text-white/50 space-y-1">
            <li>+ Quota below 50%</li>
            <li>+ Deals stale 14+ days</li>
            <li>+ 3+ overdue tasks</li>
          </ul>
          <p className="text-xs text-red-400 mt-3">CC: HR + Leadership</p>
        </div>

        <div className="p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <h3 className="font-semibold text-yellow-400">YELLOW Alert</h3>
          </div>
          <p className="text-white/70 text-sm mb-2">Warning - Needs attention</p>
          <ul className="text-xs text-white/50 space-y-1">
            <li>+ Quota 50-80%</li>
            <li>+ Deals stale 7-14 days</li>
            <li>+ 1-2 overdue tasks</li>
          </ul>
          <p className="text-xs text-yellow-400 mt-3">CC: Sales Manager</p>
        </div>

        <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <h3 className="font-semibold text-green-400">GREEN Alert</h3>
          </div>
          <p className="text-white/70 text-sm mb-2">Excellent - Recognition</p>
          <ul className="text-xs text-white/50 space-y-1">
            <li>+ Quota 100%+</li>
            <li>+ All deals active</li>
            <li>+ No overdue tasks</li>
          </ul>
          <p className="text-xs text-green-400 mt-3">CC: HR (Recognition)</p>
        </div>
      </div>

      {/* Alert Schedule */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Alert Schedule</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/70">Daily</span>
            <span className="text-white/50 text-sm">8-10 AM - Quota, stale deals, overdue tasks</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/70">Weekly</span>
            <span className="text-white/50 text-sm">Monday 9 AM - Activity summary</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-white/70">Monthly</span>
            <span className="text-white/50 text-sm">1st of month - Full performance review</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="p-5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-cyan-400 mb-3">Pro Tips</h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">1.</span>
            <span>Respond to alerts within 24 hours - fix issues before they escalate</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">2.</span>
            <span>Log activities daily - even a quick note keeps deals from going stale</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">3.</span>
            <span>Update deal stages promptly - accurate pipeline = better forecasting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">4.</span>
            <span>Complete tasks on time - overdue tasks trigger alerts</span>
          </li>
        </ul>
      </div>

      {/* Grace Period Reminder */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
        <p className="text-white/60 text-sm">
          Remember: During your first 14 days, alerts are marked with <span className="text-cyan-400">[ONBOARDING]</span>.
          <br />
          Everyone knows you&apos;re learning, but the clock is ticking!
        </p>
      </div>
    </div>
  );
}
