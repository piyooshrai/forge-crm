import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import { DealStage, Pipeline } from '@prisma/client';

interface Deal {
  id: string;
  name: string;
  pipeline: Pipeline;
  stage: DealStage;
  probability: number | null;
  amountTotal: number | null;
  hourlyRate: number | null;
  expectedHours: number | null;
  amountType: string;
  closeDate: Date | null;
  owner: { name: string | null; email: string };
  createdAt: Date;
}

export default function DealsList({ deals }: { deals: Deal[] }) {
  const formatAmount = (deal: Deal) => {
    if (deal.amountType === 'HOURLY' && deal.hourlyRate && deal.expectedHours) {
      return `$${(deal.hourlyRate * deal.expectedHours).toLocaleString()}`;
    }
    if (deal.amountTotal) {
      return `$${deal.amountTotal.toLocaleString()}`;
    }
    return '-';
  };

  return (
    <GlassCard variant="primary" className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Deal</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Pipeline</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Stage</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Probability</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Owner</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Close Date</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="text-sm font-medium text-white hover:text-cyan-400 transition-colors"
                  >
                    {deal.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-white/70">{deal.pipeline.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400">
                    {deal.stage.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-white">{formatAmount(deal)}</td>
                <td className="px-4 py-3 text-sm text-white/70">{deal.probability || 0}%</td>
                <td className="px-4 py-3 text-sm text-white/60">{deal.owner.name || deal.owner.email}</td>
                <td className="px-4 py-3 text-sm text-white/50">
                  {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deals.length === 0 && (
          <div className="py-12 text-center text-sm text-white/50">
            No deals yet. Create your first deal to get started.
          </div>
        )}
      </div>
    </GlassCard>
  );
}

