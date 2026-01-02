'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, ConfirmModal, Button, TextInput, SelectInput, TextareaInput, Badge, EmptyState, Tabs } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  mockLeads,
  mockActivities,
  mockTasks,
  activityTypes,
  leadStatuses,
  formatDate,
  formatDateTime,
  isOverdue,
  isToday,
  type Activity,
  type ActivityType,
  type Task,
  type LeadStatus,
} from '@/lib/mock-data';

const statusColors: Record<LeadStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  New: 'info',
  Contacted: 'warning',
  Qualified: 'success',
  Unqualified: 'danger',
};

const activityIcons: Record<ActivityType, string> = {
  NOTE: '📝',
  CALL: '📞',
  MEETING: '🤝',
  EMAIL: '📧',
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  // Find lead from mock data
  const leadData = mockLeads.find((l) => l.id === id);
  const [lead, setLead] = useState(leadData);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  // Modal states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [activityForm, setActivityForm] = useState({ type: 'NOTE' as ActivityType, description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' });
  const [editForm, setEditForm] = useState({
    companyName: lead?.companyName || '',
    contactName: lead?.contactName || '',
    contactEmail: lead?.contactEmail || '',
    contactPhone: lead?.contactPhone || '',
    status: lead?.status || 'New',
  });

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

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const newActivity: Activity = {
      id: String(Date.now()),
      type: activityForm.type,
      description: activityForm.description,
      user: { name: 'John Doe', email: 'john@forge.com' },
      createdAt: new Date(),
    };
    setActivities([newActivity, ...activities]);
    setActivityForm({ type: 'NOTE', description: '' });
    setIsActivityModalOpen(false);
    showToast('Activity added', 'success');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: String(Date.now()),
      title: taskForm.title,
      description: taskForm.description,
      dueDate: new Date(taskForm.dueDate),
      completed: false,
      user: { name: 'John Doe', email: 'john@forge.com' },
      createdAt: new Date(),
    };
    setTasks([newTask, ...tasks]);
    setTaskForm({ title: '', description: '', dueDate: '' });
    setIsTaskModalOpen(false);
    showToast('Task added', 'success');
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleSaveEdit = () => {
    setLead({ ...lead, ...editForm });
    setIsEditMode(false);
    showToast('Lead updated', 'success');
  };

  const handleConvertToDeal = () => {
    setIsConvertModalOpen(false);
    showToast('Lead converted to deal successfully!', 'success');
    setTimeout(() => {
      router.push('/deals/new-converted-deal');
    }, 1000);
  };

  const activitiesContent = (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No activities yet"
          description="Add your first activity to track interactions"
        />
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 rounded-lg bg-white/5 p-3">
            <span className="text-xl">{activityIcons[activity.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{activity.description}</p>
              <p className="text-xs text-white/50 mt-1">
                {activity.user.name} · {formatDateTime(activity.createdAt)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const tasksContent = (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No tasks yet"
          description="Create tasks to track your to-dos"
        />
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 rounded-lg bg-white/5 p-3 ${
              task.completed ? 'opacity-60' : ''
            }`}
          >
            <button
              onClick={() => handleToggleTask(task.id)}
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
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs ${
                    task.completed
                      ? 'text-white/40'
                      : isOverdue(task.dueDate)
                      ? 'text-red-400'
                      : isToday(task.dueDate)
                      ? 'text-amber-400'
                      : 'text-white/50'
                  }`}
                >
                  {isOverdue(task.dueDate) && !task.completed && '⚠️ '}
                  Due {formatDate(task.dueDate)}
                </span>
              </div>
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
          <div className="flex items-center gap-3">
            <SectionHeader title={lead.companyName} />
            <Badge variant={statusColors[lead.status]}>{lead.status}</Badge>
          </div>
          <p className="text-sm text-white/60 mt-1">{lead.contactName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsEditMode(true)}>
            Edit
          </Button>
          <Button onClick={() => setIsConvertModalOpen(true)}>
            Convert to Deal
          </Button>
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
                  <Button size="sm" variant="secondary" onClick={() => setIsEditMode(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                </div>
              )}
            </div>

            {isEditMode ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Company Name"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                />
                <TextInput
                  label="Contact Name"
                  value={editForm.contactName}
                  onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                />
                <TextInput
                  label="Phone"
                  type="tel"
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                />
                <SelectInput
                  label="Status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as LeadStatus })}
                  options={leadStatuses.map((s) => ({ value: s, label: s }))}
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-white/50 mb-1">Company</p>
                  <p className="text-sm text-white">{lead.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Contact</p>
                  <p className="text-sm text-white">{lead.contactName}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Email</p>
                  <p className="text-sm text-white">{lead.contactEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Phone</p>
                  <p className="text-sm text-white">{lead.contactPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Source</p>
                  <p className="text-sm text-white">{lead.source}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Regions</p>
                  <div className="flex gap-1 flex-wrap">
                    {lead.regionTags.map((tag) => (
                      <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                    ))}
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
                { id: 'activities', label: `Activities (${activities.length})`, content: activitiesContent },
                { id: 'tasks', label: `Tasks (${tasks.length})`, content: tasksContent },
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
                <span className="text-white">{formatDate(lead.createdAt)}</span>
              </div>
            </div>
          </GlassCard>
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
          <TextareaInput
            label="Description"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            required
            placeholder="Enter activity details..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsActivityModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Activity</Button>
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
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </Modal>

      {/* Convert to Deal Modal */}
      <ConfirmModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onConfirm={handleConvertToDeal}
        title="Convert to Deal"
        message={`Are you sure you want to convert "${lead.companyName}" to a deal? This will create a new deal record and link it to this lead.`}
        confirmText="Convert to Deal"
      />
    </div>
  );
}
