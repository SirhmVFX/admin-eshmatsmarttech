'use client';

import { useEffect, useState } from 'react';
import { shippingApi, ShippingZone } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import TagInput from '@/components/TagInput';

const EMPTY: Omit<ShippingZone, 'id'> = { name: '', states: [], cost: 0, freeThreshold: 0, estimatedDays: '3-5 business days', isActive: true };

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | ShippingZone | null>(null);
  const [form, setForm] = useState<Omit<ShippingZone, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShippingZone | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    setZones(await shippingApi.getAll());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (z: ShippingZone) => {
    setForm({ name: z.name, states: z.states, cost: z.cost, freeThreshold: z.freeThreshold ?? 0, estimatedDays: z.estimatedDays, isActive: z.isActive });
    setModal(z);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') { await shippingApi.create(form); showToast('Zone created!', 'success'); }
      else if (modal && typeof modal === 'object' && modal.id) { await shippingApi.update(modal.id, form); showToast('Zone updated!', 'success'); }
      setModal(null); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await shippingApi.delete(deleteTarget.id);
    showToast('Zone deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const seedDefaults = async () => {
    const defaults: Omit<ShippingZone, 'id'>[] = [
      { name: 'Lagos', states: ['Lagos'], cost: 3000, freeThreshold: 500000, estimatedDays: '1-2 business days', isActive: true },
      { name: 'Abuja', states: ['FCT', 'Abuja'], cost: 5000, freeThreshold: 500000, estimatedDays: '2-3 business days', isActive: true },
      { name: 'South West', states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'], cost: 7000, freeThreshold: 0, estimatedDays: '3-5 business days', isActive: true },
      { name: 'Rest of Nigeria', states: ['Other'], cost: 10000, freeThreshold: 0, estimatedDays: '5-7 business days', isActive: true },
    ];
    for (const d of defaults) await shippingApi.create(d);
    showToast('Default zones seeded!', 'success');
    load();
  };

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Shipping Zones</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {zones.length === 0 && <button className="btn btn-ghost btn-sm" onClick={seedDefaults}>⬇ Seed Defaults</button>}
          <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Zone</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : zones.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No shipping zones yet.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Zone</th><th>States</th><th>Cost</th><th>Free Threshold</th><th>Est. Days</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{z.name}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{z.states.join(', ')}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(z.cost)}</td>
                  <td style={{ fontSize: 12 }}>{z.freeThreshold ? fmt(z.freeThreshold) : '—'}</td>
                  <td style={{ fontSize: 12 }}>{z.estimatedDays}</td>
                  <td><span className={`badge ${z.isActive ? 'badge-green' : 'badge-gray'}`}>{z.isActive ? 'Active' : 'Off'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(z)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(z)}>Del</button>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>{modal === 'new' ? 'New Shipping Zone' : 'Edit Zone'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Zone Name *</label>
                  <input className="adm-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lagos" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">States (press Enter to add)</label>
                  <TagInput values={form.states} onChange={v => setForm(f => ({ ...f, states: v }))} placeholder="Add state, press Enter" />
                </div>
                <div className="form-group">
                  <label className="form-label">Shipping Cost (₦)</label>
                  <input className="adm-input" type="number" min={0} value={form.cost} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Free Shipping Threshold (₦, 0 = disabled)</label>
                  <input className="adm-input" type="number" min={0} value={form.freeThreshold} onChange={e => setForm(f => ({ ...f, freeThreshold: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated Delivery</label>
                  <input className="adm-input" value={form.estimatedDays} onChange={e => setForm(f => ({ ...f, estimatedDays: e.target.value }))} placeholder="3-5 business days" />
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
        <ConfirmModal message={`Delete zone "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
