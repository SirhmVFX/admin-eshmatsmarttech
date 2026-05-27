'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, Product } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSave = async (data: Omit<Product, 'id'>) => {
    setSaving(true);
    try {
      await productsApi.create(data);
      showToast('Product created!', 'success');
      router.push('/dashboard/products');
    } catch {
      showToast('Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <Link href="/dashboard/products" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>← Products</Link>
          <h1 className="section-title" style={{ marginTop: 4 }}>New Product</h1>
        </div>
      </div>
      <div className="card" style={{ padding: 22 }}>
        <ProductForm onSave={handleSave} saving={saving} />
      </div>
    </div>
  );
}
