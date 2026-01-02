'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    source: '',
    status: '',
    regionTags: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const lead = await res.json();
        router.push(`/leads/${lead.id}`);
      } else {
        alert('Failed to create lead');
      }
    } catch (error) {
      alert('Error creating lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <SectionHeader title="New Lead" className="mb-6" />
      <GlassCard variant="primary" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-white/70">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Contact Name</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="john@acme.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Phone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="Website, Referral, etc."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Status</label>
              <input
                type="text"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="New, Qualified, etc."
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-6 py-2.5 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

