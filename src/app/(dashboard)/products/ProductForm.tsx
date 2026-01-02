'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  isRecurring: boolean;
}

export default function ProductForm({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    price: product?.price.toString() || '',
    isRecurring: product?.isRecurring || false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        price: product.price.toString(),
        isRecurring: product.isRecurring,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        alert(`Failed to ${product ? 'update' : 'create'} product`);
      }
    } catch (error) {
      alert(`Error ${product ? 'updating' : 'creating'} product`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4">
        <GlassCard variant="primary" className="p-6">
          <SectionHeader title={product ? 'Edit Product' : 'New Product'} className="mb-6" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-white/70">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 backdrop-blur-sm focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
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
              <label className="text-sm text-white/70">Recurring</label>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-6 py-2.5 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {loading ? (product ? 'Updating...' : 'Creating...') : product ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

