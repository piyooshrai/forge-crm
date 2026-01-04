'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, ConfirmModal, Button, TextInput, SelectInput, TextareaInput, Badge, EmptyState, Tabs } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  formatDate,
  formatDateTime,
  isOverdue,
  isToday,
  dealStages,
  stageLabels,
  pipelineLabels,
  pipelines,
} from '@/lib/mock-data';
import { LeadStatus, LeadSource, Pipeline, ActivityType, DealStage } from '@prisma/client';

const statusColors: Record<LeadStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  QUALIFIED: 'success',
  UNQUALIFIED: 'danger',
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  UNQUALIFIED: 'Unqualified',
};

const sourceLabels: Record<LeadSource, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  COLD_CALL: 'Cold Call',
  LINKEDIN: 'LinkedIn',
  TRADE_SHOW: 'Trade Show',
  EMAIL_CAMPAIGN: 'Email Campaign',
  UPWORK: 'Upwork',
  GURU: 'Guru',
  FREELANCER: 'Freelancer',
  OTHER: 'Other',
};

const activityIcons: Record<ActivityType, string> = {
  NOTE: '📝',
  CALL: '📞',
  MEETING: '🤝',
  EMAIL: '📧',
};

const activityTypes: ActivityType[] = ['NOTE', 'CALL', 'MEETING', 'EMAIL'];
const leadStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED'];
const leadSources: LeadSource[] = ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'LINKEDIN', 'TRADE_SHOW', 'EMAIL_CAMPAIGN', 'UPWORK', 'GURU', 'FREELANCER', 'OTHER'];
const regions = ['US', 'UK', 'EU', 'ME', 'APAC', 'LATAM'];

interface User {
  id: string;
  name: string;
  email: string;
}

interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  user: User;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  user: User;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  source: LeadSource;
  status: LeadStatus;
  regionTags: string[];
  ownerId: string;
  owner: User;
  isConverted: boolean;
  convertedToDealId: string | null;
  convertedToDeal: { id: string; name: string; stage: DealStage } | null;
  activities: Activity[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Modal states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [activityForm, setActivityForm] = useState({ type: 'NOTE' as ActivityType, subject: '', description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' });
  const [convertForm, setConvertForm] = useState({ name: '', pipeline: 'IT_SERVICES' as Pipeline });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    source: 'OTHER' as LeadSource,
    status: 'NEW' as LeadStatus,
    regionTags: [] as string[],
  });

  // Fetch lead data
  useEffect(() => {
    async function fetchLead() {
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setLead(null);
          }
          throw new Error('Failed to fetch lead');
        }
        const data = await res.json();
        setLead(data);
        setEditForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          title: data.title || '',
          source: data.source,
          status: data.status,
          regionTags: data.regionTags || [],
        });
        setConvertForm({
          name: data.company || data.name || 'Untitled Deal',
          pipeline: 'IT_SERVICES',
        });
      } catch (error) {
        console.error('Error fetching lead:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [id]);

  // Fetch users for task assignment
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
    fetchUsers();
  }, []);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityForm.type,
          subject: activityForm.subject,
          description: activityForm.description,
          leadId: id,
        }),
      });

      if (!res.ok) throw new Error('Failed to add activity');

      const newActivity = await res.json();
      setLead((prev) => prev ? { ...prev, activities: [newActivity, ...prev.activities] } : null);
      setActivityForm({ type: 'NOTE', subject: '', description: '' });
      setIsActivityModalOpen(false);
      showToast('Activity added', 'success');
    } catch (error) {
      showToast('Failed to add activity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          dueDate: taskForm.dueDate || null,
          leadId: id,
        }),
      });

      if (!res.ok) throw new Error('Failed to add task');

      const newTask = await res.json();
      setLead((prev) => prev ? { ...prev, tasks: [...prev.tasks, newTask].sort((a, b) =>
        new Date(a.dueDate || '9999').getTime() - new Date(b.dueDate || '9999').getTime()
      ) } : null);
      setTaskForm({ title: '', description: '', dueDate: '' });
      setIsTaskModalOpen(false);
      showToast('Task added', 'success');
    } catch (error) {
      showToast('Failed to add task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      setLead((prev) =>
        prev ? {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, completed: !completed } : t)),
        } : null
      );
    } catch (error) {
      showToast('Failed to update task', 'error');
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update lead');
      }

      const updatedLead = await res.json();
      setLead((prev) => prev ? { ...prev, ...updatedLead } : null);
      setIsEditMode(false);
      showToast('Lead updated', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToDeal = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convertForm),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert lead');
      }

      const deal = await res.json();
      setIsConvertModalOpen(false);
      showToast('Lead converted to deal successfully!', 'success');
      router.push(`/deals/${deal.id}`);
    } catch (error: any) {
      showToast(error.message || 'Failed to convert lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegionToggle = (region: string) => {
    setEditForm((prev) => ({
      ...prev,
      regionTags: prev.regionTags.includes(region)
        ? prev.regionTags.filter((r) => r !== region)
        : [...prev.regionTags, region],
    }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/10 rounded" />
          <div className="h-64 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <EmptyState
          icon="❌"
          title="Lead not found"
          description="The lead you're looking for doesn't exist"
          action={<Link href="/leads"><Button>Back to Leads</Button></Link>}
        />
      </div>
    );
  }

  const activitiesContent = (
    <div className="space-y-3">
      {lead.activities.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No activities yet"
          description="Add your first activity to track interactions"
        />
      ) : (
        lead.activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 rounded-lg bg-white/5 p-3">
            <span className="text-xl">{activityIcons[activity.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.subject}</p>
              {activity.description && (
                <p className="text-sm text-white/70 mt-1">{activity.description}</p>
              )}
              <p className="text-xs text-white/50 mt-1">
                {activity.user.name} · {formatDateTime(new Date(activity.createdAt))}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const tasksContent = (
    <div className="space-y-3">
      {lead.tasks.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No tasks yet"
          description="Create tasks to track your to-dos"
        />
      ) : (
        lead.tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 rounded-lg bg-white/5 p-3 ${
              task.completed ? 'opacity-60' : ''
            }`}
          >
            <button
              onClick={() => handleToggleTask(task.id, task.completed)}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                task.completed
                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {task.completed && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${task.completed ? 'text-white/60 line-through' : 'text-white'}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-xs text-white/50 mt-0.5">{task.description}</p>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs ${
                      task.completed
                        ? 'text-white/40'
                        : isOverdue(new Date(task.dueDate))
                        ? 'text-red-400'
                        : isToday(new Date(task.dueDate))
                        ? 'text-amber-400'
                        : 'text-white/50'
                    }`}
                  >
                    {isOverdue(new Date(task.dueDate)) && !task.completed && '⚠️ '}
                    Due {formatDate(new Date(task.dueDate))}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/70 mb-2"
          >
            ← Back to Leads
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <SectionHeader title={lead.company || lead.name} />
            <Badge variant={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge>
            {lead.isConverted && (
              <Badge variant="success">Converted</Badge>
            )}
          </div>
          <p className="text-sm text-white/60 mt-1">{lead.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!lead.isConverted && (
            <>
              <Button variant="secondary" onClick={() => setIsEditMode(true)}>
                Edit
              </Button>
              <Button onClick={() => setIsConvertModalOpen(true)}>
                Convert to Deal
              </Button>
            </>
          )}
          {lead.isConverted && lead.convertedToDeal && (
            <Link href={`/deals/${lead.convertedToDeal.id}`}>
              <Button>View Deal</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Lead Details */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Details" />
              {isEditMode && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setIsEditMode(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            {isEditMode ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <TextInput
                  label="Company"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
                <TextInput
                  label="Phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <TextInput
                  label="Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <SelectInput
                  label="Source"
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value as LeadSource })}
                  options={leadSources.map((s) => ({ value: s, label: sourceLabels[s] }))}
                />
                <SelectInput
                  label="Status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as LeadStatus })}
                  options={leadStatuses.map((s) => ({ value: s, label: statusLabels[s] }))}
                />
                <div className="sm:col-span-2">
                  <p className="text-xs text-white/50 mb-2">Regions</p>
                  <div className="flex gap-2 flex-wrap">
                    {regions.map((region) => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => handleRegionToggle(region)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          editForm.regionTags.includes(region)
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-white/50 mb-1">Name</p>
                  <p className="text-sm text-white">{lead.name}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Company</p>
                  <p className="text-sm text-white">{lead.company || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Email</p>
                  <p className="text-sm text-white">{lead.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Phone</p>
                  <p className="text-sm text-white">{lead.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Title</p>
                  <p className="text-sm text-white">{lead.title || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Source</p>
                  <p className="text-sm text-white">{sourceLabels[lead.source]}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-white/50 mb-1">Regions</p>
                  <div className="flex gap-1 flex-wrap">
                    {lead.regionTags.length > 0 ? (
                      lead.regionTags.map((tag) => (
                        <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-white/50">-</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Activities & Tasks Tabs */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsActivityModalOpen(true)}>
                  + Activity
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setIsTaskModalOpen(true)}>
                  + Task
                </Button>
              </div>
            </div>
            <Tabs
              tabs={[
                { id: 'activities', label: `Activities (${lead.activities.length})`, content: activitiesContent },
                { id: 'tasks', label: `Tasks (${lead.tasks.length})`, content: tasksContent },
              ]}
            />
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Owner" className="mb-4" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30">
                <span className="text-sm font-medium text-cyan-400">
                  {lead.owner.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{lead.owner.name}</p>
                <p className="text-xs text-white/50">{lead.owner.email}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Timeline" className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Created</span>
                <span className="text-white">{formatDate(new Date(lead.createdAt))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Updated</span>
                <span className="text-white">{formatDate(new Date(lead.updatedAt))}</span>
              </div>
            </div>
          </GlassCard>

          {lead.convertedToDeal && (
            <GlassCard variant="secondary" className="p-6">
              <SectionHeader title="Converted Deal" className="mb-4" />
              <Link href={`/deals/${lead.convertedToDeal.id}`} className="block">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-colors">
                  <p className="text-sm font-medium text-white">{lead.convertedToDeal.name}</p>
                  <p className="text-xs text-white/50 mt-1">{stageLabels[lead.convertedToDeal.stage as keyof typeof stageLabels]}</p>
                </div>
              </Link>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Add Activity"
      >
        <form onSubmit={handleAddActivity} className="space-y-4">
          <SelectInput
            label="Type"
            value={activityForm.type}
            onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}
            options={activityTypes.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))}
          />
          <TextInput
            label="Subject"
            value={activityForm.subject}
            onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
            required
            placeholder="Brief summary..."
          />
          <TextareaInput
            label="Description (optional)"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            placeholder="Enter activity details..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsActivityModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Task"
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <TextInput
            label="Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
            placeholder="Follow up with client"
          />
          <TextareaInput
            label="Description (optional)"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            placeholder="Add more details..."
          />
          <TextInput
            label="Due Date"
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsTaskModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Convert to Deal Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert to Deal"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            Convert "{lead.company || lead.name}" to a deal. This will create a new deal record and link it to this lead.
          </p>
          <TextInput
            label="Deal Name"
            value={convertForm.name}
            onChange={(e) => setConvertForm({ ...convertForm, name: e.target.value })}
            placeholder="Enter deal name"
          />
          <SelectInput
            label="Pipeline"
            value={convertForm.pipeline}
            onChange={(e) => setConvertForm({ ...convertForm, pipeline: e.target.value as Pipeline })}
            options={pipelines.map((p) => ({ value: p, label: pipelineLabels[p] }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsConvertModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleConvertToDeal} disabled={saving}>
              {saving ? 'Converting...' : 'Convert to Deal'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
