'use client';

import { useEffect, useState } from 'react';
import { faqsApi, FAQ } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

const EMPTY: Omit<FAQ, 'id'> = { question: '', answer: '', category: '', order: 99, isVisible: true };

export default function FAQsPage() {
  const [items, setItems] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | FAQ | null>(null);
  const [form, setForm] = useState<Omit<FAQ, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await faqsApi.getAll();
    data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (f: FAQ) => {
    setForm({ question: f.question, answer: f.answer, category: f.category || '', order: f.order, isVisible: f.isVisible });
    setModal(f);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') { await faqsApi.create(form); showToast('FAQ created!', 'success'); }
      else if (modal && typeof modal === 'object' && modal.id) { await faqsApi.update(modal.id, form); showToast('Updated!', 'success'); }
      setModal(null); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await faqsApi.delete(deleteTarget.id);
    showToast('Deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">FAQs</h1>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add FAQ</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No FAQs yet.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Question</th><th>Category</th><th>Order</th><th>Visible</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.question}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.answer}</div>
                  </td>
                  <td><span className="badge badge-gray">{item.category || 'General'}</span></td>
                  <td>{item.order}</td>
                  <td><span className={`badge ${item.isVisible ? 'badge-green' : 'badge-gray'}`}>{item.isVisible ? 'Visible' : 'Hidden'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(item)}>Del</button>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>{modal === 'new' ? 'New FAQ' : 'Edit FAQ'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Question *</label>
                  <input className="adm-input" required value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Answer *</label>
                  <textarea className="adm-input" required rows={4} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="adm-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="General, Products, Shipping..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="adm-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
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
        <ConfirmModal message={`Delete this FAQ?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
