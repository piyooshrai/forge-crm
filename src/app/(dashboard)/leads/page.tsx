import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';

// Mock data for UI demo
const mockLeads = [
  {
    id: '1',
    companyName: 'Acme Corporation',
    contactName: 'John Doe',
    source: 'Website',
    status: 'Qualified',
    owner: { name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    companyName: 'TechStart Inc',
    contactName: 'Jane Smith',
    source: 'Referral',
    status: 'New',
    owner: { name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    companyName: 'Global Ltd',
    contactName: 'Bob Johnson',
    source: 'Trade Show',
    status: 'Contacted',
    owner: { name: 'Demo User', email: 'demo@forge.com' },
    createdAt: new Date('2024-01-22'),
  },
];

export default function LeadsPage() {
  const leads = mockLeads;

  return (
    <div className="mx-auto max-w-[1920px] px-6 py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <SectionHeader title="Leads" />
        <Link
          href="/leads/new"
          className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
        >
          + New Lead
        </Link>
      </div>

      <GlassCard variant="primary" className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Company</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Source</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Owner</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm font-medium text-white hover:text-cyan-400 transition-colors"
                    >
                      {lead.companyName || 'Untitled'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">
                    {lead.contactName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">{lead.source || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400">
                      {lead.status || 'New'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">{lead.owner.name || lead.owner.email}</td>
                  <td className="px-4 py-3 text-sm text-white/50">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <div className="py-12 text-center text-sm text-white/50">
              No leads yet. Create your first lead to get started.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

