'use client';

import { useState, useMemo, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, ConfirmModal, Button, TextInput, SelectInput, TextareaInput, Badge, EmptyState, Checkbox } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/mock-data';

// API Product type (matches Prisma schema)
interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sku: string;
  unitPrice: number;
  type: 'ONE_TIME' | 'RECURRING';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = ['IT Services', 'SaaS Products', 'Staffing', 'Consulting'] as const;

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'IT Services',
    sku: '',
    unitPrice: '',
    type: 'ONE_TIME' as 'ONE_TIME' | 'RECURRING',
  });

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'IT Services',
      sku: '',
      unitPrice: '',
      type: 'ONE_TIME',
    });
    setEditingProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: ApiProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      sku: product.sku,
      unitPrice: String(product.unitPrice),
      type: product.type,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        sku: formData.sku,
        unitPrice: Number(formData.unitPrice) || 0,
        type: formData.type,
      };

      if (editingProduct) {
        // Update existing product
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to update product');
        }

        const updatedProduct = await res.json();
        setProducts(products.map((p) => p.id === editingProduct.id ? updatedProduct : p));
        showToast('Product updated successfully', 'success');
      } else {
        // Create new product
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to create product');
        }

        const newProduct = await res.json();
        setProducts([newProduct, ...products]);
        showToast('Product created successfully', 'success');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      showToast(error.message || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProductId) return;

    try {
      const res = await fetch(`/api/products/${deletingProductId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      setProducts(products.filter((p) => p.id !== deletingProductId));
      showToast('Product deleted', 'info');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete product', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingProductId(null);
    }
  };

  const confirmDelete = (productId: string) => {
    setDeletingProductId(productId);
    setIsDeleteModalOpen(true);
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
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Products" subtitle={`${filteredProducts.length} products`} />
        <Button onClick={openCreateModal}>+ New Product</Button>
      </div>

      {/* Filters */}
      <GlassCard className="mb-6 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                categoryFilter === 'all'
                  ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  categoryFilter === cat
                    ? 'border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Products Table */}
      <GlassCard variant="primary" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">
                  Product
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 md:table-cell">
                  SKU
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50 lg:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/50">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-white/50">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-sm text-white/50 line-clamp-1">{product.description}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-white/60 md:table-cell">
                    {product.sku}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-white/60 lg:table-cell">
                    {product.category}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-cyan-400">
                      {formatCurrency(product.unitPrice)}
                      {product.type === 'RECURRING' && <span className="text-white/50">/mo</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={product.type === 'RECURRING' ? 'info' : 'default'} size="sm">
                      {product.type === 'RECURRING' ? 'Recurring' : 'One-time'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(product.id)}
                        className="rounded-lg p-1.5 text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <EmptyState
              icon="📦"
              title="No products found"
              description="Try adjusting your filters or create a new product"
              action={<Button onClick={openCreateModal}>+ New Product</Button>}
            />
          )}
        </div>
      </GlassCard>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingProduct ? 'Edit Product' : 'New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Cloud Infrastructure Setup"
          />
          <TextareaInput
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the product or service..."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
              placeholder="CLOUD-001"
            />
            <SelectInput
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categories.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Price"
              type="number"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              required
              placeholder="5000"
              min="0"
            />
            <SelectInput
              label="Billing Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ONE_TIME' | 'RECURRING' })}
              options={[
                { value: 'ONE_TIME', label: 'One-time' },
                { value: 'RECURRING', label: 'Recurring (monthly)' },
              ]}
            />
          </div>

          {/* Price Preview */}
          <div className="rounded-lg bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50 mb-1">Price Display</p>
            <p className="text-lg font-semibold text-cyan-400">
              {formatCurrency(Number(formData.unitPrice) || 0)}
              {formData.type === 'RECURRING' && <span className="text-base text-white/50">/month</span>}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeletingProductId(null); }}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
