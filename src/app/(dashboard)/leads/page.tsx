'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
};

// Map display source to API source
const sourceApiMap: Record<LeadSource, string> = {
  'Website': 'WEBSITE',
  'Referral': 'REFERRAL',
  'Cold Call': 'COLD_CALL',
  'LinkedIn': 'LINKEDIN',
  'Trade Show': 'TRADE_SHOW',
  'Email Campaign': 'EMAIL_CAMPAIGN',
};

const statusColors: Record<LeadStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  New: 'info',
  Contacted: 'warning',
  Qualified: 'success',
  Unqualified: 'danger',
};

export default function LeadsPage() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);

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
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data);
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

      return matchesSearch && matchesStatus && matchesSource && matchesRegion;
    });
  }, [leads, searchTerm, statusFilter, sourceFilter, regionFilter]);

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
        <Button onClick={() => setIsModalOpen(true)}>+ New Lead</Button>
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
                  Owner
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 md:table-cell">
                  Created
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
                  <td className="hidden px-4 py-3 text-sm text-white/50 md:table-cell">
                    {formatDate(new Date(lead.createdAt))}
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
    </div>
  );
}
