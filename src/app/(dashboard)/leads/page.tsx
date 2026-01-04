'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, Button, TextInput, SelectInput, Badge, EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  leadStatuses,
  leadSources,
  regions,
  formatDate,
  type LeadStatus,
  type LeadSource,
  type Region,
} from '@/lib/mock-data';

// API Lead type (matches Prisma schema)
interface ApiLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  title: string | null;
  source: string;
  status: string;
  regionTags: string[];
  isConverted: boolean;
  convertedToDealId: string | null;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  marketingRepId: string | null;
  marketingRep: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

// Map API status to display status
const statusDisplayMap: Record<string, LeadStatus> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  UNQUALIFIED: 'Unqualified',
};

// Map display status to API status
const statusApiMap: Record<LeadStatus, string> = {
  New: 'NEW',
  Contacted: 'CONTACTED',
  Qualified: 'QUALIFIED',
  Unqualified: 'UNQUALIFIED',
};

// Map API source to display source
const sourceDisplayMap: Record<string, LeadSource> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  COLD_CALL: 'Cold Call',
  LINKEDIN: 'LinkedIn',
  TRADE_SHOW: 'Trade Show',
  EMAIL_CAMPAIGN: 'Email Campaign',
  UPWORK: 'Upwork',
  GURU: 'Guru',
  FREELANCER: 'Freelancer',
  OTHER: 'Other',
};

// Map display source to API source
const sourceApiMap: Record<LeadSource, string> = {
  'Website': 'WEBSITE',
  'Referral': 'REFERRAL',
  'Cold Call': 'COLD_CALL',
  'LinkedIn': 'LINKEDIN',
  'Trade Show': 'TRADE_SHOW',
  'Email Campaign': 'EMAIL_CAMPAIGN',
  'Upwork': 'UPWORK',
  'Guru': 'GURU',
  'Freelancer': 'FREELANCER',
  'Other': 'OTHER',
};

const statusColors: Record<LeadStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  New: 'info',
  Contacted: 'warning',
  Qualified: 'success',
  Unqualified: 'danger',
};

export default function LeadsPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [salesRepFilter, setSalesRepFilter] = useState<string>('all');
  const [marketingRepFilter, setMarketingRepFilter] = useState<string>('all');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = (session?.user as any)?.id;

  // New lead form state
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    title: '',
    source: 'Website' as LeadSource,
    status: 'New' as LeadStatus,
    regionTags: [] as Region[],
  });

  // Fetch leads from API
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [leadsRes, usersRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/users'),
      ]);
      if (!leadsRes.ok) throw new Error('Failed to fetch leads');
      const leadsData = await leadsRes.json();
      setLeads(leadsData);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (error) {
      showToast('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || lead.status === statusApiMap[statusFilter as LeadStatus];
      const matchesSource = sourceFilter === 'all' || lead.source === sourceApiMap[sourceFilter as LeadSource];
      const matchesRegion =
        regionFilter === 'all' || lead.regionTags.includes(regionFilter);
      const matchesSalesRep = salesRepFilter === 'all' || lead.ownerId === salesRepFilter;
      const matchesMarketingRep = marketingRepFilter === 'all' || lead.marketingRepId === marketingRepFilter;
      const matchesMine = !showMineOnly || lead.ownerId === currentUserId;

      return matchesSearch && matchesStatus && matchesSource && matchesRegion && matchesSalesRep && matchesMarketingRep && matchesMine;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter, regionFilter, salesRepFilter, marketingRepFilter, showMineOnly, currentUserId]);

  // Get sales reps and marketing reps for filter dropdowns
  const salesReps = useMemo(() =>
    users.filter(u => u.role === 'SALES_REP' || u.role === 'SUPER_ADMIN'),
    [users]
  );
  const marketingReps = useMemo(() =>
    users.filter(u => u.role === 'MARKETING_REP' || u.role === 'SUPER_ADMIN'),
    [users]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: formData.company,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          title: formData.title || null,
          source: sourceApiMap[formData.source],
          status: statusApiMap[formData.status],
          regionTags: formData.regionTags,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create lead');
      }

      const newLead = await res.json();
      setLeads([newLead, ...leads]);
      setIsModalOpen(false);
      setFormData({
        company: '',
        name: '',
        email: '',
        phone: '',
        title: '',
        source: 'Website',
        status: 'New',
        regionTags: [],
      });
      showToast('Lead created successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create lead', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegionToggle = (region: Region) => {
    setFormData((prev) => ({
      ...prev,
      regionTags: prev.regionTags.includes(region)
        ? prev.regionTags.filter((r) => r !== region)
        : [...prev.regionTags, region],
    }));
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      setLeads(leads.filter(l => l.id !== leadId));
      showToast('Lead deleted', 'success');
    } catch (error) {
      showToast('Failed to delete lead', 'error');
    }
  };

  const handleDeleteAll = async () => {
    const count = filteredLeads.length;
    if (count === 0) {
      showToast('No leads to delete', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${count} lead(s)? This cannot be undone.`)) return;

    try {
      const deletePromises = filteredLeads.map(lead =>
        fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      fetchLeads();
      showToast(`${count} leads deleted`, 'success');
    } catch (error) {
      showToast('Failed to delete leads', 'error');
    }
  };

  // Edit/Reassign modal state
  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);
  const [editForm, setEditForm] = useState({
    ownerId: '',
    marketingRepId: '',
  });

  const openEditModal = (lead: ApiLead) => {
    setEditingLead(lead);
    setEditForm({
      ownerId: lead.ownerId,
      marketingRepId: lead.marketingRepId || '',
    });
  };

  const handleReassign = async () => {
    if (!editingLead) return;

    try {
      const res = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: editForm.ownerId,
          marketingRepId: editForm.marketingRepId || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update lead');

      const updatedLead = await res.json();
      setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l));
      setEditingLead(null);
      showToast('Lead updated', 'success');
    } catch (error) {
      showToast('Failed to update lead', 'error');
    }
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Leads" subtitle={`${filteredLeads.length} leads`} />
        <div className="flex gap-2">
          {filteredLeads.length > 0 && (
            <Button variant="secondary" onClick={handleDeleteAll} className="!bg-red-600/20 !text-red-400 !border-red-600/30 hover:!bg-red-600/30">
              Delete All
            </Button>
          )}
          <Button onClick={() => setIsModalOpen(true)}>+ New Lead</Button>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="mb-6 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by company, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="all" className="bg-[#1a1f2e]">All Statuses</option>
              {leadStatuses.map((status) => (
                <option key={status} value={status} className="bg-[#1a1f2e]">
                  {status}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="all" className="bg-[#1a1f2e]">All Sources</option>
              {leadSources.map((source) => (
                <option key={source} value={source} className="bg-[#1a1f2e]">
                  {source}
                </option>
              ))}
            </select>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="all" className="bg-[#1a1f2e]">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region} className="bg-[#1a1f2e]">
                  {region}
                </option>
              ))}
            </select>
            {salesReps.length > 0 && (
              <select
                value={salesRepFilter}
                onChange={(e) => setSalesRepFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
              >
                <option value="all" className="bg-[#1a1f2e]">All Sales Reps</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id} className="bg-[#1a1f2e]">
                    {rep.name}
                  </option>
                ))}
              </select>
            )}
            {marketingReps.length > 0 && (
              <select
                value={marketingRepFilter}
                onChange={(e) => setMarketingRepFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
              >
                <option value="all" className="bg-[#1a1f2e]">All Marketing Reps</option>
                {marketingReps.map((rep) => (
                  <option key={rep.id} value={rep.id} className="bg-[#1a1f2e]">
                    {rep.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowMineOnly(!showMineOnly)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                showMineOnly
                  ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {showMineOnly ? 'My Leads' : 'All Leads'}
            </button>
            {(searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || regionFilter !== 'all' || salesRepFilter !== 'all' || marketingRepFilter !== 'all' || showMineOnly) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSourceFilter('all');
                  setRegionFilter('all');
                  setSalesRepFilter('all');
                  setMarketingRepFilter('all');
                  setShowMineOnly(false);
                }}
                className="px-3 py-2 text-sm rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Leads Table */}
      <GlassCard variant="primary" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Company / Contact
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 md:table-cell">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Status
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 lg:table-cell">
                  Regions
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 sm:table-cell">
                  Sales Rep
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 sm:table-cell">
                  Marketing Rep
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 md:table-cell">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="block font-medium text-white hover:text-cyan-400 transition-colors"
                    >
                      {lead.company}
                    </Link>
                    <p className="text-sm text-white/50">{lead.name}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-white/60 md:table-cell">
                    {sourceDisplayMap[lead.source] || lead.source}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusColors[statusDisplayMap[lead.status] || 'New']}>
                      {statusDisplayMap[lead.status] || lead.status}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {lead.regionTags.map((tag) => (
                        <Badge key={tag} variant="default" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-white/60 sm:table-cell">
                    {lead.owner?.name || 'Unassigned'}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-white/60 sm:table-cell">
                    {lead.marketingRep?.name || '-'}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-white/50 md:table-cell">
                    {formatDate(new Date(lead.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(lead)}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <EmptyState
              icon="👥"
              title="No leads found"
              description="Try adjusting your filters or create a new lead"
              action={<Button onClick={() => setIsModalOpen(true)}>+ New Lead</Button>}
            />
          )}
        </div>
      </GlassCard>

      {/* New Lead Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Lead" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Company Name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
              placeholder="Acme Corporation"
            />
            <TextInput
              label="Contact Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="John Smith"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="john@acme.com"
            />
            <TextInput
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 555-0100"
            />
          </div>
          <TextInput
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="CEO, CTO, etc."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
              options={leadSources.map((s) => ({ value: s, label: s }))}
            />
            <SelectInput
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
              options={leadStatuses.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Regions</label>
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => handleRegionToggle(region)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    formData.regionTags.includes(region)
                      ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit/Reassign Modal */}
      <Modal isOpen={!!editingLead} onClose={() => setEditingLead(null)} title="Edit Lead" size="md">
        {editingLead && (
          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-white/50">Lead</p>
              <p className="text-white font-medium">{editingLead.company}</p>
              <p className="text-sm text-white/60">{editingLead.name}</p>
            </div>

            <SelectInput
              label="Sales Rep"
              value={editForm.ownerId}
              onChange={(e) => setEditForm({ ...editForm, ownerId: e.target.value })}
              options={salesReps.map((rep) => ({ value: rep.id, label: rep.name }))}
            />

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Marketing Rep</label>
              <select
                value={editForm.marketingRepId}
                onChange={(e) => setEditForm({ ...editForm, marketingRepId: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
              >
                <option value="" className="bg-[#1a1f2e]">None</option>
                {marketingReps.map((rep) => (
                  <option key={rep.id} value={rep.id} className="bg-[#1a1f2e]">
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditingLead(null)}>
                Cancel
              </Button>
              <Button onClick={handleReassign}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
