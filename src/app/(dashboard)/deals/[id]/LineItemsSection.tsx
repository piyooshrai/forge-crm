'use client';

import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

// Client-side role check
function canEditDeal(role: UserRole): boolean {
  return role === UserRole.SALES_REP || role === UserRole.SUPER_ADMIN;
}

interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  isRecurring: boolean;
  product: { id: string; name: string; price: number } | null;
  createdBy: { name: string | null; email: string };
}

export default function LineItemsSection({
  dealId,
  lineItems,
}: {
  dealId: string;
  lineItems: LineItem[];
}) {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    unitPrice: '',
    discount: '0',
    isRecurring: false,
  });

  const canEdit = session && canEditDeal(session.user.role as UserRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/deals/line-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dealId,
          quantity: parseFloat(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          discount: parseFloat(formData.discount),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', quantity: '1', unitPrice: '', discount: '0', isRecurring: false });
        window.location.reload();
      }
    } catch (error) {
      alert('Error creating line item');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    return subtotal - discountAmount;
  };

  const total = lineItems.reduce((sum, item) => sum + calculateTotal(item), 0);

  return (
    <GlassCard variant="secondary" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <SectionHeader title="Line Items" />
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            + Add Item
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-lg bg-white/5 p-4">
          <div>
            <label className="mb-1 block text-xs text-white/70">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/70">Quantity</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/70">Unit Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/70">Discount %</label>
              <input
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            <label className="text-xs text-white/70">Recurring</label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-xs text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {lineItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{item.name}</p>
              <p className="text-xs text-white/50 mt-1">
                {item.quantity} × ${item.unitPrice.toLocaleString()}
                {item.discount > 0 && ` (${item.discount}% off)`}
                {item.isRecurring && ' • Recurring'}
              </p>
            </div>
            <p className="text-sm font-semibold text-white">${calculateTotal(item).toLocaleString()}</p>
          </div>
        ))}
        {lineItems.length === 0 && (
          <p className="text-sm text-white/50 py-4 text-center">No line items yet</p>
        )}
        {lineItems.length > 0 && (
          <div className="border-t border-white/10 pt-3 flex items-center justify-between">
            <p className="text-sm font-medium text-white">Total</p>
            <p className="text-lg font-semibold text-cyan-400">${total.toLocaleString()}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

