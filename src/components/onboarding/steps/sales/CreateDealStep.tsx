'use client';

import { useState } from 'react';
import { TextInput, SelectInput, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface CreateDealStepProps {
  onNext: () => void;
  setStepData: (data: any) => void;
}

export default function CreateDealStep({ onNext, setStepData }: CreateDealStepProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [dealCreated, setDealCreated] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Sample - Acme Corp IT Services',
    pipeline: 'IT_SERVICES',
    stage: 'QUALIFIED',
    amountType: 'FIXED',
    amountTotal: '50000',
    closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          pipeline: formData.pipeline,
          stage: formData.stage,
          amountType: formData.amountType,
          amountTotal: Number(formData.amountTotal),
          closeDate: formData.closeDate,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create deal');
      }

      const deal = await res.json();
      setStepData({ createdDealId: deal.id, createdDealName: deal.name });
      setDealCreated(true);
      showToast('Deal created successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create deal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (dealCreated) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Deal Created!</h2>
        <p className="text-white/60 mb-6">
          Great job! You&apos;ve created your first deal: <span className="text-cyan-400">{formData.name}</span>
        </p>
        <p className="text-white/50 text-sm mb-6">
          Next, you&apos;ll learn how to log activities on this deal.
        </p>
        <Button onClick={onNext}>Continue to Next Step</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create Your First Deal</h2>
        <p className="text-white/60">
          Let&apos;s practice creating a deal. You can modify or delete this later.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-6">
        <p className="text-sm text-cyan-400">
          Tip: We&apos;ve pre-filled a sample deal to help you get started. Feel free to change any values.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Deal Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Acme Corp - Cloud Migration"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectInput
            label="Pipeline"
            value={formData.pipeline}
            onChange={(e) => setFormData({ ...formData, pipeline: e.target.value })}
            options={[
              { value: 'IT_SERVICES', label: 'IT Services' },
              { value: 'ALL_PRODUCTS', label: 'All Products' },
              { value: 'STAFFING', label: 'Staffing' },
            ]}
          />
          <SelectInput
            label="Stage"
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            options={[
              { value: 'LEAD', label: 'Lead' },
              { value: 'QUALIFIED', label: 'Qualified' },
              { value: 'DISCOVERY', label: 'Discovery' },
              { value: 'PROPOSAL', label: 'Proposal' },
              { value: 'NEGOTIATION', label: 'Negotiation' },
            ]}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Amount"
            type="number"
            value={formData.amountTotal}
            onChange={(e) => setFormData({ ...formData, amountTotal: e.target.value })}
            required
            placeholder="50000"
          />
          <TextInput
            label="Close Date"
            type="date"
            value={formData.closeDate}
            onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
            required
          />
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? 'Creating Deal...' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </div>
  );
}
