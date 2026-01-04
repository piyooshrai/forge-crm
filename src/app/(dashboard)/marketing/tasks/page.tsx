'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const TASK_TYPES = [
  { value: 'LINKEDIN_OUTREACH', label: 'LinkedIn Outreach' },
  { value: 'COLD_EMAIL', label: 'Cold Email' },
  { value: 'SOCIAL_POST', label: 'Social Post' },
  { value: 'BLOG_POST', label: 'Blog Post' },
  { value: 'EMAIL_CAMPAIGN', label: 'Email Campaign' },
  { value: 'EVENT', label: 'Event' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'CONTENT_CREATION', label: 'Content Creation' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'NO_RESPONSE', label: 'No Response' },
];

const OUTCOME_OPTIONS = [
  { value: 'SUCCESS', label: 'Success' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'FAILED', label: 'Failed' },
];

interface Task {
  id: string;
  type: string;
  description: string;
  target?: string;
  content?: string;
  taskDate: string;
  status: string;
  outcome?: string;
  resultNotes?: string;
  leadGenerated: boolean;
  isTemplate: boolean;
  templateName?: string;
  user: { id: string; name: string };
  product?: { id: string; name: string } | null;
}

interface Product {
  id: string;
  name: string;
}

interface Stats {
  summary: {
    totalTasks: number;
    completedTasks: number;
    successTasks: number;
    successRate: number;
    leadsGenerated: number;
  };
  byType: Array<{
    type: string;
    count: number;
    successRate: number;
    leadsGenerated: number;
  }>;
}

export default function MarketingTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal states
  const [showNewTask, setShowNewTask] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState<Task | null>(null);
  const [showUpdateOutcome, setShowUpdateOutcome] = useState<Task | null>(null);

  // New task form
  const [newTask, setNewTask] = useState({
    type: 'LINKEDIN_OUTREACH',
    description: '',
    target: '',
    content: '',
    taskDate: new Date().toISOString().split('T')[0],
    productId: '',
  });

  // Update outcome form
  const [updateForm, setUpdateForm] = useState({
    status: 'COMPLETED',
    outcome: 'SUCCESS',
    resultNotes: '',
    leadGenerated: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, filterType, filterOutcome, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterOutcome) params.append('outcome', filterOutcome);
      if (filterStatus) params.append('status', filterStatus);

      const [tasksRes, templatesRes, statsRes, productsRes] = await Promise.all([
        fetch(`/api/marketing-tasks?${params.toString()}`),
        fetch('/api/marketing-tasks?templates=true'),
        fetch('/api/marketing-tasks/stats?days=7'),
        fetch('/api/products'),
      ]);

      const tasksData = await tasksRes.json();
      const templatesData = await templatesRes.json();
      const statsData = await statsRes.json();
      const productsData = await productsRes.json();

      setTasks(tasksData.tasks || []);
      setTemplates(templatesData.tasks || []);
      setStats(statsData);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData = {
        ...newTask,
        productId: newTask.productId || undefined,
      };
      const res = await fetch('/api/marketing-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        setShowNewTask(false);
        setNewTask({
          type: 'LINKEDIN_OUTREACH',
          description: '',
          target: '',
          content: '',
          taskDate: new Date().toISOString().split('T')[0],
          productId: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateOutcome = async () => {
    if (!showUpdateOutcome) return;

    try {
      const res = await fetch(`/api/marketing-tasks/${showUpdateOutcome.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm),
      });

      if (res.ok) {
        setShowUpdateOutcome(null);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleSaveAsTemplate = async (task: Task) => {
    const templateName = prompt('Enter template name:');
    if (!templateName) return;

    try {
      await fetch(`/api/marketing-tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTemplate: true, templateName }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const useTemplate = (template: Task) => {
    setNewTask({
      type: template.type,
      description: template.description,
      target: template.target || '',
      content: template.content || '',
      taskDate: new Date().toISOString().split('T')[0],
      productId: template.product?.id || '',
    });
    setShowNewTask(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/marketing-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleDeleteAll = async () => {
    const count = tasks.filter(t => !t.isTemplate).length;
    if (count === 0) {
      alert('No tasks to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${count} task(s)? This cannot be undone.`)) return;

    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterOutcome) params.append('outcome', filterOutcome);
      if (filterStatus) params.append('status', filterStatus);

      const res = await fetch(`/api/marketing-tasks?${params.toString()}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete tasks:', error);
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'SUCCESS': return 'text-green-400';
      case 'PARTIAL': return 'text-yellow-400';
      case 'FAILED': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    return TASK_TYPES.find(t => t.value === type)?.label || type;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Marketing Tasks</h1>
        <div className="flex gap-2">
          {tasks.filter(t => !t.isTemplate).length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 border border-red-600/30"
            >
              Delete All
            </button>
          )}
          <button
            onClick={() => setShowNewTask(true)}
            className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700"
          >
            New Task
          </button>
        </div>
      </div>

      {/* Weekly Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Tasks Completed</p>
            <p className="text-2xl font-bold text-white tabular-nums">{stats.summary.completedTasks}</p>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Success Rate</p>
            <p className={`text-2xl font-bold tabular-nums ${stats.summary.successRate >= 25 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.summary.successRate}%
            </p>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Leads Generated</p>
            <p className="text-2xl font-bold text-cyan-400 tabular-nums">{stats.summary.leadsGenerated}</p>
          </div>
          <div className="p-4 bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider">This Week</p>
            <p className="text-2xl font-bold text-white tabular-nums">{stats.summary.totalTasks}</p>
          </div>
        </div>
      )}

      {/* By Type Breakdown */}
      {stats && stats.byType.length > 0 && (
        <div className="p-4 bg-slate-900/50 border border-slate-800">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">By Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.byType.slice(0, 4).map(t => (
              <div key={t.type} className="text-sm">
                <p className="text-gray-300">{getTypeLabel(t.type)}</p>
                <p className="text-xs text-gray-500">
                  {t.count} tasks, {t.successRate}% success, {t.leadsGenerated} leads
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
        >
          <option value="">All Types</option>
          {TASK_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={filterOutcome}
          onChange={(e) => setFilterOutcome(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
        >
          <option value="">All Outcomes</option>
          {OUTCOME_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      <div className="bg-slate-900/50 border border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Recent Tasks</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {tasks.length === 0 ? (
            <div className="p-4 text-gray-500">No tasks found</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="p-4 hover:bg-slate-800/30">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-slate-800 text-gray-400">
                        {getTypeLabel(task.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.taskDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 mt-1">{task.description}</p>
                    {task.target && (
                      <p className="text-xs text-gray-500 mt-1">Target: {task.target}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{task.status.replace('_', ' ')}</p>
                      <p className={`text-sm font-medium ${getOutcomeColor(task.outcome)}`}>
                        {task.outcome || '-'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowTaskDetail(task)}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        View
                      </button>
                      {task.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => {
                            setShowUpdateOutcome(task);
                            setUpdateForm({
                              status: 'COMPLETED',
                              outcome: 'SUCCESS',
                              resultNotes: '',
                              leadGenerated: false,
                            });
                          }}
                          className="text-xs text-yellow-400 hover:text-yellow-300"
                        >
                          Update
                        </button>
                      )}
                      {task.outcome === 'SUCCESS' && !task.isTemplate && (
                        <button
                          onClick={() => handleSaveAsTemplate(task)}
                          className="text-xs text-green-400 hover:text-green-300"
                        >
                          Save Template
                        </button>
                      )}
                      {!task.isTemplate && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Templates</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {templates.map(template => (
              <div key={template.id} className="p-4 hover:bg-slate-800/30">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-300 font-medium">{template.templateName || template.description}</p>
                    <p className="text-xs text-gray-500">{getTypeLabel(template.type)}</p>
                  </div>
                  <button
                    onClick={() => useTemplate(template)}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">New Marketing Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Type</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                >
                  {TASK_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Description *</label>
                <input
                  type="text"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                  placeholder="What did you do?"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Target (optional)</label>
                <input
                  type="text"
                  value={newTask.target}
                  onChange={(e) => setNewTask({ ...newTask, target: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                  placeholder="Who/what did you target?"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Content/Message (optional)</label>
                <textarea
                  value={newTask.content}
                  onChange={(e) => setNewTask({ ...newTask, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                  placeholder="The actual message or content..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  value={newTask.taskDate}
                  onChange={(e) => setNewTask({ ...newTask, taskDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                />
              </div>
              {products.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Product/Service (optional)</label>
                  <select
                    value={newTask.productId}
                    onChange={(e) => setNewTask({ ...newTask, productId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                  >
                    <option value="">None</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewTask(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTask.description}
                className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-50"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Outcome Modal */}
      {showUpdateOutcome && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-white mb-4">Update Outcome</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Outcome</label>
                <select
                  value={updateForm.outcome}
                  onChange={(e) => setUpdateForm({ ...updateForm, outcome: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                >
                  {OUTCOME_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Result Notes</label>
                <textarea
                  value={updateForm.resultNotes}
                  onChange={(e) => setUpdateForm({ ...updateForm, resultNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                  placeholder="What happened?"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateForm.leadGenerated}
                    onChange={(e) => setUpdateForm({ ...updateForm, leadGenerated: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">Lead Generated</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowUpdateOutcome(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOutcome}
                className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Task Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Type</p>
                <p className="text-gray-300">{getTypeLabel(showTaskDetail.type)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Description</p>
                <p className="text-gray-300">{showTaskDetail.description}</p>
              </div>
              {showTaskDetail.target && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Target</p>
                  <p className="text-gray-300">{showTaskDetail.target}</p>
                </div>
              )}
              {showTaskDetail.content && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Content/Message</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{showTaskDetail.content}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                  <p className="text-gray-300">{showTaskDetail.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Outcome</p>
                  <p className={getOutcomeColor(showTaskDetail.outcome)}>{showTaskDetail.outcome || '-'}</p>
                </div>
              </div>
              {showTaskDetail.resultNotes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Result Notes</p>
                  <p className="text-gray-300">{showTaskDetail.resultNotes}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Lead Generated</p>
                <p className={showTaskDetail.leadGenerated ? 'text-green-400' : 'text-gray-500'}>
                  {showTaskDetail.leadGenerated ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTaskDetail(null)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
