'use client';

import { useEffect, useState } from 'react';
import { testimonialsApi, Testimonial } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import ImageUpload from '@/components/ImageUpload';

const EMPTY: Omit<Testimonial, 'id'> = { name: '', role: '', quote: '', stars: 5, initials: '', color: 'bg-amber-700', isVisible: true, order: 99 };
const COLORS = ['bg-amber-700', 'bg-teal-700', 'bg-indigo-700', 'bg-rose-700', 'bg-purple-700', 'bg-cyan-700', 'bg-green-700', 'bg-orange-700'];

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | Testimonial | null>(null);
  const [form, setForm] = useState<Omit<Testimonial, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await testimonialsApi.getAll();
    data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (t: Testimonial) => {
    setForm({ name: t.name, role: t.role, quote: t.quote, stars: t.stars, initials: t.initials, color: t.color, isVisible: t.isVisible, order: t.order });
    setModal(t);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') { await testimonialsApi.create(form); showToast('Testimonial created!', 'success'); }
      else if (modal && typeof modal === 'object' && modal.id) { await testimonialsApi.update(modal.id, form); showToast('Updated!', 'success'); }
      setModal(null); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await testimonialsApi.delete(deleteTarget.id);
    showToast('Deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const handleToggle = async (t: Testimonial) => {
    if (!t.id) return;
    await testimonialsApi.update(t.id, { isVisible: !t.isVisible });
    showToast(`${t.isVisible ? 'Hidden' : 'Shown'}`, 'success');
    load();
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Testimonials</h1>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Testimonial</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No testimonials yet.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Role</th><th>Stars</th><th>Order</th><th>Visible</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{t.role}</td>
                  <td>{'★'.repeat(t.stars)}</td>
                  <td>{t.order}</td>
                  <td>
                    <button onClick={() => handleToggle(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: t.isVisible ? 'var(--green)' : 'var(--subtle)' }}>
                      {t.isVisible ? '●' : '○'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(t)}>Del</button>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>{modal === 'new' ? 'New Testimonial' : 'Edit Testimonial'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="adm-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Initials</label>
                  <input className="adm-input" value={form.initials} onChange={e => setForm(f => ({ ...f, initials: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="AD" maxLength={2} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Role / Company</label>
                  <input className="adm-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Estate Manager, Lagos" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Quote *</label>
                  <textarea className="adm-input" required rows={3} value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stars (1-5)</label>
                  <input className="adm-input" type="number" min={1} max={5} value={form.stars} onChange={e => setForm(f => ({ ...f, stars: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="adm-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Avatar Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c.replace('bg-', '').includes('amber') ? '#b45309' : c.replace('bg-', '').includes('teal') ? '#0f766e' : c.replace('bg-', '').includes('indigo') ? '#4338ca' : c.replace('bg-', '').includes('rose') ? '#be123c' : c.replace('bg-', '').includes('purple') ? '#7e22ce' : c.replace('bg-', '').includes('cyan') ? '#0e7490' : c.replace('bg-', '').includes('green') ? '#15803d' : '#c2410c', border: form.color === c ? '2px solid var(--gold)' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                <div className="form-group form-full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)' }}>
                    <input type="checkbox" checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                    Visible on site
                  </label>
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
        <ConfirmModal message={`Delete testimonial from "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
