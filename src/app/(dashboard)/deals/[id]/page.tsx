import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import DealDetails from './DealDetails';
import LineItemsSection from './LineItemsSection';
import ActivitiesSection from './ActivitiesSection';
import TasksSection from './TasksSection';

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      owner: {
        select: { name: true, email: true },
      },
      lineItems: {
        include: {
          product: true,
          createdBy: {
            select: { name: true, email: true },
          },
        },
      },
      activities: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      tasks: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
      convertedFromLead: {
        select: { id: true, companyName: true },
      },
    },
  });

  if (!deal) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div className="mb-6">
        <Link href="/deals" className="text-sm text-white/50 hover:text-white/70 mb-2 inline-block">
          ← Back to Deals
        </Link>
        <SectionHeader title={deal.name} className="mt-2" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DealDetails deal={deal} />
          <LineItemsSection dealId={deal.id} lineItems={deal.lineItems} />
          <ActivitiesSection dealId={deal.id} activities={deal.activities} />
          <TasksSection dealId={deal.id} tasks={deal.tasks} />
        </div>

        <div>
          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Owner" className="mb-4" />
            <p className="text-sm text-white">{deal.owner.name || deal.owner.email}</p>
            <p className="text-xs text-white/50 mt-1">
              Created {new Date(deal.createdAt).toLocaleDateString()}
            </p>
            {deal.convertedFromLead && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/50 mb-1">Converted from Lead</p>
                <Link
                  href={`/leads/${deal.convertedFromLead.id}`}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  {deal.convertedFromLead.companyName || 'View Lead'}
                </Link>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

