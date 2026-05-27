'use client';

import { useEffect, useState } from 'react';
import { promoCodesApi, PromoCode } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

const EMPTY: Omit<PromoCode, 'id'> = { code: '', discount: 10, type: 'percentage', isActive: true, usageCount: 0, maxUsage: 0, expiresAt: '' };

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | PromoCode | null>(null);
  const [form, setForm] = useState<Omit<PromoCode, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const { showToast } = useToast();

  const load = async () => { setLoading(true); setCodes(await promoCodesApi.getAll()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (c: PromoCode) => {
    setForm({ code: c.code, discount: c.discount, type: c.type, isActive: c.isActive, usageCount: c.usageCount, maxUsage: c.maxUsage ?? 0, expiresAt: c.expiresAt ?? '' });
    setModal(c);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') { await promoCodesApi.create(form); showToast('Code created!', 'success'); }
      else if (modal && typeof modal === 'object' && modal.id) { await promoCodesApi.update(modal.id, form); showToast('Code updated!', 'success'); }
      setModal(null); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await promoCodesApi.delete(deleteTarget.id);
    showToast('Code deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const handleToggle = async (c: PromoCode) => {
    if (!c.id) return;
    await promoCodesApi.update(c.id, { isActive: !c.isActive });
    showToast(`Code ${c.isActive ? 'deactivated' : 'activated'}`, 'success');
    load();
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Promo Codes</h1>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Code</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : codes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No promo codes yet.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Type</th><th>Used</th><th>Max</th><th>Expires</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--gold)' }}>{c.code}</td>
                  <td style={{ fontWeight: 600 }}>{c.discount}{c.type === 'percentage' ? '%' : ' ₦'}</td>
                  <td><span className="badge badge-gray">{c.type}</span></td>
                  <td>{c.usageCount}</td>
                  <td>{c.maxUsage || '∞'}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{c.expiresAt || '—'}</td>
                  <td>
                    <button onClick={() => handleToggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: c.isActive ? 'var(--green)' : 'var(--subtle)' }}>
                      {c.isActive ? '●' : '○'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>Del</button>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>{modal === 'new' ? 'New Promo Code' : 'Edit Code'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Code *</label>
                  <input className="adm-input" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" />
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Amount</label>
                  <input className="adm-input" type="number" min={0} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="adm-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Usage (0 = unlimited)</label>
                  <input className="adm-input" type="number" min={0} value={form.maxUsage} onChange={e => setForm(f => ({ ...f, maxUsage: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expires At (optional)</label>
                  <input className="adm-input" type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)', marginTop: 20 }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                    Active
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
        <ConfirmModal message={`Delete code "${deleteTarget.code}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
