'use client';

import GlassCard from '@/components/GlassCard';
import StatTile from '@/components/StatTile';
import SectionHeader from '@/components/SectionHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Mock data
const revenueData = [
  { day: '1', revenue: 42000 },
  { day: '5', revenue: 45000 },
  { day: '10', revenue: 48000 },
  { day: '15', revenue: 52000 },
  { day: '20', revenue: 49000 },
  { day: '25', revenue: 55000 },
  { day: '30', revenue: 58000 },
];

const dealStages = [
  { stage: 'Qualified', value: 85, color: '#5ee7df' },
  { stage: 'Proposal', value: 65, color: '#67e8f9' },
  { stage: 'Negotiation', value: 45, color: '#7dd3fc' },
  { stage: 'Closed', value: 95, color: '#a5f3fc' },
];

const tasksDueToday = [
  { id: 1, task: 'Follow up with Acme Corp', time: '9:00 AM' },
  { id: 2, task: 'Review Q4 proposal', time: '11:00 AM' },
  { id: 3, task: 'Call TechStart Inc', time: '2:00 PM' },
  { id: 4, task: 'Send contract to Global Ltd', time: '3:30 PM' },
  { id: 5, task: 'Team standup meeting', time: '4:00 PM' },
];

const topDeals = [
  { company: 'Acme Corporation', value: '$2.4M', stage: 'Negotiation' },
  { company: 'TechStart Inc', value: '$1.8M', stage: 'Proposal' },
  { company: 'Global Ltd', value: '$1.2M', stage: 'Qualified' },
  { company: 'Enterprise Co', value: '$950K', stage: 'Qualified' },
];

const recentActivity = [
  { id: 1, action: 'Deal closed: Acme Corporation', time: '2 hours ago', type: 'success' },
  { id: 2, action: 'New lead: TechStart Inc', time: '4 hours ago', type: 'info' },
  { id: 3, action: 'Proposal sent: Global Ltd', time: '6 hours ago', type: 'info' },
  { id: 4, action: 'Meeting scheduled: Enterprise Co', time: '8 hours ago', type: 'info' },
  { id: 5, action: 'Contract signed: Digital Solutions', time: '1 day ago', type: 'success' },
  { id: 6, action: 'Follow-up completed: Innovation Labs', time: '1 day ago', type: 'info' },
  { id: 7, action: 'Deal lost: Old Corp', time: '2 days ago', type: 'warning' },
  { id: 8, action: 'New lead: Future Systems', time: '2 days ago', type: 'info' },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* KPI Tiles */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex flex-col gap-6">
              <StatTile label="Total Pipeline" value="$12.4M" change="+12% vs last month" />
              <div className="h-px bg-white/10" />
              <StatTile label="New Leads" value="47" change="+8 this week" />
              <div className="h-px bg-white/10" />
              <StatTile label="Open Deals" value="23" change="5 in negotiation" />
            </div>
          </GlassCard>

          {/* Tasks Due Today */}
          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Tasks Due Today" className="mb-4" />
            <div className="flex flex-col gap-4">
              {tasksDueToday.map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="flex-1">
                    <p className="text-sm text-white/80">{task.task}</p>
                    <p className="text-xs text-white/40 mt-1">{task.time}</p>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/30 mt-1.5" />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Center Column */}
        <div className="flex flex-col gap-6">
          {/* Revenue Performance */}
          <GlassCard variant="primary" className="p-6">
            <SectionHeader title="Revenue Performance" subtitle="Last 30 days" className="mb-6" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="day"
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#5ee7df"
                    strokeWidth={2}
                    dot={{ fill: '#5ee7df', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Deal Stages */}
          <GlassCard variant="secondary" className="p-6">
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
            <SectionHeader title="Monthly Conversion" className="mb-6" />
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
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - 0.68)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-semibold text-white">68%</p>
                    <p className="text-sm text-white/40 mt-1">Conversion Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Top Deals */}
          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Top Deals" className="mb-4" />
            <div className="flex flex-col gap-4">
              {topDeals.map((deal, index) => (
                <div key={index} className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{deal.company}</p>
                    <p className="text-sm font-semibold text-cyan-400">{deal.value}</p>
                  </div>
                  <p className="text-xs text-white/40">{deal.stage}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Full-Width: Recent Activity */}
      <div className="mt-6">
        <GlassCard variant="secondary" className="p-6">
          <SectionHeader title="Recent Activity" className="mb-6" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-2">
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                  activity.type === 'success' ? 'bg-cyan-400' :
                  activity.type === 'warning' ? 'bg-amber-400/60' :
                  'bg-cyan-400/40'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">{activity.action}</p>
                  <p className="text-xs text-white/40 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

