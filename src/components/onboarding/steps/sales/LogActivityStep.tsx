'use client';

import { useState } from 'react';
import { TextInput, SelectInput, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface LogActivityStepProps {
  onNext: () => void;
  stepData: Record<string, any>;
}

export default function LogActivityStep({ onNext, stepData }: LogActivityStepProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [activityLogged, setActivityLogged] = useState(false);

  const dealName = stepData.createdDealName || 'Sample Deal';
  const dealId = stepData.createdDealId;

  const [formData, setFormData] = useState({
    type: 'CALL',
    subject: 'Discovery call about IT needs',
    description: 'Discussed current infrastructure, pain points with downtime, interested in cloud migration. Next step: send proposal.',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dealId) {
      showToast('Please create a deal first', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          subject: formData.subject,
          description: formData.description,
          dealId: dealId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to log activity');
      }

      setActivityLogged(true);
      showToast('Activity logged successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to log activity', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (activityLogged) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Activity Logged!</h2>
        <p className="text-white/60 mb-6">
          You&apos;ve logged a <span className="text-cyan-400">{formData.type.toLowerCase()}</span> on your deal.
        </p>
        <p className="text-white/50 text-sm mb-6">
          Remember: Log every interaction. This builds your activity history and shows you&apos;re engaged.
        </p>
        <Button onClick={onNext}>Continue to Next Step</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Log an Activity</h2>
        <p className="text-white/60">
          Every interaction matters. Let&apos;s log an activity on your deal.
        </p>
      </div>

      {dealId ? (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
          <p className="text-sm text-white/50">Logging activity for:</p>
          <p className="text-white font-medium">{dealName}</p>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
          <p className="text-sm text-yellow-400">
            Note: You skipped creating a deal. You can still practice, but the activity won&apos;t be saved.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectInput
          label="Activity Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={[
            { value: 'CALL', label: 'Call' },
            { value: 'MEETING', label: 'Meeting' },
            { value: 'EMAIL', label: 'Email' },
            { value: 'NOTE', label: 'Note' },
          ]}
        />

        <TextInput
          label="Subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
          placeholder="e.g., Discovery call about IT needs"
        />

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 resize-none"
            placeholder="What happened during this interaction? What's the next step?"
          />
        </div>

        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <p className="text-sm text-cyan-400 font-medium mb-1">Why log activities?</p>
          <ul className="text-sm text-white/60 space-y-1">
            <li>+ Builds your activity history (measured weekly)</li>
            <li>+ Keeps deals from going stale</li>
            <li>+ Creates accountability trail</li>
            <li>+ Helps team see deal progress</li>
          </ul>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={submitting || !dealId} className="w-full sm:w-auto">
            {submitting ? 'Logging Activity...' : 'Log Activity'}
          </Button>
        </div>
      </form>
    </div>
  );
}
