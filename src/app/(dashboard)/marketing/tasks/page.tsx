'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const RESPONSE_TYPES = [
  { value: 'INTERESTED', label: 'Interested (positive response)' },
  { value: 'NOT_INTERESTED', label: 'Not Interested (polite decline)' },
  { value: 'NO_RESPONSE', label: 'No Response (ghosted)' },
  { value: 'NO_REPLY_YET', label: 'No Reply Yet (waiting)' },
];

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
  // New engagement metrics
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  views?: number | null;
  opens?: number | null;
  sent?: number | null;
  replies?: number | null;
  attendees?: number | null;
  meetingsBooked?: number | null;
  // ICP engagement
  icpEngagement?: boolean;
  // Lead attribution
  leadsGeneratedCount?: number;
  generatedLeads?: Array<{ id: string; name: string; company?: string }>;
  // Response tracking
  responseType?: string | null;
  connectionAccepted?: boolean | null;
  // Outcome override
  outcomeOverride?: boolean;
  overrideReason?: string | null;
}

interface Lead {
  id: string;
  name: string;
  company?: string;
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
    // Engagement metrics
    likes: '',
    comments: '',
    shares: '',
    views: '',
    opens: '',
    sent: '',
    replies: '',
    attendees: '',
    meetingsBooked: '',
    // ICP engagement
    icpEngagement: false,
    // Lead attribution
    leadsGeneratedCount: '',
    linkedLeadIds: [] as string[],
    // Response tracking
    responseType: '',
    connectionAccepted: false,
    // Outcome override
    outcomeOverride: false,
    overrideReason: '',
  });

  // Available leads for linking
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);

  // Calculate outcome preview based on current form values
  const outcomePreview = useMemo(() => {
    if (!showUpdateOutcome || updateForm.outcomeOverride) return null;

    const taskType = showUpdateOutcome.type;
    const metrics = {
      likes: updateForm.likes ? parseInt(updateForm.likes) : 0,
      comments: updateForm.comments ? parseInt(updateForm.comments) : 0,
      shares: updateForm.shares ? parseInt(updateForm.shares) : 0,
      views: updateForm.views ? parseInt(updateForm.views) : 0,
      opens: updateForm.opens ? parseInt(updateForm.opens) : 0,
      sent: updateForm.sent ? parseInt(updateForm.sent) : 0,
      replies: updateForm.replies ? parseInt(updateForm.replies) : 0,
      attendees: updateForm.attendees ? parseInt(updateForm.attendees) : 0,
      meetingsBooked: updateForm.meetingsBooked ? parseInt(updateForm.meetingsBooked) : 0,
      icpEngagement: updateForm.icpEngagement,
      leadsGeneratedCount: updateForm.leadsGeneratedCount ? parseInt(updateForm.leadsGeneratedCount) : 0,
      responseType: updateForm.responseType || null,
      connectionAccepted: updateForm.connectionAccepted,
    };

    // Calculate outcome based on task type
    let outcome = 'PARTIAL';
    const checks: Array<{ label: string; passed: boolean; value: string | number | boolean }> = [];

    switch (taskType) {
      case 'SOCIAL_POST':
        checks.push({ label: 'Likes >= 10', passed: metrics.likes >= 10, value: metrics.likes });
        checks.push({ label: 'Comments >= 5', passed: metrics.comments >= 5, value: metrics.comments });
        checks.push({ label: 'ICP Engagement', passed: metrics.icpEngagement, value: metrics.icpEngagement });
        checks.push({ label: 'Leads Generated', passed: metrics.leadsGeneratedCount >= 1, value: metrics.leadsGeneratedCount });
        if (metrics.leadsGeneratedCount >= 1) outcome = 'SUCCESS';
        else if (metrics.likes >= 10 && metrics.comments >= 5 && metrics.icpEngagement) outcome = 'SUCCESS';
        else if ((metrics.likes >= 5 && metrics.likes < 10) || (metrics.comments >= 2 && metrics.comments < 5)) outcome = 'PARTIAL';
        else outcome = 'FAILED';
        break;
      case 'LINKEDIN_OUTREACH':
        checks.push({ label: 'Interested Response', passed: metrics.responseType === 'INTERESTED', value: metrics.responseType || 'None' });
        checks.push({ label: 'Connection Accepted', passed: metrics.connectionAccepted, value: metrics.connectionAccepted });
        checks.push({ label: 'Lead Generated', passed: metrics.leadsGeneratedCount >= 1, value: metrics.leadsGeneratedCount });
        if (metrics.responseType === 'INTERESTED' || metrics.leadsGeneratedCount >= 1) outcome = 'SUCCESS';
        else if (metrics.connectionAccepted || metrics.responseType === 'NOT_INTERESTED') outcome = 'PARTIAL';
        else outcome = 'FAILED';
        break;
      case 'BLOG_POST':
        checks.push({ label: 'Views >= 100', passed: metrics.views >= 100, value: metrics.views });
        checks.push({ label: 'ICP Traffic', passed: metrics.icpEngagement, value: metrics.icpEngagement });
        checks.push({ label: 'Leads Generated', passed: metrics.leadsGeneratedCount >= 1, value: metrics.leadsGeneratedCount });
        if (metrics.leadsGeneratedCount >= 1) outcome = 'SUCCESS';
        else if (metrics.views >= 100 && metrics.icpEngagement) outcome = 'SUCCESS';
        else if (metrics.views >= 50 && metrics.views < 100) outcome = 'PARTIAL';
        else outcome = 'FAILED';
        break;
      case 'EMAIL_CAMPAIGN':
      case 'COLD_EMAIL':
        const sentVal = metrics.sent || 1;
        const openRate = Math.round((metrics.opens / sentVal) * 100);
        const replyRate = Math.round((metrics.replies / sentVal) * 100);
        checks.push({ label: 'Open Rate >= 20%', passed: openRate >= 20, value: `${openRate}%` });
        checks.push({ label: 'Reply Rate >= 5%', passed: replyRate >= 5, value: `${replyRate}%` });
        checks.push({ label: 'Leads Generated', passed: metrics.leadsGeneratedCount >= 1, value: metrics.leadsGeneratedCount });
        if (replyRate >= 5 || metrics.leadsGeneratedCount >= 1) outcome = 'SUCCESS';
        else if (openRate >= 20) outcome = 'PARTIAL';
        else outcome = 'FAILED';
        break;
      case 'EVENT':
      case 'WEBINAR':
        checks.push({ label: 'Attendees >= 10', passed: metrics.attendees >= 10, value: metrics.attendees });
        checks.push({ label: 'Meetings Booked', passed: metrics.meetingsBooked >= 1, value: metrics.meetingsBooked });
        checks.push({ label: 'Leads Generated', passed: metrics.leadsGeneratedCount >= 1, value: metrics.leadsGeneratedCount });
        if (metrics.leadsGeneratedCount >= 1 || metrics.meetingsBooked >= 1) outcome = 'SUCCESS';
        else if (metrics.attendees >= 10) outcome = 'PARTIAL';
        else outcome = 'FAILED';
        break;
      default:
        checks.push({ label: 'ICP Engagement', passed: metrics.icpEngagement, value: metrics.icpEngagement });
        checks.push({ label: 'Leads Generated', passed: metrics.leadsGeneratedCount >= 1, value: metrics.leadsGeneratedCount });
        if (metrics.leadsGeneratedCount >= 1) outcome = 'SUCCESS';
        else if (metrics.icpEngagement) outcome = 'PARTIAL';
        break;
    }

    return { outcome, checks };
  }, [showUpdateOutcome, updateForm]);

  // Fetch available leads for linking
  const fetchAvailableLeads = async () => {
    try {
      const res = await fetch('/api/leads?status=NEW&limit=100');
      const data = await res.json();
      setAvailableLeads(data.leads || []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

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
      const payload: any = {
        status: updateForm.status,
        resultNotes: updateForm.resultNotes,
        leadGenerated: updateForm.leadGenerated || (updateForm.leadsGeneratedCount ? parseInt(updateForm.leadsGeneratedCount) > 0 : false),
        icpEngagement: updateForm.icpEngagement,
        outcomeOverride: updateForm.outcomeOverride,
        overrideReason: updateForm.overrideReason || null,
      };

      // Add engagement metrics based on task type
      const taskType = showUpdateOutcome.type;
      if (taskType === 'SOCIAL_POST') {
        payload.likes = updateForm.likes ? parseInt(updateForm.likes) : null;
        payload.comments = updateForm.comments ? parseInt(updateForm.comments) : null;
        payload.shares = updateForm.shares ? parseInt(updateForm.shares) : null;
      } else if (taskType === 'LINKEDIN_OUTREACH') {
        payload.responseType = updateForm.responseType || null;
        payload.connectionAccepted = updateForm.connectionAccepted;
      } else if (taskType === 'BLOG_POST') {
        payload.views = updateForm.views ? parseInt(updateForm.views) : null;
      } else if (taskType === 'EMAIL_CAMPAIGN' || taskType === 'COLD_EMAIL') {
        payload.sent = updateForm.sent ? parseInt(updateForm.sent) : null;
        payload.opens = updateForm.opens ? parseInt(updateForm.opens) : null;
        payload.replies = updateForm.replies ? parseInt(updateForm.replies) : null;
      } else if (taskType === 'EVENT' || taskType === 'WEBINAR') {
        payload.attendees = updateForm.attendees ? parseInt(updateForm.attendees) : null;
        payload.meetingsBooked = updateForm.meetingsBooked ? parseInt(updateForm.meetingsBooked) : null;
      }

      // Lead attribution
      if (updateForm.leadsGeneratedCount) {
        payload.leadsGeneratedCount = parseInt(updateForm.leadsGeneratedCount);
      }
      if (updateForm.linkedLeadIds.length > 0) {
        payload.linkedLeadIds = updateForm.linkedLeadIds;
      }

      // Manual outcome if override is enabled
      if (updateForm.outcomeOverride) {
        payload.outcome = updateForm.outcome;
      }

      const res = await fetch(`/api/marketing-tasks/${showUpdateOutcome.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

        {(filterType || filterStatus || filterOutcome) && (
          <button
            onClick={() => {
              setFilterType('');
              setFilterStatus('');
              setFilterOutcome('');
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 hover:bg-slate-700"
          >
            Reset Filters
          </button>
        )}
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
                              likes: '',
                              comments: '',
                              shares: '',
                              views: '',
                              opens: '',
                              sent: '',
                              replies: '',
                              attendees: '',
                              meetingsBooked: '',
                              icpEngagement: false,
                              leadsGeneratedCount: '',
                              linkedLeadIds: [],
                              responseType: '',
                              connectionAccepted: false,
                              outcomeOverride: false,
                              overrideReason: '',
                            });
                            fetchAvailableLeads();
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
          <div className="bg-slate-900 border border-slate-800 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Update Outcome - {getTypeLabel(showUpdateOutcome.type)}</h2>
            <div className="space-y-4">
              {/* Status */}
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

              {/* Type-specific engagement metrics */}
              {showUpdateOutcome.type === 'SOCIAL_POST' && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Engagement Metrics</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Likes</label>
                      <input
                        type="number"
                        value={updateForm.likes}
                        onChange={(e) => setUpdateForm({ ...updateForm, likes: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Comments</label>
                      <input
                        type="number"
                        value={updateForm.comments}
                        onChange={(e) => setUpdateForm({ ...updateForm, comments: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Shares</label>
                      <input
                        type="number"
                        value={updateForm.shares}
                        onChange={(e) => setUpdateForm({ ...updateForm, shares: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {showUpdateOutcome.type === 'LINKEDIN_OUTREACH' && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Response Tracking</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Response Type</label>
                    <select
                      value={updateForm.responseType}
                      onChange={(e) => setUpdateForm({ ...updateForm, responseType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                    >
                      <option value="">Select response...</option>
                      {RESPONSE_TYPES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateForm.connectionAccepted}
                      onChange={(e) => setUpdateForm({ ...updateForm, connectionAccepted: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Connection request accepted</span>
                  </label>
                </div>
              )}

              {showUpdateOutcome.type === 'BLOG_POST' && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Traffic Metrics</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Page Views</label>
                    <input
                      type="number"
                      value={updateForm.views}
                      onChange={(e) => setUpdateForm({ ...updateForm, views: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              )}

              {(showUpdateOutcome.type === 'EMAIL_CAMPAIGN' || showUpdateOutcome.type === 'COLD_EMAIL') && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Email Metrics</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sent</label>
                      <input
                        type="number"
                        value={updateForm.sent}
                        onChange={(e) => setUpdateForm({ ...updateForm, sent: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Opens</label>
                      <input
                        type="number"
                        value={updateForm.opens}
                        onChange={(e) => setUpdateForm({ ...updateForm, opens: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Replies</label>
                      <input
                        type="number"
                        value={updateForm.replies}
                        onChange={(e) => setUpdateForm({ ...updateForm, replies: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(showUpdateOutcome.type === 'EVENT' || showUpdateOutcome.type === 'WEBINAR') && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Event Metrics</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Attendees</label>
                      <input
                        type="number"
                        value={updateForm.attendees}
                        onChange={(e) => setUpdateForm({ ...updateForm, attendees: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Meetings Booked</label>
                      <input
                        type="number"
                        value={updateForm.meetingsBooked}
                        onChange={(e) => setUpdateForm({ ...updateForm, meetingsBooked: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ICP Engagement */}
              {['SOCIAL_POST', 'BLOG_POST', 'CONTENT_CREATION', 'OTHER'].includes(showUpdateOutcome.type) && (
                <div className="p-4 bg-slate-800/50 border border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateForm.icpEngagement}
                      onChange={(e) => setUpdateForm({ ...updateForm, icpEngagement: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="text-sm text-gray-300">Engagement was from target audience</span>
                      <p className="text-xs text-gray-500">B2B decision-makers, not random consumers</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Lead Generation */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Lead Generation</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Number of Leads Generated</label>
                    <input
                      type="number"
                      value={updateForm.leadsGeneratedCount}
                      onChange={(e) => setUpdateForm({ ...updateForm, leadsGeneratedCount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Link to Leads (optional)</label>
                    <select
                      multiple
                      value={updateForm.linkedLeadIds}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setUpdateForm({ ...updateForm, linkedLeadIds: selected });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 h-20"
                    >
                      {availableLeads.map(lead => (
                        <option key={lead.id} value={lead.id}>
                          {lead.name} {lead.company ? `(${lead.company})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Ctrl+click to select multiple</p>
                  </div>
                </div>
              </div>

              {/* Calculated Outcome Preview */}
              {outcomePreview && !updateForm.outcomeOverride && (
                <div className="p-4 bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Calculated Outcome</p>
                  <div className="space-y-2 mb-3">
                    {outcomePreview.checks.map((check, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-400">{check.label}</span>
                        <span className={check.passed ? 'text-green-400' : 'text-gray-500'}>
                          {check.passed ? '✓' : '✗'} {String(check.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
                    <span className="text-gray-400">Result:</span>
                    <span className={`text-lg font-bold ${
                      outcomePreview.outcome === 'SUCCESS' ? 'text-green-400' :
                      outcomePreview.outcome === 'PARTIAL' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {outcomePreview.outcome}
                    </span>
                  </div>
                </div>
              )}

              {/* Outcome Override */}
              <div className="p-4 bg-slate-800/50 border border-slate-700 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateForm.outcomeOverride}
                    onChange={(e) => setUpdateForm({ ...updateForm, outcomeOverride: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">Override calculated outcome</span>
                </label>
                {updateForm.outcomeOverride && (
                  <>
                    <div className="p-2 bg-yellow-900/20 border border-yellow-600/30 text-yellow-400 text-xs">
                      Manual overrides are reviewed by leadership. Provide detailed justification.
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Manual Outcome</label>
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
                      <label className="block text-xs text-gray-500 mb-1">Override Reason (required)</label>
                      <textarea
                        value={updateForm.overrideReason}
                        onChange={(e) => setUpdateForm({ ...updateForm, overrideReason: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                        placeholder="Why are you overriding the calculated outcome?"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Result Notes */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Result Notes</label>
                <textarea
                  value={updateForm.resultNotes}
                  onChange={(e) => setUpdateForm({ ...updateForm, resultNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
                  placeholder="What happened? Any learnings?"
                />
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
                disabled={updateForm.outcomeOverride && !updateForm.overrideReason}
                className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
