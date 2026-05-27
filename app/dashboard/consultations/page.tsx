'use client';

import { useEffect, useState } from 'react';
import { consultationsApi, ConsultationRequest } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

const STATUSES = ['new', 'contacted', 'scheduled', 'completed', 'cancelled'] as const;
const STATUS_COLOR: Record<string, string> = {
  new: 'badge-yellow', contacted: 'badge-blue', scheduled: 'badge-purple',
  completed: 'badge-green', cancelled: 'badge-red',
};

export default function ConsultationsPage() {
  const [items, setItems] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ConsultationRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConsultationRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await consultationsApi.getAll();
    data.sort((a, b) => ((b.createdAt as any)?.seconds ?? 0) - ((a.createdAt as any)?.seconds ?? 0));
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => filterStatus === 'all' || i.status === filterStatus);

  const handleStatusChange = async (item: ConsultationRequest, status: typeof STATUSES[number]) => {
    if (!item.id) return;
    await consultationsApi.update(item.id, { status });
    showToast('Status updated', 'success');
    if (selected?.id === item.id) setSelected({ ...selected, status });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await consultationsApi.delete(deleteTarget.id);
    showToast('Deleted', 'success');
    setDeleteTarget(null);
    if (selected?.id === deleteTarget.id) setSelected(null);
    load();
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Consultation Requests</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-yellow">{items.filter(i => i.status === 'new').length} new</span>
          <select className="adm-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 130 }}>
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 14, alignItems: 'start' }}>
        <div className="card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No consultation requests yet.</div>
          ) : (
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Phone</th><th>City</th><th>Property</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(item)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{item.firstName} {item.lastName}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{item.email || '—'}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{item.phone}</td>
                    <td style={{ fontSize: 12 }}>{item.city}</td>
                    <td style={{ fontSize: 12 }}>{item.propertyType}</td>
                    <td><span className={`badge ${STATUS_COLOR[item.status] ?? 'badge-gray'}`}>{item.status}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {item.createdAt ? new Date((item.createdAt as any).seconds * 1000).toLocaleDateString() : '—'}
                    </td>
                    <td><button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(item); }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{selected.phone}</div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }} onClick={() => setSelected(null)}>×</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Update Status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {STATUSES.map(s => (
                  <button key={s} className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => handleStatusChange(selected, s)}>{s}</button>
                ))}
              </div>
            </div>

            {[
              { label: 'Email', value: selected.email || '—' },
              { label: 'City', value: selected.city },
              { label: 'Property Type', value: selected.propertyType },
              { label: 'Address', value: selected.address || '—' },
            ].map(row => (
              <div key={row.label} style={{ background: 'var(--bg3)', borderRadius: 4, padding: '8px 12px', marginBottom: 7 }}>
                <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 12 }}>{row.value}</div>
              </div>
            ))}

            {selected.interests?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Interests</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {selected.interests.map(i => <span key={i} className="badge badge-gold">{i}</span>)}
                </div>
              </div>
            )}

            {selected.message && (
              <div style={{ background: 'var(--bg3)', borderRadius: 4, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                {selected.message}
              </div>
            )}

            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(selected)}>Delete</button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal message="Delete this consultation request?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
