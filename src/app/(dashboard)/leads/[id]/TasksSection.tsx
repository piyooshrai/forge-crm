'use client';

import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: Date | null;
  createdAt: Date;
  user: { name: string | null; email: string };
}

export default function TasksSection({
  leadId,
  tasks,
}: {
  leadId: string;
  tasks: Task[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          leadId,
          dueDate: formData.dueDate || null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ title: '', description: '', dueDate: '' });
        window.location.reload();
      }
    } catch (error) {
      alert('Error creating task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard variant="secondary" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <SectionHeader title="Tasks" />
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-lg bg-white/5 p-4">
          <div>
            <label className="mb-1 block text-xs text-white/70">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
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

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
            <input
              type="checkbox"
              checked={task.completed}
              readOnly
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5"
            />
            <div className="flex-1">
              <p className={`text-sm ${task.completed ? 'text-white/50 line-through' : 'text-white'}`}>
                {task.title}
              </p>
              {task.dueDate && (
                <p className="text-xs text-white/50 mt-1">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-white/50 py-4 text-center">No tasks yet</p>
        )}
      </div>
    </GlassCard>
  );
}

