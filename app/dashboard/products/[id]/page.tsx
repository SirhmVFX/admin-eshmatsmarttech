'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, Product } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ProductForm from '@/components/ProductForm';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    productsApi.getOne(id).then(setProduct);
  }, [id]);

  const handleSave = async (data: Omit<Product, 'id'>) => {
    setSaving(true);
    try {
      await productsApi.update(id, data);
      showToast('Product updated!', 'success');
      router.push('/dashboard/products');
    } catch {
      showToast('Failed to update product', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!product) return <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>Loading...</div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <Link href="/dashboard/products" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>← Products</Link>
          <h1 className="section-title" style={{ marginTop: 4 }}>Edit: {product.name}</h1>
        </div>
      </div>
      <div className="card" style={{ padding: 22 }}>
        <ProductForm initial={product} onSave={handleSave} saving={saving} />
      </div>
    </div>
  );
}
