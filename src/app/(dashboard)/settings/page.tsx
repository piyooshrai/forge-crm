import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';

export default function SettingsPage() {
  // Skip auth check for demo

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <SectionHeader title="Settings" className="mb-6" />
      <GlassCard variant="primary" className="p-6">
        <p className="text-sm text-white/70">
          Settings page - Coming soon. This is a stub for Super Admin only.
        </p>
      </GlassCard>
    </div>
  );
}

