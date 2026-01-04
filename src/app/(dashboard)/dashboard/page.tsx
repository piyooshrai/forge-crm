'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import StatTile from '@/components/StatTile';
import SectionHeader from '@/components/SectionHeader';
import { formatCurrency, formatDate, stageLabels, type DealStage } from '@/lib/mock-data';

interface ApiDeal {
  id: string;
  name: string;
  pipeline: string;
  stage: string;
  probability: number;
  amountType: string;
  amountTotal: number;
  closeDate: string;
  owner: { id: string; name: string; email: string };
  createdAt: string;
}

interface ApiLead {
  id: string;
  name: string;
  company: string;
  source: string;
  status: string;
  createdAt: string;
}

interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  user: { name: string };
  lead?: { company: string } | null;
  deal?: { name: string } | null;
}

interface ApiActivity {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  user: { name: string };
  lead?: { company: string } | null;
  deal?: { name: string } | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect marketing reps to their page
  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'MARKETING_REP') {
      router.replace('/marketing/tasks');
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, leadsRes, tasksRes, activitiesRes] = await Promise.all([
          fetch('/api/deals'),
          fetch('/api/leads'),
          fetch('/api/tasks'),
          fetch('/api/activities'),
        ]);

        if (dealsRes.ok) setDeals(await dealsRes.json());
        if (leadsRes.ok) setLeads(await leadsRes.json());
        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (activitiesRes.ok) setActivities(await activitiesRes.json());
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalPipeline = deals
      .filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage))
      .reduce((sum, d) => sum + d.amountTotal, 0);

    const openDeals = deals.filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).length;
    const dealsInNegotiation = deals.filter(d => d.stage === 'NEGOTIATION').length;

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const newLeadsThisWeek = leads.filter(l => new Date(l.createdAt) >= thisWeek).length;

    const closedWon = deals.filter(d => d.stage === 'CLOSED_WON').length;
    const closedTotal = deals.filter(d => ['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).length;
    const conversionRate = closedTotal > 0 ? Math.round((closedWon / closedTotal) * 100) : 0;

    return {
      totalPipeline,
      newLeads: leads.length,
      newLeadsThisWeek,
      openDeals,
      dealsInNegotiation,
      conversionRate,
    };
  }, [deals, leads]);

  // Deal stages summary
  const dealStages = useMemo(() => {
    const stages: DealStage[] = ['QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];
    return stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const count = stageDeals.length;
      const total = deals.filter(d => !['CLOSED_LOST'].includes(d.stage)).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        stage: stageLabels[stage],
        value: percentage,
        color: stage === 'CLOSED_WON' ? '#a5f3fc' : stage === 'NEGOTIATION' ? '#7dd3fc' : stage === 'PROPOSAL' ? '#67e8f9' : '#5ee7df',
      };
    });
  }, [deals]);

  // Tasks due today
  const tasksDueToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks
      .filter(t => !t.completed && t.dueDate)
      .filter(t => {
        const due = new Date(t.dueDate!);
        due.setHours(0, 0, 0, 0);
        return due <= tomorrow;
      })
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        task: t.title,
        context: t.deal?.name || t.lead?.company || '',
        time: t.dueDate ? formatDate(new Date(t.dueDate)) : 'No due date',
      }));
  }, [tasks]);

  // Top deals
  const topDeals = useMemo(() => {
    return deals
      .filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage))
      .sort((a, b) => b.amountTotal - a.amountTotal)
      .slice(0, 4)
      .map(d => ({
        id: d.id,
        company: d.name,
        value: formatCurrency(d.amountTotal),
        stage: stageLabels[d.stage as DealStage] || d.stage,
      }));
  }, [deals]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const getTimeAgo = (date: string) => {
      const now = new Date();
      const actDate = new Date(date);
      const diffMs = now.getTime() - actDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    };

    const activityTypeMap: Record<string, string> = {
      NOTE: 'Note added',
      CALL: 'Call logged',
      MEETING: 'Meeting held',
      EMAIL: 'Email sent',
    };

    return activities.slice(0, 8).map(a => ({
      id: a.id,
      action: `${activityTypeMap[a.type] || a.type}: ${a.deal?.name || a.lead?.company || a.subject}`,
      time: getTimeAgo(a.createdAt),
      type: a.type === 'EMAIL' || a.type === 'NOTE' ? 'info' : 'success',
    }));
  }, [activities]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-white/5 rounded-xl"></div>
            <div className="h-80 bg-white/5 rounded-xl"></div>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="h-72 bg-white/5 rounded-xl"></div>
            <div className="h-48 bg-white/5 rounded-xl"></div>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="h-56 bg-white/5 rounded-xl"></div>
            <div className="h-64 bg-white/5 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* KPI Tiles */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex flex-col gap-6">
              <StatTile
                label="Total Pipeline"
                value={formatCurrency(metrics.totalPipeline)}
                change={`${metrics.openDeals} open deals`}
              />
              <div className="h-px bg-white/10" />
              <StatTile
                label="New Leads"
                value={String(metrics.newLeads)}
                change={`+${metrics.newLeadsThisWeek} this week`}
              />
              <div className="h-px bg-white/10" />
              <StatTile
                label="Open Deals"
                value={String(metrics.openDeals)}
                change={`${metrics.dealsInNegotiation} in negotiation`}
              />
            </div>
          </GlassCard>

          {/* Tasks Due Today */}
          <GlassCard variant="secondary" className="p-6 flex-1 flex flex-col min-h-0">
            <SectionHeader title="Upcoming Tasks" className="mb-4 flex-shrink-0" />
            <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
              {tasksDueToday.length > 0 ? tasksDueToday.map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="flex-1">
                    <p className="text-sm text-white/80">{task.task}</p>
                    {task.context && (
                      <p className="text-xs text-cyan-400/70 mt-0.5">{task.context}</p>
                    )}
                    <p className="text-xs text-white/40 mt-1">{task.time}</p>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/30 mt-1.5" />
                </div>
              )) : (
                <p className="text-sm text-white/40 py-4 text-center">No upcoming tasks</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Center Column */}
        <div className="flex flex-col gap-6">
          {/* Pipeline Summary */}
          <GlassCard variant="primary" className="p-6">
            <SectionHeader title="Pipeline by Value" subtitle="Open deals" className="mb-6" />
            <div className="space-y-4">
              {['LEAD', 'QUALIFIED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION'].map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage);
                const stageValue = stageDeals.reduce((sum, d) => sum + d.amountTotal, 0);
                const maxValue = Math.max(...['LEAD', 'QUALIFIED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION'].map(s =>
                  deals.filter(d => d.stage === s).reduce((sum, d) => sum + d.amountTotal, 0)
                ), 1);
                const percentage = Math.round((stageValue / maxValue) * 100);

                return (
                  <div key={stage} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/55">{stageLabels[stage as DealStage]}</span>
                      <span className="text-sm text-cyan-400 font-medium">{formatCurrency(stageValue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500/80 to-cyan-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Deal Stages */}
          <GlassCard variant="secondary" className="p-6 flex-1">
            <SectionHeader title="Deal Stages" className="mb-6" />
            <div className="flex flex-col gap-4">
              {dealStages.map((stage, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/55">{stage.stage}</span>
                    <span className="text-sm text-white/90 font-semibold">{stage.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${stage.value}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Conversion KPI */}
          <GlassCard variant="primary" className="p-6">
            <SectionHeader title="Win Rate" className="mb-6" />
            <div className="flex items-center justify-center">
              <div className="relative h-48 w-48">
                <svg className="h-48 w-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#5ee7df"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - metrics.conversionRate / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-semibold text-white">{metrics.conversionRate}%</p>
                    <p className="text-sm text-white/40 mt-1">Conversion Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Top Deals */}
          <GlassCard variant="secondary" className="p-6 flex-1">
            <SectionHeader title="Top Deals" className="mb-4" />
            <div className="flex flex-col gap-4">
              {topDeals.length > 0 ? topDeals.map((deal) => (
                <Link href={`/deals/${deal.id}`} key={deal.id} className="block">
                  <div className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-2 px-2 rounded transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{deal.company}</p>
                      <p className="text-sm font-semibold text-cyan-400">{deal.value}</p>
                    </div>
                    <p className="text-xs text-white/40">{deal.stage}</p>
                  </div>
                </Link>
              )) : (
                <p className="text-sm text-white/40 py-4 text-center">No open deals</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Full-Width: Recent Activity */}
      <div className="mt-6">
        <GlassCard variant="secondary" className="p-6">
          <SectionHeader title="Recent Activity" className="mb-6" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {recentActivity.length > 0 ? recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-2">
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                  activity.type === 'success' ? 'bg-cyan-400' :
                  activity.type === 'warning' ? 'bg-amber-400/60' :
                  'bg-cyan-400/40'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{activity.action}</p>
                  <p className="text-xs text-white/40 mt-1">{activity.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-white/40 py-4 col-span-4 text-center">No recent activity</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

