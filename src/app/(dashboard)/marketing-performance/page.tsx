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

interface TypeStats {
  type: string;
  count: number;
  success: number;
  failed: number;
  successRate: number;
  leadsGenerated: number;
}

interface RepStats {
  userId: string;
  name: string;
  totalTasks: number;
  successRate: number;
  leadsGenerated: number;
}

interface Stats {
  period: { days: number; startDate: string };
  summary: {
    totalTasks: number;
    completedTasks: number;
    successTasks: number;
    partialTasks: number;
    failedTasks: number;
    successRate: number;
    leadsGenerated: number;
  };
  byType: TypeStats[];
  bestPerforming: TypeStats[];
  worstPerforming: TypeStats[];
  byRep: RepStats[];
}

interface Task {
  id: string;
  type: string;
  description: string;
  target?: string;
  taskDate: string;
  status: string;
  outcome?: string;
  leadGenerated: boolean;
  isTemplate: boolean;
  user: { id: string; name: string };
}

export default function MarketingPerformancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  // Filters for task explorer
  const [filterRep, setFilterRep] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterLeadGenerated, setFilterLeadGenerated] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, days]);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session, filterRep, filterType, filterOutcome, filterLeadGenerated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketing-tasks/stats?days=${days}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterOutcome) params.append('outcome', filterOutcome);

      const res = await fetch(`/api/marketing-tasks?${params.toString()}&limit=100`);
      const data = await res.json();

      let filtered = data.tasks || [];
      if (filterRep) {
        filtered = filtered.filter((t: Task) => t.user.id === filterRep);
      }
      if (filterLeadGenerated === 'yes') {
        filtered = filtered.filter((t: Task) => t.leadGenerated);
      } else if (filterLeadGenerated === 'no') {
        filtered = filtered.filter((t: Task) => !t.leadGenerated);
      }

      setTasks(filtered);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    return TASK_TYPES.find(t => t.value === type)?.label || type;
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'SUCCESS': return 'text-green-400';
      case 'PARTIAL': return 'text-yellow-400';
      case 'FAILED': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Check if user is SUPER_ADMIN
  const isAdmin = (session?.user as any)?.role === 'SUPER_ADMIN';

  if (!isAdmin && status !== 'loading') {
    return (
      <div className="p-8">
        <p className="text-red-400">Access denied. Super Admin only.</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-white">Marketing Performance</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {stats && (
        <>
          {/* Aggregate Performance */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Tasks</p>
              <p className="text-2xl font-bold text-white tabular-nums">{stats.summary.totalTasks}</p>
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
              <p className="text-xs text-gray-500 uppercase tracking-wider">Successes</p>
              <p className="text-2xl font-bold text-green-400 tabular-nums">{stats.summary.successTasks}</p>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Failures</p>
              <p className="text-2xl font-bold text-red-400 tabular-nums">{stats.summary.failedTasks}</p>
            </div>
          </div>

          {/* Channel/Type Performance Table */}
          <div className="bg-slate-900/50 border border-slate-800">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Performance by Type</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-slate-800">
                    <th className="text-left p-4">Type</th>
                    <th className="text-right p-4">Tasks</th>
                    <th className="text-right p-4">Success</th>
                    <th className="text-right p-4">Failed</th>
                    <th className="text-right p-4">Success Rate</th>
                    <th className="text-right p-4">Leads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stats.byType.map(t => (
                    <tr key={t.type} className="hover:bg-slate-800/30">
                      <td className="p-4 text-gray-300">{getTypeLabel(t.type)}</td>
                      <td className="p-4 text-right text-gray-300 tabular-nums">{t.count}</td>
                      <td className="p-4 text-right text-green-400 tabular-nums">{t.success}</td>
                      <td className="p-4 text-right text-red-400 tabular-nums">{t.failed}</td>
                      <td className={`p-4 text-right tabular-nums font-medium ${t.successRate >= 25 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.successRate}%
                      </td>
                      <td className="p-4 text-right text-cyan-400 tabular-nums">{t.leadsGenerated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Best Performing */}
            <div className="p-4 bg-slate-900/50 border border-slate-800">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Best Performing</h3>
              {stats.bestPerforming.length > 0 ? (
                <div className="space-y-2">
                  {stats.bestPerforming.map(t => (
                    <div key={t.type} className="flex justify-between">
                      <span className="text-gray-300">{getTypeLabel(t.type)}</span>
                      <span className="text-green-400 tabular-nums">{t.successRate}% success, {t.leadsGenerated} leads</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No data</p>
              )}
            </div>

            {/* Worst Performing */}
            <div className="p-4 bg-slate-900/50 border border-slate-800">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Needs Improvement</h3>
              {stats.worstPerforming.length > 0 ? (
                <div className="space-y-2">
                  {stats.worstPerforming.map(t => (
                    <div key={t.type} className="flex justify-between">
                      <span className="text-gray-300">{getTypeLabel(t.type)}</span>
                      <span className="text-red-400 tabular-nums">{t.successRate}% success - REVIEW</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">All channels performing well</p>
              )}
            </div>
          </div>

          {/* Performance by Rep */}
          {stats.byRep.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Performance by Rep</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-slate-800">
                      <th className="text-left p-4">Name</th>
                      <th className="text-right p-4">Tasks</th>
                      <th className="text-right p-4">Success Rate</th>
                      <th className="text-right p-4">Leads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stats.byRep.map(rep => (
                      <tr key={rep.userId} className="hover:bg-slate-800/30">
                        <td className="p-4 text-gray-300">{rep.name}</td>
                        <td className="p-4 text-right text-gray-300 tabular-nums">{rep.totalTasks}</td>
                        <td className={`p-4 text-right tabular-nums font-medium ${rep.successRate >= 25 ? 'text-green-400' : 'text-red-400'}`}>
                          {rep.successRate}%
                        </td>
                        <td className="p-4 text-right text-cyan-400 tabular-nums">{rep.leadsGenerated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Individual Task Explorer */}
      <div className="bg-slate-900/50 border border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Task Explorer</h3>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 flex gap-4 flex-wrap">
          {stats && stats.byRep.length > 0 && (
            <select
              value={filterRep}
              onChange={(e) => setFilterRep(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
            >
              <option value="">All Reps</option>
              {stats.byRep.map(rep => (
                <option key={rep.userId} value={rep.userId}>{rep.name}</option>
              ))}
            </select>
          )}

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
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
          >
            <option value="">All Outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="PARTIAL">Partial</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={filterLeadGenerated}
            onChange={(e) => setFilterLeadGenerated(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300"
          >
            <option value="">All</option>
            <option value="yes">Lead Generated</option>
            <option value="no">No Lead</option>
          </select>
        </div>

        {/* Tasks List */}
        <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="p-4 text-gray-500">No tasks found</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="p-4 hover:bg-slate-800/30">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{task.user.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-800 text-gray-400">
                        {getTypeLabel(task.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.taskDate).toLocaleDateString()}
                      </span>
                      {task.leadGenerated && (
                        <span className="text-xs px-2 py-0.5 bg-cyan-900/50 text-cyan-400">Lead</span>
                      )}
                      {task.isTemplate && (
                        <span className="text-xs px-2 py-0.5 bg-purple-900/50 text-purple-400">Template</span>
                      )}
                    </div>
                    <p className="text-gray-300 mt-1 text-sm">{task.description}</p>
                    {task.target && (
                      <p className="text-xs text-gray-500 mt-1">Target: {task.target}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{task.status.replace('_', ' ')}</p>
                    <p className={`text-sm font-medium ${getOutcomeColor(task.outcome)}`}>
                      {task.outcome || '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
