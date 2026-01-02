'use client';

import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { ActivityType } from '@prisma/client';

interface Activity {
  id: string;
  type: ActivityType;
  title: string | null;
  description: string | null;
  createdAt: Date;
  user: { name: string | null; email: string };
}

export default function ActivitiesSection({
  dealId,
  activities,
}: {
  dealId: string;
  activities: Activity[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'NOTE' as ActivityType,
    title: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dealId,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ type: 'NOTE', title: '', description: '' });
        window.location.reload();
      }
    } catch (error) {
      alert('Error creating activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard variant="secondary" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <SectionHeader title="Activities" />
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          + Add Activity
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-lg bg-white/5 p-4">
          <div>
            <label className="mb-1 block text-xs text-white/70">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="NOTE">Note</option>
              <option value="CALL">Call</option>
              <option value="MEETING">Meeting</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-xs text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="border-b border-white/5 pb-4 last:border-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-white">{activity.title || activity.type}</p>
                <p className="text-xs text-white/50 mt-1">
                  {activity.user.name || activity.user.email} • {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                {activity.type}
              </span>
            </div>
            {activity.description && (
              <p className="text-sm text-white/70 mt-2">{activity.description}</p>
            )}
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-white/50 py-4 text-center">No activities yet</p>
        )}
      </div>
    </GlassCard>
  );
}

