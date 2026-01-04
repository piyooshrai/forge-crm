'use client';

import { useState } from 'react';
import { SelectInput, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface OutcomeStepProps {
  onNext: () => void;
  stepData: Record<string, any>;
}

export default function OutcomeStep({ onNext, stepData }: OutcomeStepProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [outcomeUpdated, setOutcomeUpdated] = useState(false);

  const taskId = stepData.createdTaskId;
  const taskDescription = stepData.createdTaskDescription || 'LinkedIn outreach task';

  const [formData, setFormData] = useState({
    status: 'COMPLETED',
    outcome: 'SUCCESS',
    resultNotes: 'She accepted connection and replied asking for more info. Interested in Q1 meeting.',
    saveAsTemplate: true,
    templateName: 'LinkedIn: VP outreach IT needs',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskId) {
      showToast('Please create a task first', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Update the task with outcome
      const res = await fetch(`/api/marketing-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          outcome: formData.outcome,
          resultNotes: formData.resultNotes,
          // If saving as template, set these fields
          ...(formData.saveAsTemplate && {
            isTemplate: true,
            templateName: formData.templateName,
          }),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update task');
      }

      setOutcomeUpdated(true);
      showToast('Outcome updated!' + (formData.saveAsTemplate ? ' Template saved.' : ''), 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update outcome', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (outcomeUpdated) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Outcome Updated!</h2>
        <p className="text-white/60 mb-4">
          You marked this task as <span className="text-green-400">SUCCESS</span>.
        </p>
        {formData.saveAsTemplate && (
          <p className="text-cyan-400 text-sm mb-6">
            Template saved: &quot;{formData.templateName}&quot;
          </p>
        )}
        <p className="text-white/50 text-sm mb-6">
          This is how you build a library of winning plays. Reuse templates that work!
        </p>
        <Button onClick={onNext}>Continue to Summary</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Update Outcome</h2>
        <p className="text-white/60">
          Always update your tasks with outcomes. This is how we measure success.
        </p>
      </div>

      {taskId ? (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
          <p className="text-sm text-white/50">Updating:</p>
          <p className="text-white font-medium">{taskDescription}</p>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-6">
          <p className="text-sm text-yellow-400">
            Note: You skipped creating a task. You can still see how this works.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectInput
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'NO_RESPONSE', label: 'No Response' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
            ]}
          />
          <SelectInput
            label="Outcome"
            value={formData.outcome}
            onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
            options={[
              { value: 'SUCCESS', label: 'Success - Generated lead/engagement' },
              { value: 'PARTIAL', label: 'Partial - Some response, not qualified' },
              { value: 'FAILED', label: 'Failed - No response/engagement' },
            ]}
          />
        </div>

        {/* Outcome Explanation */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-sm text-white/70 mb-2">What each outcome means:</p>
          <ul className="text-xs text-white/50 space-y-1">
            <li><span className="text-green-400">SUCCESS</span> = Generated lead, got response, engagement (likes/comments)</li>
            <li><span className="text-yellow-400">PARTIAL</span> = Some response but not qualified, weak engagement</li>
            <li><span className="text-red-400">FAILED</span> = No response, no engagement, blocked/ignored</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Result Notes
          </label>
          <textarea
            value={formData.resultNotes}
            onChange={(e) => setFormData({ ...formData, resultNotes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 resize-none"
            placeholder="What happened? Any follow-up needed?"
          />
        </div>

        {/* Save as Template */}
        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.saveAsTemplate}
              onChange={(e) => setFormData({ ...formData, saveAsTemplate: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
            />
            <span className="text-sm text-white/70">Save as Template (reuse winning plays)</span>
          </label>

          {formData.saveAsTemplate && (
            <div className="mt-3">
              <input
                type="text"
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-500/30 focus:outline-none"
                placeholder="Template name"
              />
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={submitting || !taskId} className="w-full sm:w-auto">
            {submitting ? 'Updating...' : 'Update Outcome'}
          </Button>
        </div>
      </form>
    </div>
  );
}
