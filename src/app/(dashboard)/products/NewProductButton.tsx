'use client';

import { useState } from 'react';
import ProductForm from './ProductForm';

export default function NewProductButton() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="rounded-lg bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
      >
        + New Product
      </button>
      {showForm && <ProductForm onClose={() => setShowForm(false)} />}
    </>
  );
}

