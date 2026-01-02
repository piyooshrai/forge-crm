'use client';

import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { useSession } from 'next-auth/react';
import { UserRole, DealStage, Pipeline, AmountType } from '@prisma/client';

// Client-side role checks (duplicated from auth-helpers for client components)
function canEditDeal(role: UserRole): boolean {
  return role === UserRole.SALES_REP || role === UserRole.SUPER_ADMIN;
}

function canSetDealStage(role: UserRole, stage: string): boolean {
  if (role === UserRole.SUPER_ADMIN) return true;
  if (role === UserRole.SALES_REP) return true;
  if (role === UserRole.MARKETING_REP) {
    return stage !== 'CLOSED_WON' && stage !== 'CLOSED_LOST';
  }
  return false;
}

interface Deal {
  id: string;
  name: string;
  pipeline: Pipeline;
  stage: DealStage;
  probability: number | null;
  closeDate: Date | null;
  amountType: AmountType;
  amountTotal: number | null;
  hourlyRate: number | null;
  expectedHours: number | null;
  source: string | null;
  regionTags: string[];
}

export default function DealDetails({ deal }: { deal: Deal }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    stage: deal.stage,
    probability: deal.probability || 0,
    closeDate: deal.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : '',
  });

  const canEdit = session && canEditDeal(session.user.role as UserRole);
  const canChangeStage = session && canSetDealStage(session.user.role as UserRole, formData.stage);

  const handleSave = async () => {
    if (!canChangeStage) {
      alert('You do not have permission to set this stage');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setEditing(false);
        window.location.reload();
      } else {
        alert('Failed to update deal');
      }
    } catch (error) {
      alert('Error updating deal');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = () => {
    if (deal.amountType === AmountType.HOURLY && deal.hourlyRate && deal.expectedHours) {
      return `$${(deal.hourlyRate * deal.expectedHours).toLocaleString()} ($${deal.hourlyRate}/hr × ${deal.expectedHours}hrs)`;
    }
    if (deal.amountTotal) {
      return `$${deal.amountTotal.toLocaleString()}`;
    }
    return '-';
  };

  return (
    <GlassCard variant="primary" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <SectionHeader title="Details" />
        {canEdit && (
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={loading}
            className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            {editing ? (loading ? 'Saving...' : 'Save') : 'Edit'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-white/50 mb-1">Pipeline</p>
          <p className="text-sm text-white">{deal.pipeline.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-xs text-white/50 mb-1">Stage</p>
          {editing ? (
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as DealStage })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
            >
              {Object.values(DealStage).map((stage) => (
                <option key={stage} value={stage}>
                  {stage.replace('_', ' ')}
                </option>
              ))}
            </select>
          ) : (
            <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400">
              {deal.stage.replace('_', ' ')}
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-white/50 mb-1">Probability</p>
          {editing ? (
            <input
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
            />
          ) : (
            <p className="text-sm text-white">{deal.probability || 0}%</p>
          )}
        </div>
        <div>
          <p className="text-xs text-white/50 mb-1">Amount</p>
          <p className="text-sm text-white">{formatAmount()}</p>
        </div>
        <div>
          <p className="text-xs text-white/50 mb-1">Close Date</p>
          {editing ? (
            <input
              type="date"
              value={formData.closeDate}
              onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
            />
          ) : (
            <p className="text-sm text-white">
              {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : '-'}
            </p>
          )}
        </div>
        {deal.source && (
          <div>
            <p className="text-xs text-white/50 mb-1">Source</p>
            <p className="text-sm text-white">{deal.source}</p>
          </div>
        )}
        {deal.regionTags.length > 0 && (
          <div>
            <p className="text-xs text-white/50 mb-1">Regions</p>
            <div className="flex gap-2">
              {deal.regionTags.map((tag, i) => (
                <span key={i} className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

