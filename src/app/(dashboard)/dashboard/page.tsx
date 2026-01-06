'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, EmptyState } from '@/components/ui';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine,
  LineChart,
  Line,
} from 'recharts';

interface TrendPoint {
  month: string;
  value: number;
}

interface KPIData {
  current: number;
  trend: TrendPoint[];
  status: 'green' | 'yellow' | 'red';
}

interface PersonPerformance {
  name: string;
  displayName: string;
  value: number;
  type: 'sales' | 'marketing';
}

interface ChannelPerformance {
  channel: string;
  displayName: string;
  value: number;
  total: number;
}

interface EffortVsRoi {
  channel: string;
  displayName: string;
  effort: number;
  roi: number;
  leadsCount: number;
  revenue: number;
}

interface DashboardData {
  topSection: {
    quotaPercent: KPIData;
    marketingSuccessRate: KPIData;
    pipelineValue: KPIData;
  };
  middleSection: {
    peoplePerformance: PersonPerformance[];
    channelPerformance: ChannelPerformance[];
  };
  bottomSection: {
    effortVsRoi: EffortVsRoi[];
  };
  alerts: {
    peopleNeedingAttention: { name: string; value: number; type: string }[];
    count: number;
  };
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const getBarColor = (value: number, thresholds: { green: number; yellow: number }) => {
  if (value >= thresholds.green) return '#22c55e';
  if (value >= thresholds.yellow) return '#eab308';
  return '#ef4444';
};

const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
  switch (status) {
    case 'green': return '#22c55e';
    case 'yellow': return '#eab308';
    case 'red': return '#ef4444';
  }
};

// Mini Sparkline Component
function Sparkline({ data, color }: { data: TrendPoint[]; color: string }) {
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  unit,
  trend,
  status,
  format = 'percent',
}: {
  title: string;
  value: number;
  unit?: string;
  trend: TrendPoint[];
  status: 'green' | 'yellow' | 'red';
  format?: 'percent' | 'currency';
}) {
  const displayValue = format === 'currency' ? formatCurrency(value) : `${value}%`;
  const statusColor = getStatusColor(status);

  return (
    <GlassCard variant="primary" className="p-6 flex-1">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-white/50 font-medium">{title}</p>
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
      </div>
      <p className="text-4xl font-bold text-white mb-2">
        {displayValue}
        {unit && <span className="text-lg text-white/50 ml-1">{unit}</span>}
      </p>
      <Sparkline data={trend} color={statusColor} />
      <p className="text-xs text-white/40 mt-2">6-month trend</p>
    </GlassCard>
  );
}

// Horizontal Bar Chart Component
function HorizontalBarChart({
  data,
  title,
  thresholds,
  emptyMessage = 'No data available',
}: {
  data: { name: string; value: number }[];
  title: string;
  thresholds: { green: number; yellow: number };
  emptyMessage?: string;
}) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white text-sm font-medium">{payload[0].payload.name}</p>
          <p className="text-cyan-400 text-sm">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  const isEmpty = data.length === 0;

  return (
    <GlassCard variant="secondary" className="p-6 flex-1">
      <SectionHeader title={title} className="mb-4" />
      {isEmpty ? (
        <div className="h-64 flex items-center justify-center">
          <EmptyState
            icon="📊"
            title={emptyMessage}
            description="Data will appear here once there is activity to report"
          />
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  domain={[0, Math.max(100, ...data.map(d => d.value))]}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={75}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.value, thresholds)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-white/50">{`>${thresholds.green}%`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span className="text-white/50">{`${thresholds.yellow}-${thresholds.green}%`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-white/50">{`<${thresholds.yellow}%`}</span>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}

// Scatter Plot Component
function EffortVsRoiChart({ data }: { data: EffortVsRoi[] }) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-white/20 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white text-sm font-medium mb-1">{item.displayName}</p>
          <p className="text-white/70 text-xs">Effort: {item.effort}%</p>
          <p className="text-white/70 text-xs">ROI: {item.roi}%</p>
          <p className="text-cyan-400 text-xs mt-1">Revenue: {formatCurrency(item.revenue)}</p>
        </div>
      );
    }
    return null;
  };

  // Custom dot renderer to color based on quadrant
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isHighRoi = payload.roi > payload.effort;
    const color = isHighRoi ? '#22c55e' : '#ef4444';

    return (
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill={color}
        fillOpacity={0.8}
        stroke={color}
        strokeWidth={2}
      />
    );
  };

  const isEmpty = data.length === 0;
  const maxValue = isEmpty ? 100 : Math.max(
    100,
    ...data.map(d => d.effort),
    ...data.map(d => d.roi)
  );

  return (
    <GlassCard variant="secondary" className="p-6">
      <SectionHeader title="Effort vs ROI by Channel" className="mb-4" />
      {isEmpty ? (
        <div className="h-80 flex items-center justify-center">
          <EmptyState
            icon="📈"
            title="No channel data available"
            description="Channel performance data will appear here once leads and deals are tracked"
          />
        </div>
      ) : (
        <>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <XAxis
                  type="number"
                  dataKey="effort"
                  domain={[0, maxValue]}
                  name="Effort"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  label={{
                    value: '% of Team Effort',
                    position: 'bottom',
                    offset: 20,
                    fill: 'rgba(255,255,255,0.5)',
                    fontSize: 12,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="roi"
                  domain={[0, maxValue]}
                  name="ROI"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  label={{
                    value: '% of Revenue',
                    angle: -90,
                    position: 'left',
                    offset: 10,
                    fill: 'rgba(255,255,255,0.5)',
                    fontSize: 12,
                  }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine
                  segment={[{ x: 0, y: 0 }, { x: maxValue, y: maxValue }]}
                  stroke="rgba(255,255,255,0.3)"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Break Even',
                    position: 'insideTopRight',
                    fill: 'rgba(255,255,255,0.4)',
                    fontSize: 10,
                  }}
                />
                <Scatter
                  name="Channels"
                  data={data}
                  shape={renderDot}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-white/50">High ROI (above line)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-white/50">Wasted Effort (below line)</span>
            </div>
          </div>
          {/* Channel labels */}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {data.map((item, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded bg-white/5 text-white/60"
              >
                {item.displayName}
              </span>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}

// Alert Badge Component
function AlertBadge({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 hover:bg-red-500/30 transition-colors shadow-lg"
    >
      <span className="text-lg">Warning</span>
      <span className="font-medium">{count} people need attention</span>
    </button>
  );
}

// Alert Modal Component
function AlertModal({
  isOpen,
  onClose,
  people,
}: {
  isOpen: boolean;
  onClose: () => void;
  people: { name: string; value: number; type: string }[];
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="People Needing Attention" size="md">
      <div className="space-y-3">
        {people.map((person, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div>
              <p className="text-white font-medium">{person.name}</p>
              <p className="text-xs text-white/50 capitalize">{person.type}</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${person.value < 50 ? 'text-red-400' : 'text-yellow-400'}`}>
                {person.value}%
              </p>
              <p className="text-xs text-white/50">
                {person.type === 'sales' ? 'Quota' : 'Success Rate'}
              </p>
            </div>
          </div>
        ))}
        {people.length === 0 && (
          <p className="text-white/50 text-center py-4">No one needs attention</p>
        )}
      </div>
    </Modal>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  // Redirect non-SUPER_ADMIN users
  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole === 'MARKETING_REP') {
        router.replace('/marketing/tasks');
      } else if (userRole === 'SALES_REP') {
        router.replace('/deals');
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/ceo');
        if (!res.ok) {
          if (res.status === 403) {
            setError('Access denied. This dashboard is for administrators only.');
            return;
          }
          throw new Error('Failed to fetch dashboard data');
        }
        const dashboardData = await res.json();
        setData(dashboardData);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (loading || status === 'loading') {
    return (
      <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-white/5 rounded-xl" />
            <div className="h-48 bg-white/5 rounded-xl" />
            <div className="h-48 bg-white/5 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-white/5 rounded-xl" />
            <div className="h-80 bg-white/5 rounded-xl" />
          </div>
          <div className="h-96 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
        <GlassCard variant="primary" className="p-8 text-center">
          <p className="text-red-400 text-lg">{error}</p>
        </GlassCard>
      </div>
    );
  }

  if (!data) return null;

  const { topSection, middleSection, bottomSection, alerts } = data;

  return (
    <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
      {/* Alert Badge */}
      <AlertBadge count={alerts.count} onClick={() => setAlertModalOpen(true)} />

      {/* Header */}
      <div className="mb-8">
        <SectionHeader
          title="CEO Performance Dashboard"
          subtitle="Real-time overview of sales and marketing performance"
        />
      </div>

      {/* Top Section: 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Sales Team Quota"
          value={topSection.quotaPercent.current}
          trend={topSection.quotaPercent.trend}
          status={topSection.quotaPercent.status}
        />
        <KPICard
          title="Marketing Success Rate"
          value={topSection.marketingSuccessRate.current}
          trend={topSection.marketingSuccessRate.trend}
          status={topSection.marketingSuccessRate.status}
        />
        <KPICard
          title="Total Pipeline Value"
          value={topSection.pipelineValue.current}
          trend={topSection.pipelineValue.trend}
          status={topSection.pipelineValue.status}
          format="currency"
        />
      </div>

      {/* Middle Section: 2 Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HorizontalBarChart
          title="People Performance"
          data={middleSection.peoplePerformance.map(p => ({
            name: p.displayName,
            value: p.value,
          }))}
          thresholds={{ green: 100, yellow: 70 }}
          emptyMessage="No team members to display"
        />
        <HorizontalBarChart
          title="Channel Performance"
          data={middleSection.channelPerformance.map(c => ({
            name: c.displayName,
            value: c.value,
          }))}
          thresholds={{ green: 30, yellow: 15 }}
          emptyMessage="No channel performance data"
        />
      </div>

      {/* Bottom Section: Scatter Plot */}
      <EffortVsRoiChart data={bottomSection.effortVsRoi} />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        people={alerts.peopleNeedingAttention}
      />
    </div>
  );
}
