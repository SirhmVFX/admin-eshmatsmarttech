'use client';

import { useEffect, useState } from 'react';
import { projectsApi, Project } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import TagInput from '@/components/TagInput';

const EMPTY: Omit<Project, 'id'> = { name: '', description: '', tags: [], stats: [], images: [], isVisible: true, order: 99 };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | Project | null>(null);
  const [form, setForm] = useState<Omit<Project, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await projectsApi.getAll();
    data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (p: Project) => {
    setForm({ name: p.name, description: p.description, tags: p.tags, stats: p.stats, images: p.images, isVisible: p.isVisible, order: p.order });
    setModal(p);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') { await projectsApi.create(form); showToast('Project created!', 'success'); }
      else if (modal && typeof modal === 'object' && modal.id) { await projectsApi.update(modal.id, form); showToast('Updated!', 'success'); }
      setModal(null); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await projectsApi.delete(deleteTarget.id);
    showToast('Deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const set = (key: keyof typeof form, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Projects / Case Studies</h1>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Project</button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : projects.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No projects yet.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Project</th><th>Tags</th><th>Stats</th><th>Order</th><th>Visible</th><th>Actions</th></tr></thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.description?.slice(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 11 }}>{p.tags.slice(0, 2).join(', ')}{p.tags.length > 2 ? '...' : ''}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{p.stats.length} stats</td>
                  <td>{p.order}</td>
                  <td><span className={`badge ${p.isVisible ? 'badge-green' : 'badge-gray'}`}>{p.isVisible ? 'Visible' : 'Hidden'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>Del</button>
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
          <div className="modal-box" style={{ padding: 24, maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>{modal === 'new' ? 'New Project' : 'Edit Project'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Project Name *</label>
                  <input className="adm-input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Pinnock Gardens Estate" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Description</label>
                  <textarea className="adm-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Tags</label>
                  <TagInput values={form.tags} onChange={v => set('tags', v)} placeholder="Biometric access, CCTV..." />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Image URLs (one per line)</label>
                  <textarea className="adm-input" rows={3} value={form.images.join('\n')} onChange={e => set('images', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} placeholder="https://..." />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Stats (label: value, one per line)</label>
                  <textarea className="adm-input" rows={4}
                    value={form.stats.map(s => `${s.label}: ${s.value}`).join('\n')}
                    onChange={e => set('stats', e.target.value.split('\n').map(l => {
                      const [label, ...rest] = l.split(':');
                      return { label: label?.trim() || '', value: rest.join(':').trim() };
                    }).filter(s => s.label))}
                    placeholder="Units secured: 80&#10;Cameras installed: 64" />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="adm-input" type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)', marginTop: 20 }}>
                    <input type="checkbox" checked={form.isVisible} onChange={e => set('isVisible', e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
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
        <ConfirmModal message={`Delete "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
