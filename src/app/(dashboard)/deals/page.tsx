'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, Button, TextInput, SelectInput, Badge, EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  dealStages,
  stageLabels,
  stageProbabilities,
  pipelines,
  pipelineLabels,
  amountTypes,
  formatCurrency,
  formatDate,
  type DealStage,
  type Pipeline,
  type AmountType,
} from '@/lib/mock-data';

// API Deal type (matches Prisma schema)
interface ApiDeal {
  id: string;
  name: string;
  pipeline: string;
  stage: string;
  probability: number;
  amountType: string;
  amountTotal: number;
  hourlyRate: number | null;
  expectedHours: number | null;
  monthlyAmount: number | null;
  closeDate: string;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  lineItems?: any[];
  convertedFromLead?: any;
  createdAt: string;
  updatedAt: string;
}

const stageColors: Record<DealStage, string> = {
  LEAD: 'bg-white/10 text-white/70',
  QUALIFIED: 'bg-blue-500/20 text-blue-400',
  DISCOVERY: 'bg-purple-500/20 text-purple-400',
  PROPOSAL: 'bg-amber-500/20 text-amber-400',
  NEGOTIATION: 'bg-orange-500/20 text-orange-400',
  CLOSED_WON: 'bg-emerald-500/20 text-emerald-400',
  CLOSED_LOST: 'bg-red-500/20 text-red-400',
};

function DealsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'list';
  const pipelineParam = searchParams.get('pipeline') || 'all';

  const { showToast } = useToast();
  const { data: session } = useSession();
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = (session?.user as any)?.id;

  // New deal form
  const [formData, setFormData] = useState({
    name: '',
    pipeline: 'IT_SERVICES' as Pipeline,
    stage: 'LEAD' as DealStage,
    amountType: 'FIXED' as AmountType,
    amountTotal: '',
    hourlyRate: '',
    expectedHours: '',
    monthlyAmount: '',
    closeDate: '',
  });

  // Fetch deals from API
  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deals');
      if (!res.ok) throw new Error('Failed to fetch deals');
      const data = await res.json();
      setDeals(data);
    } catch (error) {
      showToast('Failed to load deals', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch = deal.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPipeline = pipelineParam === 'all' || deal.pipeline === pipelineParam;
      const matchesMine = !showMineOnly || deal.ownerId === currentUserId;
      return matchesSearch && matchesPipeline && matchesMine;
    });
  }, [deals, searchTerm, pipelineParam, showMineOnly, currentUserId]);

  // Group deals by stage for kanban
  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, ApiDeal[]> = {} as Record<DealStage, ApiDeal[]>;
    dealStages.forEach((stage) => {
      grouped[stage] = filteredDeals.filter((d) => d.stage === stage);
    });
    return grouped;
  }, [filteredDeals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        pipeline: formData.pipeline,
        stage: formData.stage,
        amountType: formData.amountType,
        closeDate: formData.closeDate,
      };

      if (formData.amountType === 'FIXED') {
        payload.amountTotal = Number(formData.amountTotal) || 0;
      } else if (formData.amountType === 'HOURLY') {
        payload.hourlyRate = Number(formData.hourlyRate) || 0;
        payload.expectedHours = Number(formData.expectedHours) || 0;
      } else if (formData.amountType === 'RETAINER') {
        payload.monthlyAmount = Number(formData.monthlyAmount) || 0;
      }

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create deal');
      }

      const newDeal = await res.json();
      setDeals([newDeal, ...deals]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        pipeline: 'IT_SERVICES',
        stage: 'LEAD',
        amountType: 'FIXED',
        amountTotal: '',
        hourlyRate: '',
        expectedHours: '',
        monthlyAmount: '',
        closeDate: '',
      });
      showToast('Deal created successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create deal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    const deal = deals.find((d) => d.id === dealId);

    if (!deal || deal.stage === newStage) return;

    // Optimistic update
    setDeals(deals.map((d) =>
      d.id === dealId ? { ...d, stage: newStage, probability: stageProbabilities[newStage] } : d
    ));

    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        // Revert on error
        setDeals(deals);
        const error = await res.json();
        throw new Error(error.error || 'Failed to update deal');
      }

      showToast(`Deal moved to ${stageLabels[newStage]}`, 'info');
    } catch (error: any) {
      showToast(error.message || 'Failed to update deal stage', 'error');
      // Refetch to ensure consistent state
      fetchDeals();
    }
  };

  const setView = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    router.push(`/deals?${params.toString()}`);
  };

  const setPipeline = (newPipeline: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pipeline', newPipeline);
    router.push(`/deals?${params.toString()}`);
  };

  // Calculate amount for form preview
  const calculateAmount = () => {
    if (formData.amountType === 'HOURLY') {
      return (Number(formData.hourlyRate) || 0) * (Number(formData.expectedHours) || 0);
    }
    if (formData.amountType === 'RETAINER') {
      return (Number(formData.monthlyAmount) || 0) * 12;
    }
    return Number(formData.amountTotal) || 0;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1920px] px-4 py-6 lg:px-8 lg:py-8">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-white/10 rounded mb-6"></div>
          <div className="h-12 bg-white/5 rounded-lg mb-6"></div>
          <div className="h-96 bg-white/5 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1920px] px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Deals" subtitle={`${filteredDeals.length} deals`} />
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                view === 'list' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white/80'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                view === 'kanban' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white/80'
              }`}
            >
              Kanban
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>+ New Deal</Button>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="mb-6 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPipeline('all')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                pipelineParam === 'all'
                  ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All Pipelines
            </button>
            {pipelines.map((p) => (
              <button
                key={p}
                onClick={() => setPipeline(p)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  pipelineParam === p
                    ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {pipelineLabels[p]}
              </button>
            ))}
            <button
              onClick={() => setShowMineOnly(!showMineOnly)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                showMineOnly
                  ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {showMineOnly ? 'My Deals' : 'All Deals'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* List View */}
      {view === 'list' && (
        <GlassCard variant="primary" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                    Deal Name
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 md:table-cell">
                    Pipeline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/50">
                    Amount
                  </th>
                  <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-white/50 lg:table-cell">
                    Probability
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 sm:table-cell">
                    Close Date
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 lg:table-cell">
                    Owner
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="block font-medium text-white hover:text-cyan-400 transition-colors"
                      >
                        {deal.name}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-white/60 md:table-cell">
                      {pipelineLabels[deal.pipeline as Pipeline] || deal.pipeline}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${stageColors[deal.stage as DealStage] || 'bg-white/10 text-white/70'}`}>
                        {stageLabels[deal.stage as DealStage] || deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-cyan-400">
                        {formatCurrency(deal.amountTotal)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-center lg:table-cell">
                      <span className="text-sm text-white/60">{deal.probability}%</span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-white/50 sm:table-cell">
                      {formatDate(new Date(deal.closeDate))}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-white/60 lg:table-cell">
                      {deal.owner?.name || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDeals.length === 0 && (
              <EmptyState
                icon="💼"
                title="No deals found"
                description="Try adjusting your filters or create a new deal"
                action={<Button onClick={() => setIsModalOpen(true)}>+ New Deal</Button>}
              />
            )}
          </div>
        </GlassCard>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${dealStages.length * 280}px` }}>
            {dealStages.map((stage) => (
              <div
                key={stage}
                className="w-[280px] shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <GlassCard variant="secondary" className="h-full">
                  <div className="border-b border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stageColors[stage]}`}>
                        {stageLabels[stage]}
                      </span>
                      <span className="text-xs text-white/50">{dealsByStage[stage].length}</span>
                    </div>
                    <p className="mt-1 text-xs text-cyan-400">
                      {formatCurrency(dealsByStage[stage].reduce((sum, d) => sum + d.amountTotal, 0))}
                    </p>
                  </div>
                  <div className="space-y-2 p-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                    {dealsByStage[stage].map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className="cursor-grab rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors active:cursor-grabbing"
                      >
                        <Link href={`/deals/${deal.id}`} className="block">
                          <p className="text-sm font-medium text-white mb-1 hover:text-cyan-400 transition-colors">
                            {deal.name}
                          </p>
                          <p className="text-xs text-cyan-400 font-medium">
                            {formatCurrency(deal.amountTotal)}
                          </p>
                          <p className="text-xs text-white/50 mt-1">
                            Close: {formatDate(new Date(deal.closeDate))}
                          </p>
                        </Link>
                      </div>
                    ))}
                    {dealsByStage[stage].length === 0 && (
                      <div className="py-8 text-center text-xs text-white/40">
                        No deals in this stage
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Deal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Deal" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Deal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Acme Corp - Cloud Migration"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Pipeline"
              value={formData.pipeline}
              onChange={(e) => setFormData({ ...formData, pipeline: e.target.value as Pipeline })}
              options={pipelines.map((p) => ({ value: p, label: pipelineLabels[p] }))}
            />
            <SelectInput
              label="Stage"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
              options={dealStages.map((s) => ({ value: s, label: stageLabels[s] }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Amount Type"
              value={formData.amountType}
              onChange={(e) => setFormData({ ...formData, amountType: e.target.value as AmountType })}
              options={amountTypes.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))}
            />
            <TextInput
              label="Close Date"
              type="date"
              value={formData.closeDate}
              onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
              required
            />
          </div>

          {/* Amount fields based on type */}
          {formData.amountType === 'FIXED' && (
            <TextInput
              label="Total Amount"
              type="number"
              value={formData.amountTotal}
              onChange={(e) => setFormData({ ...formData, amountTotal: e.target.value })}
              placeholder="100000"
            />
          )}
          {formData.amountType === 'HOURLY' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Hourly Rate"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="150"
              />
              <TextInput
                label="Expected Hours"
                type="number"
                value={formData.expectedHours}
                onChange={(e) => setFormData({ ...formData, expectedHours: e.target.value })}
                placeholder="1000"
              />
            </div>
          )}
          {formData.amountType === 'RETAINER' && (
            <TextInput
              label="Monthly Amount"
              type="number"
              value={formData.monthlyAmount}
              onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
              placeholder="5000"
            />
          )}

          {/* Amount Preview */}
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50 mb-1">Calculated Total</p>
            <p className="text-lg font-semibold text-cyan-400">{formatCurrency(calculateAmount())}</p>
            {formData.amountType === 'HOURLY' && (
              <p className="text-xs text-white/50 mt-1">
                {formData.hourlyRate || 0}/hr × {formData.expectedHours || 0} hours
              </p>
            )}
            {formData.amountType === 'RETAINER' && (
              <p className="text-xs text-white/50 mt-1">
                {formatCurrency(Number(formData.monthlyAmount) || 0)}/month × 12 months
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="mx-auto max-w-[1920px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-white/10 rounded mb-6"></div>
        <div className="h-12 bg-white/5 rounded-lg mb-6"></div>
        <div className="h-96 bg-white/5 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DealsContent />
    </Suspense>
  );
}
