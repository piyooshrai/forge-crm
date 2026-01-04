'use client';

import { useState } from 'react';
import { TextInput, SelectInput, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface LogTaskStepProps {
  onNext: () => void;
  setStepData: (data: any) => void;
  stepData: Record<string, any>;
}

export default function LogTaskStep({ onNext, setStepData, stepData }: LogTaskStepProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);

  const [formData, setFormData] = useState({
    type: 'LINKEDIN_OUTREACH',
    description: 'Sent connection request to Sarah Johnson at TechCorp about IT modernization needs',
    target: 'Sarah Johnson, TechCorp',
    content: 'Hi Sarah, I noticed TechCorp is expanding into new markets. We help companies like yours with IT infrastructure and cloud solutions. Would love to connect!',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/marketing-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          description: formData.description,
          target: formData.target,
          content: formData.content,
          status: 'IN_PROGRESS',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create task');
      }

      const task = await res.json();
      setStepData({
        ...stepData,
        createdTaskId: task.id,
        createdTaskDescription: formData.description,
        createdTaskType: formData.type,
      });
      setTaskCreated(true);
      showToast('Marketing task logged!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to log task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (taskCreated) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Task Logged!</h2>
        <p className="text-white/60 mb-6">
          You&apos;ve logged a <span className="text-cyan-400">LinkedIn Outreach</span> task.
        </p>
        <p className="text-white/50 text-sm mb-6">
          Next, you&apos;ll learn how to update outcomes and save templates.
        </p>
        <Button onClick={onNext}>Continue to Next Step</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Log a Marketing Task</h2>
        <p className="text-white/60">
          Every action you take should be logged. Let&apos;s create a task.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 mb-6">
        <p className="text-sm text-cyan-400">
          This is how you&apos;ll track your daily work. Log tasks as you do them - it only takes 30 seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectInput
          label="Task Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={[
            { value: 'LINKEDIN_OUTREACH', label: 'LinkedIn Outreach' },
            { value: 'COLD_EMAIL', label: 'Cold Email' },
            { value: 'SOCIAL_POST', label: 'Social Post' },
            { value: 'BLOG_POST', label: 'Blog Post' },
            { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
            { value: 'CONTENT_CREATION', label: 'Content Creation' },
            { value: 'EVENT', label: 'Event' },
            { value: 'WEBINAR', label: 'Webinar' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 resize-none"
            placeholder="What did you do? Be specific."
          />
        </div>

        <TextInput
          label="Target (optional)"
          value={formData.target}
          onChange={(e) => setFormData({ ...formData, target: e.target.value })}
          placeholder="e.g., Sarah Johnson, TechCorp"
        />

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Message/Content (optional)
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 resize-none"
            placeholder="Paste your message or content here for reference..."
          />
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? 'Logging Task...' : 'Log Task'}
          </Button>
        </div>
      </form>
    </div>
  );
}
