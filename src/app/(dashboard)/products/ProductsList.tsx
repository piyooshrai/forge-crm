'use client';

import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import ProductForm from './ProductForm';

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProductsList({ products }: { products: Product[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  return (
    <>
      {showForm && (
        <ProductForm
          product={editingId ? products.find((p) => p.id === editingId) || null : null}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      <GlassCard variant="primary" className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-white/50 mt-1">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">{product.sku || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    ${product.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {product.isRecurring && (
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400">
                        Recurring
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product.id)}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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
          {products.length === 0 && (
            <div className="py-12 text-center text-sm text-white/50">
              No products yet. Create your first product to get started.
            </div>
          )}
        </div>
      </GlassCard>
    </>
  );
}

