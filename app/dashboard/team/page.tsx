'use client';

import { useEffect, useState } from 'react';
import { teamApi, TeamMember } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

const EMPTY: Omit<TeamMember, 'id'> = { name: '', role: '', bio: '', initials: '', color: 'bg-amber-700', order: 99, isVisible: true };
const COLORS = [
  { label: 'Amber', value: 'bg-amber-700', hex: '#b45309' },
  { label: 'Teal', value: 'bg-teal-700', hex: '#0f766e' },
  { label: 'Indigo', value: 'bg-indigo-700', hex: '#4338ca' },
  { label: 'Rose', value: 'bg-rose-700', hex: '#be123c' },
  { label: 'Purple', value: 'bg-purple-700', hex: '#7e22ce' },
  { label: 'Cyan', value: 'bg-cyan-700', hex: '#0e7490' },
];

const DEFAULT_TEAM: Omit<TeamMember, 'id'>[] = [
  { name: 'Emeka Okonkwo', role: 'Founder & Lead Engineer', bio: 'EEE-qualified electrical engineer with an MBA. 15+ years in security systems across Nigeria.', initials: 'EO', color: 'bg-amber-700', order: 1, isVisible: true },
  { name: 'Adaeze Nwosu', role: 'Operations Director', bio: 'Oversees project delivery, client relations, and our maintenance retainer programme.', initials: 'AN', color: 'bg-teal-700', order: 2, isVisible: true },
  { name: 'Chukwudi Eze', role: 'Senior Installation Engineer', bio: 'EEE-qualified with specialist expertise in biometric systems and solar integration.', initials: 'CE', color: 'bg-indigo-700', order: 3, isVisible: true },
  { name: 'Fatima Aliyu', role: 'Business Development', bio: 'Manages developer partnerships and estate specification projects across Lagos and Abuja.', initials: 'FA', color: 'bg-rose-700', order: 4, isVisible: true },
  { name: 'Tunde Adeyemi', role: 'CCTV & Surveillance Lead', bio: '10+ years designing and installing HD surveillance systems for residential and commercial clients.', initials: 'TA', color: 'bg-purple-700', order: 5, isVisible: true },
  { name: 'Ngozi Obi', role: 'Client Success Manager', bio: 'Ensures every client receives full handover training and ongoing support after installation.', initials: 'NO', color: 'bg-cyan-700', order: 6, isVisible: true },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | TeamMember | null>(null);
  const [form, setForm] = useState<Omit<TeamMember, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await teamApi.getAll();
    data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (m: TeamMember) => {
    setForm({ name: m.name, role: m.role, bio: m.bio, initials: m.initials, color: m.color, order: m.order, isVisible: m.isVisible });
    setModal(m);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') { await teamApi.create(form); showToast('Member added!', 'success'); }
      else if (modal && typeof modal === 'object' && modal.id) { await teamApi.update(modal.id, form); showToast('Updated!', 'success'); }
      setModal(null); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await teamApi.delete(deleteTarget.id);
    showToast('Deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const seedDefaults = async () => {
    for (const m of DEFAULT_TEAM) await teamApi.create(m);
    showToast('Default team seeded!', 'success');
    load();
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Team Members</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {members.length === 0 && <button className="btn btn-ghost btn-sm" onClick={seedDefaults}>⬇ Seed Defaults</button>}
          <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Member</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : members.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No team members yet.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Member</th><th>Role</th><th>Order</th><th>Visible</th><th>Actions</th></tr></thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS.find(c => c.value === m.color)?.hex ?? '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{m.initials}</div>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{m.role}</td>
                  <td>{m.order}</td>
                  <td><span className={`badge ${m.isVisible ? 'badge-green' : 'badge-gray'}`}>{m.isVisible ? 'Visible' : 'Hidden'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(m)}>Del</button>
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
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>{modal === 'new' ? 'Add Team Member' : 'Edit Member'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="adm-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Initials (2 chars)</label>
                  <input className="adm-input" value={form.initials} onChange={e => setForm(f => ({ ...f, initials: e.target.value.toUpperCase().slice(0, 2) }))} maxLength={2} placeholder="EO" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Role / Title</label>
                  <input className="adm-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Founder & Lead Engineer" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Bio</label>
                  <textarea className="adm-input" rows={2} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="adm-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Avatar Color</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {COLORS.map(c => (
                      <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, color: c.value }))}
                        style={{ width: 26, height: 26, borderRadius: '50%', background: c.hex, border: form.color === c.value ? '2px solid var(--gold)' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                <div className="form-group form-full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)' }}>
                    <input type="checkbox" checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                    Visible on About page
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
        <ConfirmModal message={`Delete ${deleteTarget.name}?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
