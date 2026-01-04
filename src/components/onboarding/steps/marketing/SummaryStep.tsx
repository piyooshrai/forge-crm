interface SummaryStepProps {
  stepData: Record<string, any>;
}

export default function SummaryStep({ stepData }: SummaryStepProps) {
  const leadCreated = !!stepData.createdLeadId;
  const taskCreated = !!stepData.createdTaskId;

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
            <span className="text-white/70">Reviewed marketing expectations and metrics</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${leadCreated ? 'bg-green-500/20' : 'bg-white/10'}`}>
              {leadCreated ? (
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-white/40 text-xs">-</span>
              )}
            </div>
            <span className={leadCreated ? 'text-white/70' : 'text-white/40'}>
              {leadCreated ? `Created lead: ${stepData.createdLeadName}` : 'Skipped lead creation'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${taskCreated ? 'bg-green-500/20' : 'bg-white/10'}`}>
              {taskCreated ? (
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-white/40 text-xs">-</span>
              )}
            </div>
            <span className={taskCreated ? 'text-white/70' : 'text-white/40'}>
              {taskCreated ? 'Logged marketing task' : 'Skipped task logging'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-white/70">Learned to update outcomes and save templates</span>
          </div>
        </div>
      </div>

      {/* Your Targets */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
          <p className="text-2xl font-bold text-cyan-400">50+</p>
          <p className="text-xs text-white/50">Leads/Month</p>
        </div>
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
          <p className="text-2xl font-bold text-cyan-400">30%+</p>
          <p className="text-xs text-white/50">Success Rate</p>
        </div>
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
          <p className="text-2xl font-bold text-cyan-400">14 days</p>
          <p className="text-xs text-white/50">Grace Period</p>
        </div>
      </div>

      {/* Daily Workflow */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">Your Daily Workflow</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-medium min-w-[80px]">Morning</span>
            <span className="text-white/70">Check inbox, plan today&apos;s outreach</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-medium min-w-[80px]">During Day</span>
            <span className="text-white/70">Log tasks as you do them (30 sec each)</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-medium min-w-[80px]">End of Day</span>
            <span className="text-white/70">Update outcomes, save templates for what worked</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400 font-medium min-w-[80px]">Weekly</span>
            <span className="text-white/70">Review success rate, double down on what works</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Where to Go</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/marketing/tasks</p>
            <p className="text-xs text-white/50">Log and track your tasks</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/leads</p>
            <p className="text-xs text-white/50">Create and manage leads</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-cyan-400 font-medium">/marketing-performance</p>
            <p className="text-xs text-white/50">View your performance stats</p>
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
