'use client';

import { useEffect, useState } from 'react';
import { adminsApi, AdminProfileDoc } from '@/lib/firestore';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { Permission, PERMISSION_GROUPS, ROLE_PRESETS, ALL_PERMISSIONS } from '@/lib/roles';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminsPage() {
  const { adminProfile } = useAuth();
  const [admins, setAdmins] = useState<AdminProfileDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | AdminProfileDoc | null>(null);
  const [form, setForm] = useState({ email: '', displayName: '', role: 'admin' as 'admin' | 'super_admin', permissions: [] as Permission[], isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProfileDoc | null>(null);
  const { showToast } = useToast();

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  const load = async () => {
    setLoading(true);
    setAdmins(await adminsApi.getAll());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Only super admins can manage admin accounts.</p>
      </div>
    );
  }

  const openNew = () => {
    setForm({ email: '', displayName: '', role: 'admin', permissions: [], isActive: true });
    setModal('new');
  };

  const openEdit = (a: AdminProfileDoc) => {
    setForm({ email: a.email, displayName: a.displayName, role: a.role, permissions: a.permissions as Permission[], isActive: a.isActive });
    setModal(a);
  };

  const applyPreset = (presetPerms: Permission[]) => {
    setForm(f => ({ ...f, permissions: presetPerms }));
  };

  const togglePerm = (perm: Permission) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') {
        // Create a placeholder doc — the user will be created via Firebase Auth separately
        // We use email as a temporary ID until they sign in
        const tempId = `pending_${Date.now()}`;
        await setDoc(doc(db, 'admins', tempId), {
          uid: tempId,
          email: form.email,
          displayName: form.displayName,
          role: form.role,
          permissions: form.role === 'super_admin' ? ALL_PERMISSIONS : form.permissions,
          isActive: form.isActive,
          createdBy: adminProfile?.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        showToast('Admin created! They must sign in with this email to activate their account.', 'success');
      } else if (modal && typeof modal === 'object' && modal.id) {
        await adminsApi.upsert(modal.id, {
          email: form.email,
          displayName: form.displayName,
          role: form.role,
          permissions: form.role === 'super_admin' ? ALL_PERMISSIONS : form.permissions,
          isActive: form.isActive,
          updatedAt: Timestamp.now(),
        });
        showToast('Admin updated!', 'success');
      }
      setModal(null);
      load();
    } catch (err) {
      showToast('Failed to save admin', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    if (deleteTarget.uid === adminProfile?.uid) { showToast("You can't delete yourself.", 'error'); setDeleteTarget(null); return; }
    await adminsApi.delete(deleteTarget.id);
    showToast('Admin removed', 'success');
    setDeleteTarget(null);
    load();
  };

  const handleToggleActive = async (a: AdminProfileDoc) => {
    if (!a.id || a.uid === adminProfile?.uid) return;
    await adminsApi.upsert(a.id, { isActive: !a.isActive });
    showToast(`Admin ${a.isActive ? 'deactivated' : 'activated'}`, 'success');
    load();
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Admin Management</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>Manage admin accounts and their permissions. Only super admins can access this page.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Admin</button>
      </div>

      {/* Current user card */}
      <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 7, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#000' }}>
          {adminProfile?.displayName?.charAt(0) ?? 'S'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{adminProfile?.displayName}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{adminProfile?.email} · <span style={{ color: 'var(--gold)' }}>Super Admin</span></div>
        </div>
        <span className="badge badge-gold" style={{ marginLeft: 'auto' }}>You</span>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : admins.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No admins yet.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Admin</th><th>Role</th><th>Permissions</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{a.displayName}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{a.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${a.role === 'super_admin' ? 'badge-gold' : 'badge-blue'}`}>
                      {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {a.role === 'super_admin' ? 'All permissions' : `${a.permissions?.length ?? 0} permissions`}
                  </td>
                  <td>
                    <button onClick={() => handleToggleActive(a)} disabled={a.uid === adminProfile?.uid}
                      style={{ background: 'none', border: 'none', cursor: a.uid === adminProfile?.uid ? 'not-allowed' : 'pointer', fontSize: 15, color: a.isActive ? 'var(--green)' : 'var(--subtle)', opacity: a.uid === adminProfile?.uid ? 0.4 : 1 }}>
                      {a.isActive ? '●' : '○'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>Edit</button>
                      {a.uid !== adminProfile?.uid && (
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(a)}>Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ padding: 24, maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              {modal === 'new' ? 'Add Admin' : `Edit: ${typeof modal === 'object' ? modal.displayName : ''}`}
            </h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
              {modal === 'new' ? 'The admin must sign in with this email address to activate their account.' : 'Update this admin\'s role and permissions.'}
            </p>

            <form onSubmit={handleSave}>
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Display Name *</label>
                  <input className="adm-input" required value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="adm-input" required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@eshmart.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="adm-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'super_admin' }))}>
                    <option value="admin">Admin (custom permissions)</option>
                    <option value="super_admin">Super Admin (all permissions)</option>
                  </select>
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)', marginTop: 20 }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                    Active account
                  </label>
                </div>
              </div>

              {form.role === 'admin' && (
                <div>
                  {/* Preset buttons */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Quick Presets</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {ROLE_PRESETS.map(preset => (
                        <button key={preset.label} type="button" className="btn btn-ghost btn-sm"
                          onClick={() => applyPreset(preset.perms)}>
                          {preset.label}
                        </button>
                      ))}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, permissions: [] }))}>
                        Clear All
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, permissions: ALL_PERMISSIONS }))}>
                        Select All
                      </button>
                    </div>
                  </div>

                  {/* Permission groups */}
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Permissions</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                    {PERMISSION_GROUPS.map(group => (
                      <div key={group.label} style={{ background: 'var(--bg3)', borderRadius: 5, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg2)', marginBottom: 8 }}>{group.label}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {group.perms.map(perm => (
                            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 11, color: form.permissions.includes(perm) ? 'var(--fg)' : 'var(--muted)' }}>
                              <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePerm(perm)}
                                style={{ accentColor: 'var(--gold)', width: 13, height: 13 }} />
                              {perm.split(':')[1]}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                    {form.permissions.length} of {ALL_PERMISSIONS.length} permissions selected
                  </div>
                </div>
              )}

              {form.role === 'super_admin' && (
                <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 5, padding: '12px 14px', marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--gold)' }}>⚠ Super admins have full access to everything including admin management. Use with caution.</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Admin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Remove admin access for ${deleteTarget.displayName}? They will no longer be able to access the admin panel.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
