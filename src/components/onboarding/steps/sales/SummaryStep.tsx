interface SummaryStepProps {
  stepData: Record<string, any>;
  monthlyQuota: number;
}

export default function SummaryStep({ stepData, monthlyQuota }: SummaryStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const dealCreated = !!stepData.createdDealId;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">You&apos;re Ready!</h2>
        <p className="text-white/60">
          You&apos;ve completed the onboarding. Here&apos;s a quick recap.
        </p>
      </div>

      {/* What You Did */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">What You Completed</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white/70">Reviewed role expectations and accountability</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${dealCreated ? 'bg-green-500/20' : 'bg-white/10'}`}>
              {dealCreated ? (
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-white/40 text-xs">-</span>
              )}
            </div>
            <span className={dealCreated ? 'text-white/70' : 'text-white/40'}>
              {dealCreated ? `Created deal: ${stepData.createdDealName}` : 'Skipped deal creation'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white/70">Learned to log activities</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white/70">Understood alert system and schedules</span>
          </div>
        </div>
      </div>

      {/* Your Targets */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
          <p className="text-2xl font-bold text-cyan-400">{formatCurrency(monthlyQuota)}</p>
          <p className="text-xs text-white/50">Monthly Quota</p>
        </div>
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
          <p className="text-2xl font-bold text-cyan-400">50%+</p>
          <p className="text-xs text-white/50">Target Win Rate</p>
        </div>
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
          <p className="text-2xl font-bold text-cyan-400">14 days</p>
          <p className="text-xs text-white/50">Grace Period</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Where to Go</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/deals</p>
            <p className="text-xs text-white/50">Manage your deals and pipeline</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/leads</p>
            <p className="text-xs text-white/50">View and qualify new leads</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/products</p>
            <p className="text-xs text-white/50">Browse products for proposals</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/settings</p>
            <p className="text-xs text-white/50">Update your profile</p>
          </div>
        </div>
      </div>

      {/* Final Note */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20 text-center">
        <p className="text-white/70">
          Click <span className="text-cyan-400 font-medium">&quot;Get Started&quot;</span> below to begin.
          <br />
          <span className="text-white/50 text-sm">Your grace period starts now. Make it count!</span>
        </p>
      </div>
    </div>
  );
}
