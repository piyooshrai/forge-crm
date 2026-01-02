import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import ConvertLeadButton from './ConvertLeadButton';
import ActivitiesSection from './ActivitiesSection';
import TasksSection from './TasksSection';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      owner: {
        select: { name: true, email: true },
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
      convertedToDeal: {
        select: { id: true, name: true, stage: true },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/leads" className="text-sm text-white/50 hover:text-white/70 mb-2 inline-block">
            ← Back to Leads
          </Link>
          <SectionHeader title={lead.companyName || 'Untitled Lead'} className="mt-2" />
        </div>
        {!lead.convertedToDealId && <ConvertLeadButton leadId={lead.id} />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard variant="primary" className="p-6">
            <SectionHeader title="Details" className="mb-4" />
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/50 mb-1">Company</p>
                <p className="text-sm text-white">{lead.companyName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Contact</p>
                <p className="text-sm text-white">{lead.contactName || '-'}</p>
                {lead.contactEmail && (
                  <p className="text-sm text-white/70">{lead.contactEmail}</p>
                )}
                {lead.contactPhone && (
                  <p className="text-sm text-white/70">{lead.contactPhone}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Source</p>
                <p className="text-sm text-white">{lead.source || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Status</p>
                <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400">
                  {lead.status || 'New'}
                </span>
              </div>
              {lead.regionTags.length > 0 && (
                <div>
                  <p className="text-xs text-white/50 mb-1">Regions</p>
                  <div className="flex gap-2">
                    {lead.regionTags.map((tag, i) => (
                      <span key={i} className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {lead.convertedToDealId && (
                <div>
                  <p className="text-xs text-white/50 mb-1">Converted to Deal</p>
                  <Link
                    href={`/deals/${lead.convertedToDealId}`}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    {lead.convertedToDeal?.name || 'View Deal'}
                  </Link>
                </div>
              )}
            </div>
          </GlassCard>

          <ActivitiesSection leadId={lead.id} activities={lead.activities} />
          <TasksSection leadId={lead.id} tasks={lead.tasks} />
        </div>

        <div>
          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Owner" className="mb-4" />
            <p className="text-sm text-white">{lead.owner.name || lead.owner.email}</p>
            <p className="text-xs text-white/50 mt-1">
              Created {new Date(lead.createdAt).toLocaleDateString()}
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

