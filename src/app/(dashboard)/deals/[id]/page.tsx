'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, ConfirmModal, Button, TextInput, SelectInput, TextareaInput, Badge, EmptyState, Tabs } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  mockDeals,
  mockProducts,
  mockActivities,
  mockTasks,
  mockLineItems,
  dealStages,
  stageLabels,
  stageProbabilities,
  pipelineLabels,
  amountTypes,
  activityTypes,
  formatCurrency,
  formatDate,
  formatDateTime,
  isOverdue,
  isToday,
  type Deal,
  type DealStage,
  type AmountType,
  type Activity,
  type ActivityType,
  type Task,
  type LineItem,
  type Product,
} from '@/lib/mock-data';

const stageColors: Record<DealStage, string> = {
  LEAD: 'bg-white/10 text-white/70',
  QUALIFIED: 'bg-blue-500/20 text-blue-400',
  DISCOVERY: 'bg-purple-500/20 text-purple-400',
  PROPOSAL: 'bg-amber-500/20 text-amber-400',
  NEGOTIATION: 'bg-orange-500/20 text-orange-400',
  CLOSED_WON: 'bg-emerald-500/20 text-emerald-400',
  CLOSED_LOST: 'bg-red-500/20 text-red-400',
};

const activityIcons: Record<ActivityType, string> = {
  NOTE: '📝',
  CALL: '📞',
  MEETING: '🤝',
  EMAIL: '📧',
};

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showToast } = useToast();

  const dealData = mockDeals.find((d) => d.id === id);
  const [deal, setDeal] = useState(dealData);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [lineItems, setLineItems] = useState<LineItem[]>(mockLineItems);

  // Modal states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLineItemModalOpen, setIsLineItemModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);

  // Form states
  const [activityForm, setActivityForm] = useState({ type: 'NOTE' as ActivityType, description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '' });
  const [lineItemForm, setLineItemForm] = useState({
    productId: '',
    quantity: '1',
    discount: '0',
  });

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

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const newActivity: Activity = {
      id: String(Date.now()),
      type: activityForm.type,
      description: activityForm.description,
      user: { name: 'John Doe', email: 'john@forge.com' },
      createdAt: new Date(),
    };
    setActivities([newActivity, ...activities]);
    setActivityForm({ type: 'NOTE', description: '' });
    setIsActivityModalOpen(false);
    showToast('Activity added', 'success');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: String(Date.now()),
      title: taskForm.title,
      description: taskForm.description,
      dueDate: new Date(taskForm.dueDate),
      completed: false,
      user: { name: 'John Doe', email: 'john@forge.com' },
      createdAt: new Date(),
    };
    setTasks([newTask, ...tasks]);
    setTaskForm({ title: '', description: '', dueDate: '' });
    setIsTaskModalOpen(false);
    showToast('Task added', 'success');
  };

  const handleAddLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    const product = mockProducts.find((p) => p.id === lineItemForm.productId);
    if (!product) return;

    const quantity = Number(lineItemForm.quantity) || 1;
    const discount = Number(lineItemForm.discount) || 0;
    const total = product.price * quantity * (1 - discount / 100);

    const newLineItem: LineItem = {
      id: String(Date.now()),
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      discount,
      total,
      isRecurring: product.isRecurring,
    };
    setLineItems([...lineItems, newLineItem]);
    setLineItemForm({ productId: '', quantity: '1', discount: '0' });
    setIsLineItemModalOpen(false);
    showToast('Line item added', 'success');
  };

  const handleRemoveLineItem = (itemId: string) => {
    setLineItems(lineItems.filter((l) => l.id !== itemId));
    showToast('Line item removed', 'info');
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleStageChange = (newStage: DealStage) => {
    if (newStage === 'CLOSED_WON' || newStage === 'CLOSED_LOST') {
      setPendingStage(newStage);
      setIsStageModalOpen(true);
    } else {
      setDeal({ ...deal, stage: newStage, probability: stageProbabilities[newStage] });
      showToast(`Deal moved to ${stageLabels[newStage]}`, 'success');
    }
  };

  const confirmStageChange = () => {
    if (pendingStage) {
      setDeal({ ...deal, stage: pendingStage, probability: stageProbabilities[pendingStage] });
      showToast(`Deal marked as ${stageLabels[pendingStage]}`, 'success');
    }
    setIsStageModalOpen(false);
    setPendingStage(null);
  };

  const getNextStage = (): DealStage | null => {
    const currentIndex = dealStages.indexOf(deal.stage);
    if (currentIndex < dealStages.length - 2) {
      return dealStages[currentIndex + 1];
    }
    return null;
  };

  // Calculate totals
  const lineItemsTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const recurringTotal = lineItems.filter((l) => l.isRecurring).reduce((sum, l) => sum + l.total, 0);
  const oneTimeTotal = lineItems.filter((l) => !l.isRecurring).reduce((sum, l) => sum + l.total, 0);

  const activitiesContent = (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <EmptyState icon="📋" title="No activities yet" description="Add your first activity" />
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 rounded-lg bg-white/5 p-3">
            <span className="text-xl">{activityIcons[activity.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{activity.description}</p>
              <p className="text-xs text-white/50 mt-1">
                {activity.user.name} · {formatDateTime(activity.createdAt)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const tasksContent = (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <EmptyState icon="✓" title="No tasks yet" description="Create tasks to track your to-dos" />
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 rounded-lg bg-white/5 p-3 ${task.completed ? 'opacity-60' : ''}`}
          >
            <button
              onClick={() => handleToggleTask(task.id)}
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
              <span
                className={`text-xs ${
                  task.completed
                    ? 'text-white/40'
                    : isOverdue(task.dueDate)
                    ? 'text-red-400'
                    : isToday(task.dueDate)
                    ? 'text-amber-400'
                    : 'text-white/50'
                }`}
              >
                {isOverdue(task.dueDate) && !task.completed && '⚠️ '}Due {formatDate(task.dueDate)}
              </span>
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
            {deal.stage !== 'CLOSED_WON' && deal.stage !== 'CLOSED_LOST' && (
              <>
                {getNextStage() && (
                  <Button variant="secondary" onClick={() => handleStageChange(getNextStage()!)}>
                    Move to {stageLabels[getNextStage()!]}
                  </Button>
                )}
                <Button variant="primary" onClick={() => handleStageChange('CLOSED_WON')}>
                  Mark Won
                </Button>
                <Button variant="danger" onClick={() => handleStageChange('CLOSED_LOST')}>
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
            <SectionHeader title="Deal Information" className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-white/50 mb-1">Amount Type</p>
                <p className="text-sm text-white">{deal.amountType}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Total Value</p>
                <p className="text-lg font-semibold text-cyan-400">{formatCurrency(deal.amountTotal)}</p>
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
                    <p className="text-sm text-white">{deal.expectedHours}</p>
                  </div>
                </>
              )}
              {deal.amountType === 'RETAINER' && (
                <div>
                  <p className="text-xs text-white/50 mb-1">Monthly Amount</p>
                  <p className="text-sm text-white">{formatCurrency(deal.monthlyAmount || 0)}/month</p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/50 mb-1">Close Date</p>
                <p className="text-sm text-white">{formatDate(deal.closeDate)}</p>
              </div>
            </div>
          </GlassCard>

          {/* Line Items */}
          <GlassCard variant="primary" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Line Items" />
              <Button size="sm" variant="secondary" onClick={() => setIsLineItemModalOpen(true)}>
                + Add Item
              </Button>
            </div>

            {lineItems.length === 0 ? (
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
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-white/5">
                          <td className="py-3 text-sm text-white">{item.productName}</td>
                          <td className="py-3 text-center text-sm text-white/70">{item.quantity}</td>
                          <td className="py-3 text-right text-sm text-white/70">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 text-right text-sm text-white/70">{item.discount}%</td>
                          <td className="py-3 text-right text-sm font-medium text-cyan-400">{formatCurrency(item.total)}</td>
                          <td className="py-3 text-center">
                            <Badge variant={item.isRecurring ? 'info' : 'default'} size="sm">
                              {item.isRecurring ? 'Recurring' : 'One-time'}
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
                    <span className="text-white">Total</span>
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
                { id: 'activities', label: `Activities (${activities.length})`, content: activitiesContent },
                { id: 'tasks', label: `Tasks (${tasks.length})`, content: tasksContent },
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
                  <div key={stage} className="flex items-center gap-3">
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
                  </div>
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
                <span className="text-white">{formatDate(deal.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Expected Close</span>
                <span className="text-white">{formatDate(deal.closeDate)}</span>
              </div>
            </div>
          </GlassCard>
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
          <TextareaInput
            label="Description"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            required
            placeholder="Enter activity details..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsActivityModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Activity</Button>
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
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </Modal>

      {/* Add Line Item Modal */}
      <Modal isOpen={isLineItemModalOpen} onClose={() => setIsLineItemModalOpen(false)} title="Add Line Item" size="md">
        <form onSubmit={handleAddLineItem} className="space-y-4">
          <SelectInput
            label="Product/Service"
            value={lineItemForm.productId}
            onChange={(e) => setLineItemForm({ ...lineItemForm, productId: e.target.value })}
            options={[
              { value: '', label: 'Select a product...' },
              ...mockProducts.map((p) => ({
                value: p.id,
                label: `${p.name} - ${formatCurrency(p.price)}${p.isRecurring ? '/mo' : ''}`,
              })),
            ]}
          />
          <div className="grid gap-4 grid-cols-2">
            <TextInput
              label="Quantity"
              type="number"
              value={lineItemForm.quantity}
              onChange={(e) => setLineItemForm({ ...lineItemForm, quantity: e.target.value })}
              min="1"
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
          {lineItemForm.productId && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-white/50 mb-1">Line Item Total</p>
              <p className="text-lg font-semibold text-cyan-400">
                {formatCurrency(
                  (mockProducts.find((p) => p.id === lineItemForm.productId)?.price || 0) *
                    (Number(lineItemForm.quantity) || 1) *
                    (1 - (Number(lineItemForm.discount) || 0) / 100)
                )}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsLineItemModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!lineItemForm.productId}>Add Item</Button>
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
