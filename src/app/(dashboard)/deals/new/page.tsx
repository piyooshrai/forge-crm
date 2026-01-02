'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Pipeline, DealStage, AmountType } from '@prisma/client';

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    pipeline: Pipeline.IT_SERVICES,
    stage: DealStage.LEAD,
    probability: 0,
    closeDate: '',
    amountType: AmountType.FIXED,
    amountTotal: '',
    hourlyRate: '',
    expectedHours: '',
    source: '',
    regionTags: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amountTotal: formData.amountTotal ? parseFloat(formData.amountTotal) : null,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          expectedHours: formData.expectedHours ? parseFloat(formData.expectedHours) : null,
          probability: parseInt(formData.probability.toString()),
          closeDate: formData.closeDate || null,
        }),
      });

      if (res.ok) {
        const deal = await res.json();
        router.push(`/deals/${deal.id}`);
      } else {
        alert('Failed to create deal');
      }
    } catch (error) {
      alert('Error creating deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <SectionHeader title="New Deal" className="mb-6" />
      <GlassCard variant="primary" className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-white/70">Deal Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                placeholder="Acme Corporation - Q4 Project"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Pipeline</label>
              <select
                value={formData.pipeline}
                onChange={(e) => setFormData({ ...formData, pipeline: e.target.value as Pipeline })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
              >
                <option value={Pipeline.IT_SERVICES}>IT Services</option>
                <option value={Pipeline.ALL_PRODUCTS}>All Products</option>
                <option value={Pipeline.STAFFING}>Staffing</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Stage</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
              >
                <option value={DealStage.LEAD}>Lead</option>
                <option value={DealStage.QUALIFIED}>Qualified</option>
                <option value={DealStage.DISCOVERY}>Discovery</option>
                <option value={DealStage.PROPOSAL}>Proposal</option>
                <option value={DealStage.NEGOTIATION}>Negotiation</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Amount Type</label>
              <select
                value={formData.amountType}
                onChange={(e) => setFormData({ ...formData, amountType: e.target.value as AmountType })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
              >
                <option value={AmountType.FIXED}>Fixed</option>
                <option value={AmountType.HOURLY}>Hourly</option>
                <option value={AmountType.RETAINER}>Retainer</option>
              </select>
            </div>
            {formData.amountType === AmountType.FIXED || formData.amountType === AmountType.RETAINER ? (
              <div>
                <label className="mb-1 block text-sm text-white/70">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amountTotal}
                  onChange={(e) => setFormData({ ...formData, amountTotal: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                  placeholder="50000"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Hourly Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Expected Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.expectedHours}
                    onChange={(e) => setFormData({ ...formData, expectedHours: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                    placeholder="200"
                  />
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-sm text-white/70">Close Date</label>
              <input
                type="date"
                value={formData.closeDate}
                onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
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
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-6 py-2.5 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Deal'}
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

