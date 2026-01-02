import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';

export default function ReportsPage() {
  // Skip auth check for demo

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <SectionHeader title="Reports" className="mb-6" />
      <GlassCard variant="primary" className="p-6">
        <p className="text-sm text-white/70">
          Reports page - Coming soon. This is a stub.
        </p>
      </GlassCard>
    </div>
  );
}

