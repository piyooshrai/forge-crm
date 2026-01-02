import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <SectionHeader title="Reports" subtitle="Analytics and insights" className="mb-6" />

      <GlassCard variant="secondary" className="p-8 text-center">
        <div className="flex flex-col items-center">
          <span className="text-5xl mb-4">📈</span>
          <h3 className="text-xl font-semibold text-white mb-2">Reports - Coming Soon</h3>
          <p className="text-sm text-white/60 max-w-md">
            Comprehensive analytics and reporting features including pipeline reports, sales forecasts,
            team performance metrics, and custom dashboards will be available soon.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3 text-left">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <span className="text-2xl mb-2 block">💰</span>
            <p className="text-sm font-medium text-white/80">Pipeline Analytics</p>
            <p className="text-xs text-white/50 mt-1">Track deal velocity and value</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <span className="text-2xl mb-2 block">📊</span>
            <p className="text-sm font-medium text-white/80">Sales Forecasting</p>
            <p className="text-xs text-white/50 mt-1">Predict future revenue</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <span className="text-2xl mb-2 block">🏆</span>
            <p className="text-sm font-medium text-white/80">Team Performance</p>
            <p className="text-xs text-white/50 mt-1">Track goals and achievements</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
