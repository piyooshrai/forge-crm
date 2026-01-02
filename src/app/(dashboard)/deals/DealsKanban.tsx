import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import { DealStage } from '@prisma/client';

interface Deal {
  id: string;
  name: string;
  stage: DealStage;
  amountTotal: number | null;
  hourlyRate: number | null;
  expectedHours: number | null;
  amountType: string;
  owner: { name: string | null; email: string };
}

const stages: DealStage[] = [
  DealStage.LEAD,
  DealStage.QUALIFIED,
  DealStage.DISCOVERY,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.CLOSED_WON,
  DealStage.CLOSED_LOST,
];

export default function DealsKanban({ deals }: { deals: Deal[] }) {
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
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage);
        return (
          <div key={stage} className="flex-shrink-0 w-72">
            <GlassCard variant="secondary" className="p-4">
              <h3 className="mb-4 text-sm font-medium text-white">
                {stage.replace('_', ' ')} ({stageDeals.length})
              </h3>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="block rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-colors"
                  >
                    <p className="text-sm font-medium text-white mb-1">{deal.name}</p>
                    <p className="text-xs text-cyan-400 mb-2">{formatAmount(deal)}</p>
                    <p className="text-xs text-white/50">{deal.owner.name || deal.owner.email}</p>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>
        );
      })}
    </div>
  );
}

