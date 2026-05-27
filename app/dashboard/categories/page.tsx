'use client';

import { useEffect, useState } from 'react';
import { categoriesApi, Category } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

const EMPTY: Omit<Category, 'id'> = { name: '', slug: '', description: '', order: 99, isVisible: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | Category | null>(null);
  const [form, setForm] = useState<Omit<Category, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await categoriesApi.getAll();
    data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (c: Category) => { setForm({ name: c.name, slug: c.slug, description: c.description || '', order: c.order, isVisible: c.isVisible }); setModal(c); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') {
        await categoriesApi.create(form);
        showToast('Category created!', 'success');
      } else if (modal && typeof modal === 'object' && modal.id) {
        await categoriesApi.update(modal.id, form);
        showToast('Category updated!', 'success');
      }
      setModal(null);
      load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await categoriesApi.delete(deleteTarget.id);
    showToast('Category deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const DEFAULT_CATS = ['Access Control', 'CCTV & Surveillance', 'Gate Automation', 'Smart Home', 'Intercom Systems', 'Electric Fencing', 'Solar Power'];

  const seedDefaults = async () => {
    for (let i = 0; i < DEFAULT_CATS.length; i++) {
      await categoriesApi.create({ name: DEFAULT_CATS[i], slug: DEFAULT_CATS[i].toLowerCase().replace(/[^a-z0-9]+/g, '-'), order: i + 1, isVisible: true });
    }
    showToast('Default categories seeded!', 'success');
    load();
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Categories</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {categories.length === 0 && <button className="btn btn-ghost btn-sm" onClick={seedDefaults}>⬇ Seed Defaults</button>}
          <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Category</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No categories yet.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Order</th><th>Visible</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{cat.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>{cat.slug}</td>
                  <td>{cat.order}</td>
                  <td><span className={`badge ${cat.isVisible ? 'badge-green' : 'badge-gray'}`}>{cat.isVisible ? 'Visible' : 'Hidden'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cat)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(cat)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>{modal === 'new' ? 'New Category' : 'Edit Category'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="adm-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug *</label>
                  <input className="adm-input" required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="access-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="adm-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)', marginTop: 20 }}>
                    <input type="checkbox" checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                    Visible on site
                  </label>
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Description</label>
                  <textarea className="adm-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete category "${deleteTarget.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
