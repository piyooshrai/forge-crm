'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, ConfirmModal, Button, TextInput, SelectInput, TextareaInput, Badge, EmptyState, Tabs } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  isOverdue,
  isToday,
  pipelineLabels,
  pipelines,
} from '@/lib/mock-data';
import { DealStage, Pipeline, AmountType, ActivityType, ProductType, LeadSource } from '@prisma/client';

const stageColors: Record<DealStage, string> = {
  LEAD: 'bg-white/10 text-white/70',
  QUALIFIED: 'bg-blue-500/20 text-blue-400',
  DISCOVERY: 'bg-purple-500/20 text-purple-400',
  PROPOSAL: 'bg-amber-500/20 text-amber-400',
  NEGOTIATION: 'bg-orange-500/20 text-orange-400',
  CLOSED_WON: 'bg-emerald-500/20 text-emerald-400',
  CLOSED_LOST: 'bg-red-500/20 text-red-400',
};

const stageLabels: Record<DealStage, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualified',
  DISCOVERY: 'Discovery',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

const stageProbabilities: Record<DealStage, number> = {
  LEAD: 10,
  QUALIFIED: 25,
  DISCOVERY: 40,
  PROPOSAL: 60,
  NEGOTIATION: 80,
  CLOSED_WON: 100,
  CLOSED_LOST: 0,
};

const dealStages: DealStage[] = ['LEAD', 'QUALIFIED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

const sourceLabels: Record<LeadSource, string> = {
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

const activityIcons: Record<ActivityType, string> = {
  NOTE: '📝',
  CALL: '📞',
  MEETING: '🤝',
  EMAIL: '📧',
};

const activityTypes: ActivityType[] = ['NOTE', 'CALL', 'MEETING', 'EMAIL'];
const amountTypes: AmountType[] = ['FIXED', 'HOURLY', 'RETAINER'];
const productTypes: ProductType[] = ['ONE_TIME', 'RECURRING'];
const regions = ['US', 'UK', 'EU', 'ME', 'APAC', 'LATAM'];
const leadSources: LeadSource[] = ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'LINKEDIN', 'TRADE_SHOW', 'EMAIL_CAMPAIGN', 'UPWORK', 'GURU', 'FREELANCER', 'OTHER'];

interface User {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
  type: ProductType;
  category: string;
}

interface LineItem {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  type: ProductType;
  total: number;
  product: Product | null;
  createdBy: User;
}

interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  user: User;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  user: User;
  createdAt: string;
}

interface Deal {
  id: string;
  name: string;
  pipeline: Pipeline;
  stage: DealStage;
  amountType: AmountType;
  amountTotal: number | null;
  hourlyRate: number | null;
  expectedHours: number | null;
  probability: number;
  closeDate: string | null;
  source: LeadSource | null;
  regionTags: string[];
  company: string | null;
  contactEmail: string | null;
  ownerId: string;
  owner: User;
  lineItems: LineItem[];
  activities: Activity[];
  tasks: Task[];
  convertedFromLead: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Modal states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLineItemModalOpen, setIsLineItemModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);
  const [editingLineItem, setEditingLineItem] = useState<LineItem | null>(null);

  // Form states
  const [activityForm, setActivityForm] = useState({ type: 'NOTE' as ActivityType, subject: '', description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' });
  const [lineItemForm, setLineItemForm] = useState({
    productId: '',
    customName: '',
    quantity: '1',
    unitPrice: '',
    discount: '0',
    type: 'ONE_TIME' as ProductType,
  });
  const [editForm, setEditForm] = useState({
    name: '',
    pipeline: 'IT_SERVICES' as Pipeline,
    amountType: 'FIXED' as AmountType,
    amountTotal: '',
    hourlyRate: '',
    expectedHours: '',
    probability: '',
    closeDate: '',
    source: '' as LeadSource | '',
    company: '',
    contactEmail: '',
    regionTags: [] as string[],
  });

  const userRole = session?.user?.role;
  const canSetClosedStages = userRole === 'SUPER_ADMIN' || userRole === 'SALES_REP';

  // Fetch deal data
  useEffect(() => {
    async function fetchDeal() {
      try {
        const res = await fetch(`/api/deals/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setDeal(null);
          }
          throw new Error('Failed to fetch deal');
        }
        const data = await res.json();
        setDeal(data);
        setEditForm({
          name: data.name || '',
          pipeline: data.pipeline,
          amountType: data.amountType,
          amountTotal: data.amountTotal?.toString() || '',
          hourlyRate: data.hourlyRate?.toString() || '',
          expectedHours: data.expectedHours?.toString() || '',
          probability: data.probability?.toString() || '',
          closeDate: data.closeDate ? data.closeDate.split('T')[0] : '',
          source: data.source || '',
          company: data.company || '',
          contactEmail: data.contactEmail || '',
          regionTags: data.regionTags || [],
        });
      } catch (error) {
        console.error('Error fetching deal:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeal();
  }, [id]);

  // Fetch products for line items
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }
    fetchProducts();
  }, []);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityForm.type,
          subject: activityForm.subject,
          description: activityForm.description,
          dealId: id,
        }),
      });

      if (!res.ok) throw new Error('Failed to add activity');

      const newActivity = await res.json();
      setDeal((prev) => prev ? { ...prev, activities: [newActivity, ...prev.activities] } : null);
      setActivityForm({ type: 'NOTE', subject: '', description: '' });
      setIsActivityModalOpen(false);
      showToast('Activity added', 'success');
    } catch (error) {
      showToast('Failed to add activity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          dueDate: taskForm.dueDate || null,
          dealId: id,
        }),
      });

      if (!res.ok) throw new Error('Failed to add task');

      const newTask = await res.json();
      setDeal((prev) => prev ? {
        ...prev,
        tasks: [...prev.tasks, newTask].sort((a, b) =>
          new Date(a.dueDate || '9999').getTime() - new Date(b.dueDate || '9999').getTime()
        )
      } : null);
      setTaskForm({ title: '', description: '', dueDate: '' });
      setIsTaskModalOpen(false);
      showToast('Task added', 'success');
    } catch (error) {
      showToast('Failed to add task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      setDeal((prev) =>
        prev ? {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, completed: !completed } : t)),
        } : null
      );
    } catch (error) {
      showToast('Failed to update task', 'error');
    }
  };

  const handleAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedProduct = lineItemForm.productId ? products.find(p => p.id === lineItemForm.productId) : null;
      const productName = selectedProduct ? selectedProduct.name : lineItemForm.customName;
      const unitPrice = selectedProduct ? selectedProduct.unitPrice : parseFloat(lineItemForm.unitPrice);
      const productType = selectedProduct ? selectedProduct.type : lineItemForm.type;

      const res = await fetch('/api/deals/line-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: id,
          productId: lineItemForm.productId || null,
          productName,
          quantity: parseFloat(lineItemForm.quantity) || 1,
          unitPrice,
          discount: parseFloat(lineItemForm.discount) / 100 || 0,
          type: productType,
        }),
      });

      if (!res.ok) throw new Error('Failed to add line item');

      const newLineItem = await res.json();
      setDeal((prev) => prev ? {
        ...prev,
        lineItems: [...prev.lineItems, newLineItem],
        amountTotal: prev.lineItems.reduce((sum, li) => sum + li.total, 0) + newLineItem.total,
      } : null);
      resetLineItemForm();
      setIsLineItemModalOpen(false);
      showToast('Line item added', 'success');
    } catch (error) {
      showToast('Failed to add line item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLineItem = async (lineItemId: string) => {
    try {
      const res = await fetch(`/api/deals/line-items?id=${lineItemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove line item');

      setDeal((prev) => {
        if (!prev) return null;
        const updatedItems = prev.lineItems.filter(li => li.id !== lineItemId);
        return {
          ...prev,
          lineItems: updatedItems,
          amountTotal: updatedItems.reduce((sum, li) => sum + li.total, 0),
        };
      });
      showToast('Line item removed', 'info');
    } catch (error) {
      showToast('Failed to remove line item', 'error');
    }
  };

  const resetLineItemForm = () => {
    setLineItemForm({
      productId: '',
      customName: '',
      quantity: '1',
      unitPrice: '',
      discount: '0',
      type: 'ONE_TIME',
    });
    setEditingLineItem(null);
  };

  const handleStageChange = async (newStage: DealStage) => {
    // Check permissions for closed stages
    if ((newStage === 'CLOSED_WON' || newStage === 'CLOSED_LOST') && !canSetClosedStages) {
      showToast('You do not have permission to close deals', 'error');
      return;
    }

    if (newStage === 'CLOSED_WON' || newStage === 'CLOSED_LOST') {
      setPendingStage(newStage);
      setIsStageModalOpen(true);
    } else {
      await updateStage(newStage);
    }
  };

  const updateStage = async (newStage: DealStage) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          probability: stageProbabilities[newStage],
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update stage');
      }

      const updatedDeal = await res.json();
      setDeal(updatedDeal);
      showToast(`Deal moved to ${stageLabels[newStage]}`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update stage', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmStageChange = async () => {
    if (pendingStage) {
      await updateStage(pendingStage);
    }
    setIsStageModalOpen(false);
    setPendingStage(null);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const payload: any = {
        name: editForm.name,
        pipeline: editForm.pipeline,
        amountType: editForm.amountType,
        probability: parseInt(editForm.probability) || 0,
        closeDate: editForm.closeDate || null,
        source: editForm.source || null,
        company: editForm.company || null,
        contactEmail: editForm.contactEmail || null,
        regionTags: editForm.regionTags,
      };

      // Add amount fields based on type
      if (editForm.amountType === 'FIXED') {
        payload.amountTotal = parseFloat(editForm.amountTotal) || 0;
      } else if (editForm.amountType === 'HOURLY') {
        payload.hourlyRate = parseFloat(editForm.hourlyRate) || 0;
        payload.expectedHours = parseFloat(editForm.expectedHours) || 0;
        payload.amountTotal = (parseFloat(editForm.hourlyRate) || 0) * (parseFloat(editForm.expectedHours) || 0);
      } else if (editForm.amountType === 'RETAINER') {
        payload.amountTotal = parseFloat(editForm.amountTotal) || 0;
      }

      const res = await fetch(`/api/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update deal');
      }

      const updatedDeal = await res.json();
      setDeal(updatedDeal);
      setIsEditMode(false);
      showToast('Deal updated', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update deal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegionToggle = (region: string) => {
    setEditForm((prev) => ({
      ...prev,
      regionTags: prev.regionTags.includes(region)
        ? prev.regionTags.filter((r) => r !== region)
        : [...prev.regionTags, region],
    }));
  };

  const getNextStage = (): DealStage | null => {
    if (!deal) return null;
    const currentIndex = dealStages.indexOf(deal.stage);
    // Skip closed stages as "next"
    if (currentIndex < dealStages.length - 2) {
      return dealStages[currentIndex + 1];
    }
    return null;
  };

  // Calculate totals
  const lineItemsTotal = deal?.lineItems.reduce((sum, item) => sum + item.total, 0) || 0;
  const recurringTotal = deal?.lineItems.filter(l => l.type === 'RECURRING').reduce((sum, l) => sum + l.total, 0) || 0;
  const oneTimeTotal = deal?.lineItems.filter(l => l.type === 'ONE_TIME').reduce((sum, l) => sum + l.total, 0) || 0;

  // Calculate line item preview
  const getLineItemPreview = () => {
    const selectedProduct = lineItemForm.productId ? products.find(p => p.id === lineItemForm.productId) : null;
    const unitPrice = selectedProduct ? selectedProduct.unitPrice : parseFloat(lineItemForm.unitPrice) || 0;
    const quantity = parseFloat(lineItemForm.quantity) || 1;
    const discount = parseFloat(lineItemForm.discount) / 100 || 0;
    return unitPrice * quantity * (1 - discount);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/10 rounded" />
          <div className="h-64 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <EmptyState
          icon="❌"
          title="Deal not found"
          description="The deal you're looking for doesn't exist"
          action={<Link href="/deals"><Button>Back to Deals</Button></Link>}
        />
      </div>
    );
  }

  const activitiesContent = (
    <div className="space-y-3">
      {deal.activities.length === 0 ? (
        <EmptyState icon="📋" title="No activities yet" description="Add your first activity" />
      ) : (
        deal.activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 rounded-lg bg-white/5 p-3">
            <span className="text-xl">{activityIcons[activity.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.subject}</p>
              {activity.description && (
                <p className="text-sm text-white/70 mt-1">{activity.description}</p>
              )}
              <p className="text-xs text-white/50 mt-1">
                {activity.user.name} · {formatDateTime(new Date(activity.createdAt))}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const tasksContent = (
    <div className="space-y-3">
      {deal.tasks.length === 0 ? (
        <EmptyState icon="✓" title="No tasks yet" description="Create tasks to track your to-dos" />
      ) : (
        deal.tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 rounded-lg bg-white/5 p-3 ${task.completed ? 'opacity-60' : ''}`}
          >
            <button
              onClick={() => handleToggleTask(task.id, task.completed)}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                task.completed
                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {task.completed && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${task.completed ? 'text-white/60 line-through' : 'text-white'}`}>
                {task.title}
              </p>
              {task.dueDate && (
                <span
                  className={`text-xs ${
                    task.completed
                      ? 'text-white/40'
                      : isOverdue(new Date(task.dueDate))
                      ? 'text-red-400'
                      : isToday(new Date(task.dueDate))
                      ? 'text-amber-400'
                      : 'text-white/50'
                  }`}
                >
                  {isOverdue(new Date(task.dueDate)) && !task.completed && '⚠️ '}Due {formatDate(new Date(task.dueDate))}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/deals" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/70 mb-2">
          ← Back to Deals
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <SectionHeader title={deal.name} />
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stageColors[deal.stage]}`}>
                {stageLabels[deal.stage]}
              </span>
            </div>
            <p className="text-sm text-white/60 mt-1">{pipelineLabels[deal.pipeline]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setIsEditMode(true)}>
              Edit
            </Button>
            {deal.stage !== 'CLOSED_WON' && deal.stage !== 'CLOSED_LOST' && (
              <>
                {getNextStage() && (
                  <Button variant="secondary" onClick={() => handleStageChange(getNextStage()!)} disabled={saving}>
                    Move to {stageLabels[getNextStage()!]}
                  </Button>
                )}
                <Button variant="primary" onClick={() => handleStageChange('CLOSED_WON')} disabled={saving || !canSetClosedStages}>
                  Mark Won
                </Button>
                <Button variant="danger" onClick={() => handleStageChange('CLOSED_LOST')} disabled={saving || !canSetClosedStages}>
                  Mark Lost
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Deal Details */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Deal Information" />
              {isEditMode && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setIsEditMode(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            {isEditMode ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <TextInput
                  label="Deal Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <SelectInput
                  label="Pipeline"
                  value={editForm.pipeline}
                  onChange={(e) => setEditForm({ ...editForm, pipeline: e.target.value as Pipeline })}
                  options={pipelines.map((p) => ({ value: p, label: pipelineLabels[p] }))}
                />
                <SelectInput
                  label="Amount Type"
                  value={editForm.amountType}
                  onChange={(e) => setEditForm({ ...editForm, amountType: e.target.value as AmountType })}
                  options={amountTypes.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))}
                />
                {editForm.amountType === 'FIXED' && (
                  <TextInput
                    label="Total Amount"
                    type="number"
                    value={editForm.amountTotal}
                    onChange={(e) => setEditForm({ ...editForm, amountTotal: e.target.value })}
                    placeholder="0"
                  />
                )}
                {editForm.amountType === 'HOURLY' && (
                  <>
                    <TextInput
                      label="Hourly Rate"
                      type="number"
                      value={editForm.hourlyRate}
                      onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                      placeholder="0"
                    />
                    <TextInput
                      label="Expected Hours"
                      type="number"
                      value={editForm.expectedHours}
                      onChange={(e) => setEditForm({ ...editForm, expectedHours: e.target.value })}
                      placeholder="0"
                    />
                  </>
                )}
                {editForm.amountType === 'RETAINER' && (
                  <TextInput
                    label="Monthly Amount"
                    type="number"
                    value={editForm.amountTotal}
                    onChange={(e) => setEditForm({ ...editForm, amountTotal: e.target.value })}
                    placeholder="0"
                  />
                )}
                <TextInput
                  label="Probability %"
                  type="number"
                  value={editForm.probability}
                  onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })}
                  min="0"
                  max="100"
                />
                <TextInput
                  label="Close Date"
                  type="date"
                  value={editForm.closeDate}
                  onChange={(e) => setEditForm({ ...editForm, closeDate: e.target.value })}
                />
                <SelectInput
                  label="Source"
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value as LeadSource })}
                  options={[
                    { value: '', label: 'Select source...' },
                    ...leadSources.map((s) => ({ value: s, label: sourceLabels[s] }))
                  ]}
                />
                <TextInput
                  label="Company"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                />
                <TextInput
                  label="Contact Email"
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                />
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-xs text-white/50 mb-2">Regions</p>
                  <div className="flex gap-2 flex-wrap">
                    {regions.map((region) => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => handleRegionToggle(region)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          editForm.regionTags.includes(region)
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-white/50 mb-1">Amount Type</p>
                  <p className="text-sm text-white">{deal.amountType}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Total Value</p>
                  <p className="text-lg font-semibold text-cyan-400">{formatCurrency(deal.amountTotal || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Probability</p>
                  <p className="text-sm text-white">{deal.probability}%</p>
                </div>
                {deal.amountType === 'HOURLY' && (
                  <>
                    <div>
                      <p className="text-xs text-white/50 mb-1">Hourly Rate</p>
                      <p className="text-sm text-white">{formatCurrency(deal.hourlyRate || 0)}/hr</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1">Expected Hours</p>
                      <p className="text-sm text-white">{deal.expectedHours || 0}</p>
                    </div>
                  </>
                )}
                {deal.amountType === 'RETAINER' && (
                  <div>
                    <p className="text-xs text-white/50 mb-1">Monthly Amount</p>
                    <p className="text-sm text-white">{formatCurrency(deal.amountTotal || 0)}/month</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/50 mb-1">Close Date</p>
                  <p className="text-sm text-white">{deal.closeDate ? formatDate(new Date(deal.closeDate)) : '-'}</p>
                </div>
                {deal.source && (
                  <div>
                    <p className="text-xs text-white/50 mb-1">Source</p>
                    <p className="text-sm text-white">{sourceLabels[deal.source]}</p>
                  </div>
                )}
                {deal.company && (
                  <div>
                    <p className="text-xs text-white/50 mb-1">Company</p>
                    <p className="text-sm text-white">{deal.company}</p>
                  </div>
                )}
                {deal.contactEmail && (
                  <div>
                    <p className="text-xs text-white/50 mb-1">Contact</p>
                    <p className="text-sm text-white">{deal.contactEmail}</p>
                  </div>
                )}
                {deal.regionTags.length > 0 && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-white/50 mb-1">Regions</p>
                    <div className="flex gap-1 flex-wrap">
                      {deal.regionTags.map((tag) => (
                        <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          {/* Line Items */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Line Items" />
              <Button size="sm" variant="secondary" onClick={() => setIsLineItemModalOpen(true)}>
                + Add Item
              </Button>
            </div>

            {deal.lineItems.length === 0 ? (
              <EmptyState
                icon="📦"
                title="No line items"
                description="Add products or services to this deal"
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="pb-2 text-left text-xs font-medium text-white/50">Product/Service</th>
                        <th className="pb-2 text-center text-xs font-medium text-white/50">Qty</th>
                        <th className="pb-2 text-right text-xs font-medium text-white/50">Unit Price</th>
                        <th className="pb-2 text-right text-xs font-medium text-white/50">Discount</th>
                        <th className="pb-2 text-right text-xs font-medium text-white/50">Total</th>
                        <th className="pb-2 text-center text-xs font-medium text-white/50">Type</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {deal.lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-white/5">
                          <td className="py-3 text-sm text-white">{item.productName}</td>
                          <td className="py-3 text-center text-sm text-white/70">{item.quantity}</td>
                          <td className="py-3 text-right text-sm text-white/70">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 text-right text-sm text-white/70">{Math.round(item.discount * 100)}%</td>
                          <td className="py-3 text-right text-sm font-medium text-cyan-400">{formatCurrency(item.total)}</td>
                          <td className="py-3 text-center">
                            <Badge variant={item.type === 'RECURRING' ? 'info' : 'default'} size="sm">
                              {item.type === 'RECURRING' ? 'Recurring' : 'One-time'}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="text-white/40 hover:text-red-400 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">One-time Total</span>
                    <span className="text-white">{formatCurrency(oneTimeTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Recurring Total</span>
                    <span className="text-white">{formatCurrency(recurringTotal)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-white/10">
                    <span className="text-white">Grand Total</span>
                    <span className="text-cyan-400">{formatCurrency(lineItemsTotal)}</span>
                  </div>
                </div>
              </>
            )}
          </GlassCard>

          {/* Activities & Tasks */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsActivityModalOpen(true)}>
                  + Activity
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setIsTaskModalOpen(true)}>
                  + Task
                </Button>
              </div>
            </div>
            <Tabs
              tabs={[
                { id: 'activities', label: `Activities (${deal.activities.length})`, content: activitiesContent },
                { id: 'tasks', label: `Tasks (${deal.tasks.length})`, content: tasksContent },
              ]}
            />
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stage Progress */}
          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Stage Progress" className="mb-4" />
            <div className="space-y-2">
              {dealStages.slice(0, -1).map((stage, index) => {
                const currentIndex = dealStages.indexOf(deal.stage);
                const isComplete = index < currentIndex;
                const isCurrent = stage === deal.stage;
                const isLost = deal.stage === 'CLOSED_LOST';

                return (
                  <button
                    key={stage}
                    onClick={() => {
                      if (stage !== deal.stage && deal.stage !== 'CLOSED_WON' && deal.stage !== 'CLOSED_LOST') {
                        handleStageChange(stage);
                      }
                    }}
                    disabled={deal.stage === 'CLOSED_WON' || deal.stage === 'CLOSED_LOST' || saving}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      deal.stage === 'CLOSED_WON' || deal.stage === 'CLOSED_LOST'
                        ? 'cursor-default'
                        : 'hover:bg-white/5 cursor-pointer'
                    }`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isLost
                          ? 'bg-red-500/50'
                          : isComplete
                          ? 'bg-cyan-400'
                          : isCurrent
                          ? 'bg-cyan-400 ring-2 ring-cyan-400/30'
                          : 'bg-white/10'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isCurrent ? 'text-white font-medium' : isComplete ? 'text-white/70' : 'text-white/40'
                      }`}
                    >
                      {stageLabels[stage]}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-cyan-400 ml-auto">{stageProbabilities[stage]}%</span>
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Owner */}
          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Owner" className="mb-4" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30">
                <span className="text-sm font-medium text-cyan-400">
                  {deal.owner.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{deal.owner.name}</p>
                <p className="text-xs text-white/50">{deal.owner.email}</p>
              </div>
            </div>
          </GlassCard>

          {/* Timeline */}
          <GlassCard variant="secondary" className="p-6">
            <SectionHeader title="Timeline" className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Created</span>
                <span className="text-white">{formatDate(new Date(deal.createdAt))}</span>
              </div>
              {deal.closeDate && (
                <div className="flex justify-between">
                  <span className="text-white/50">Expected Close</span>
                  <span className="text-white">{formatDate(new Date(deal.closeDate))}</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Converted From Lead */}
          {deal.convertedFromLead && (
            <GlassCard variant="secondary" className="p-6">
              <SectionHeader title="Converted From" className="mb-4" />
              <Link href={`/leads/${deal.convertedFromLead.id}`} className="block">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-colors">
                  <p className="text-sm font-medium text-white">{deal.convertedFromLead.name}</p>
                  <p className="text-xs text-white/50 mt-1">Lead</p>
                </div>
              </Link>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      <Modal isOpen={isActivityModalOpen} onClose={() => setIsActivityModalOpen(false)} title="Add Activity">
        <form onSubmit={handleAddActivity} className="space-y-4">
          <SelectInput
            label="Type"
            value={activityForm.type}
            onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as ActivityType })}
            options={activityTypes.map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))}
          />
          <TextInput
            label="Subject"
            value={activityForm.subject}
            onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
            required
            placeholder="Brief summary..."
          />
          <TextareaInput
            label="Description (optional)"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            placeholder="Enter activity details..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsActivityModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Add Task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <TextInput
            label="Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
            placeholder="Follow up with client"
          />
          <TextareaInput
            label="Description (optional)"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            placeholder="Add more details..."
          />
          <TextInput
            label="Due Date"
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsTaskModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Line Item Modal */}
      <Modal isOpen={isLineItemModalOpen} onClose={() => { setIsLineItemModalOpen(false); resetLineItemForm(); }} title="Add Line Item" size="md">
        <form onSubmit={handleAddLineItem} className="space-y-4">
          <SelectInput
            label="Product/Service (or leave empty for custom)"
            value={lineItemForm.productId}
            onChange={(e) => {
              const product = products.find(p => p.id === e.target.value);
              setLineItemForm({
                ...lineItemForm,
                productId: e.target.value,
                customName: '',
                unitPrice: product ? product.unitPrice.toString() : lineItemForm.unitPrice,
                type: product ? product.type : lineItemForm.type,
              });
            }}
            options={[
              { value: '', label: 'Custom item...' },
              ...products.map((p) => ({
                value: p.id,
                label: `${p.name} - ${formatCurrency(p.unitPrice)}${p.type === 'RECURRING' ? '/mo' : ''}`,
              })),
            ]}
          />
          {!lineItemForm.productId && (
            <>
              <TextInput
                label="Custom Item Name"
                value={lineItemForm.customName}
                onChange={(e) => setLineItemForm({ ...lineItemForm, customName: e.target.value })}
                required={!lineItemForm.productId}
                placeholder="Enter item name"
              />
              <TextInput
                label="Unit Price"
                type="number"
                value={lineItemForm.unitPrice}
                onChange={(e) => setLineItemForm({ ...lineItemForm, unitPrice: e.target.value })}
                required={!lineItemForm.productId}
                placeholder="0"
              />
              <SelectInput
                label="Type"
                value={lineItemForm.type}
                onChange={(e) => setLineItemForm({ ...lineItemForm, type: e.target.value as ProductType })}
                options={productTypes.map((t) => ({ value: t, label: t === 'ONE_TIME' ? 'One-time' : 'Recurring' }))}
              />
            </>
          )}
          <div className="grid gap-4 grid-cols-2">
            <TextInput
              label="Quantity"
              type="number"
              value={lineItemForm.quantity}
              onChange={(e) => setLineItemForm({ ...lineItemForm, quantity: e.target.value })}
              min="0.01"
              step="0.01"
            />
            <TextInput
              label="Discount %"
              type="number"
              value={lineItemForm.discount}
              onChange={(e) => setLineItemForm({ ...lineItemForm, discount: e.target.value })}
              min="0"
              max="100"
            />
          </div>
          {(lineItemForm.productId || (lineItemForm.customName && lineItemForm.unitPrice)) && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-white/50 mb-1">Line Item Total</p>
              <p className="text-lg font-semibold text-cyan-400">
                {formatCurrency(getLineItemPreview())}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setIsLineItemModalOpen(false); resetLineItemForm(); }} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || (!lineItemForm.productId && (!lineItemForm.customName || !lineItemForm.unitPrice))}>
              {saving ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stage Change Confirmation */}
      <ConfirmModal
        isOpen={isStageModalOpen}
        onClose={() => { setIsStageModalOpen(false); setPendingStage(null); }}
        onConfirm={confirmStageChange}
        title={pendingStage === 'CLOSED_WON' ? 'Mark as Won' : 'Mark as Lost'}
        message={
          pendingStage === 'CLOSED_WON'
            ? `Are you sure you want to mark "${deal.name}" as won? This will close the deal.`
            : `Are you sure you want to mark "${deal.name}" as lost? This will close the deal.`
        }
        confirmText={pendingStage === 'CLOSED_WON' ? 'Mark Won' : 'Mark Lost'}
        variant={pendingStage === 'CLOSED_LOST' ? 'danger' : 'primary'}
      />
    </div>
  );
}
