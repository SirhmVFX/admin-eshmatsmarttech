'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi, Product } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { SEED_PRODUCTS } from '@/lib/seedProducts';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [seeding, setSeeding] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await productsApi.getAll();
    data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await productsApi.delete(deleteTarget.id);
    showToast('Product deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const handleToggleVisible = async (p: Product) => {
    if (!p.id) return;
    await productsApi.update(p.id, { isVisible: !p.isVisible });
    showToast(`Product ${p.isVisible ? 'hidden' : 'shown'}`, 'success');
    load();
  };

  const handleSeed = async () => {
    if (products.length > 0) { showToast('Products already exist. Delete them first.', 'error'); return; }
    setSeeding(true);
    await productsApi.bulkSeed(SEED_PRODUCTS);
    showToast('7 products seeded!', 'success');
    setSeeding(false);
    load();
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Products</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {products.length === 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleSeed} disabled={seeding}>
              {seeding ? 'Seeding...' : '⬇ Seed Products'}
            </button>
          )}
          <Link href="/dashboard/products/new">
            <button className="btn btn-primary btn-sm">+ Add Product</button>
          </Link>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <input className="adm-input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
            {products.length === 0 ? 'No products yet. Click "Seed Products" to import defaults.' : 'No products match your search.'}
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Visible</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.image && <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', background: 'var(--bg3)', flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-gray">{p.category}</span></td>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>{p.price}</td>
                  <td><span className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`}>{p.inStock ? 'In Stock' : 'Out of Stock'}</span></td>
                  <td>
                    <button onClick={() => handleToggleVisible(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: p.isVisible ? 'var(--green)' : 'var(--subtle)' }}>
                      {p.isVisible ? '●' : '○'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/dashboard/products/${p.id}`}>
                        <button className="btn btn-ghost btn-sm">Edit</button>
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
