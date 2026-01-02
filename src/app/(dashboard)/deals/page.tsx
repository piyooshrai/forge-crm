import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import DealsList from './DealsList';
import DealsKanban from './DealsKanban';
import { Pipeline, DealStage } from '@prisma/client';

// Mock data for UI demo
const mockDeals = [
  {
    id: '1',
    name: 'Acme Corporation - Q4 Project',
    pipeline: Pipeline.IT_SERVICES,
    stage: DealStage.PROPOSAL,
    probability: 75,
    amountTotal: 2400000,
    hourlyRate: null,
    expectedHours: null,
    amountType: 'FIXED',
    closeDate: new Date('2024-02-15'),
    owner: { name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    name: 'TechStart Inc - Cloud Migration',
    pipeline: Pipeline.IT_SERVICES,
    stage: DealStage.NEGOTIATION,
    probability: 60,
    amountTotal: 1800000,
    hourlyRate: null,
    expectedHours: null,
    amountType: 'FIXED',
    closeDate: new Date('2024-02-28'),
    owner: { name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    name: 'Global Ltd - Staffing Services',
    pipeline: Pipeline.STAFFING,
    stage: DealStage.QUALIFIED,
    probability: 40,
    amountTotal: 1200000,
    hourlyRate: null,
    expectedHours: null,
    amountType: 'FIXED',
    closeDate: new Date('2024-03-10'),
    owner: { name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date('2024-01-20'),
  },
];

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; pipeline?: string }>;
}) {
  const params = await searchParams;
  const view = params.view || 'list';
  const deals = mockDeals;

  return (
    <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader title="Deals" />
        <div className="flex items-center gap-4">
          <div className="flex gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
            <Link
              href="/deals?view=list"
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                view === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              List
            </Link>
            <Link
              href="/deals?view=kanban"
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                view === 'kanban'
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Kanban
            </Link>
          </div>
          <Link
            href="/deals/new"
            className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
          >
            + New Deal
          </Link>
        </div>
      </div>

      {view === 'kanban' ? (
        <DealsKanban deals={deals} />
      ) : (
        <DealsList deals={deals} />
      )}
    </div>
  );
}

