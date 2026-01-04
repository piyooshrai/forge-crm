'use client';

import { useState } from 'react';
import { TextInput, SelectInput, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface CreateLeadStepProps {
  onNext: () => void;
  setStepData: (data: any) => void;
}

export default function CreateLeadStep({ onNext, setStepData }: CreateLeadStepProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1-555-0123',
    company: 'TechCorp Industries',
    title: 'VP of Operations',
    source: 'LINKEDIN',
    status: 'NEW',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          title: formData.title,
          source: formData.source,
          status: formData.status,
          regionTags: ['US'],
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create lead');
      }

      const lead = await res.json();
      setStepData({ createdLeadId: lead.id, createdLeadName: `${formData.name} - ${formData.company}` });
      setLeadCreated(true);
      showToast('Lead created successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create lead', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (leadCreated) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Lead Created!</h2>
        <p className="text-white/60 mb-6">
          Great job! You&apos;ve created your first lead: <span className="text-cyan-400">{formData.name}</span>
        </p>
        <p className="text-white/50 text-sm mb-6">
          Next, you&apos;ll learn how to log marketing tasks.
        </p>
        <Button onClick={onNext}>Continue to Next Step</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create Your First Lead</h2>
        <p className="text-white/60">
          Let&apos;s practice creating a lead. You can modify or delete this later.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-6">
        <p className="text-sm text-cyan-400">
          Tip: We&apos;ve pre-filled a sample lead to help you get started. Feel free to change any values.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Contact Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Sarah Johnson"
          />
          <TextInput
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
            placeholder="e.g., TechCorp Industries"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g., sarah@techcorp.com"
          />
          <TextInput
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g., +1-555-0123"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., VP of Operations"
          />
          <SelectInput
            label="Source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            options={[
              { value: 'LINKEDIN', label: 'LinkedIn' },
              { value: 'WEBSITE', label: 'Website' },
              { value: 'REFERRAL', label: 'Referral' },
              { value: 'COLD_CALL', label: 'Cold Call' },
              { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
              { value: 'TRADE_SHOW', label: 'Trade Show' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? 'Creating Lead...' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </div>
  );
}
