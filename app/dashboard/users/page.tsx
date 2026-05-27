'use client';

import { useEffect, useState } from 'react';
import { usersApi, ordersApi, AppUser, Order } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const [u, o] = await Promise.all([usersApi.getAll(), ordersApi.getAll()]);
    const enriched = u.map(user => {
      const userOrders = o.filter(ord => ord.customerEmail === user.email);
      return { ...user, totalOrders: userOrders.length, totalSpend: userOrders.reduce((s, ord) => s + (ord.total || 0), 0) };
    });
    setUsers(enriched);
    setOrders(o);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const userOrders = selected ? orders.filter(o => o.customerEmail === selected.email) : [];

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await usersApi.delete(deleteTarget.id);
    showToast('User deleted', 'success');
    setDeleteTarget(null);
    setSelected(null);
    load();
  };

  const handleRoleToggle = async (user: AppUser) => {
    if (!user.id) return;
    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    await usersApi.update(user.id, { role: newRole });
    showToast(`Role updated to ${newRole}`, 'success');
    load();
  };

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;
  const STATUS_COLOR: Record<string, string> = {
    pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
    shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red', refunded: 'badge-gray',
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Users</h1>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{users.length} registered</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 14, alignItems: 'start' }}>
        <div className="card">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <input className="adm-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              {users.length === 0 ? 'No users yet. They appear when customers sign up.' : 'No users match your search.'}
            </div>
          ) : (
            <table className="adm-table">
              <thead><tr><th>User</th><th>Role</th><th>Orders</th><th>Total Spend</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(user)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{user.displayName || '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{user.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>{user.role || 'customer'}</span>
                    </td>
                    <td><span className="badge badge-blue">{user.totalOrders}</span></td>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{fmt(user.totalSpend)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {user.createdAt ? new Date((user.createdAt as any).seconds * 1000).toLocaleDateString() : '—'}
                    </td>
                    <td><button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(user); }}>View</button></td>
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.displayName || 'No name'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{selected.email}</div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }} onClick={() => setSelected(null)}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Orders', value: selected.totalOrders },
                { label: 'Total Spend', value: fmt(selected.totalSpend) },
                { label: 'Phone', value: selected.phone || '—' },
                { label: 'Role', value: selected.role || 'customer' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg3)', borderRadius: 4, padding: '8px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Order History</div>
              {userOrders.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>No orders yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {userOrders.slice(0, 5).map(order => (
                    <div key={order.id} style={{ background: 'var(--bg3)', borderRadius: 4, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>#{order.id?.slice(-6).toUpperCase()}</span>
                        <span className={`badge ${STATUS_COLOR[order.status] ?? 'badge-gray'}`}>{order.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{order.items?.length ?? 0} items · {fmt(order.total)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

    <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleRoleToggle(selected)}>
                {selected.role === 'admin' ? '↓ Remove Admin' : '↑ Make Admin'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(selected)}>Delete User</button>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message={`Delete ${deleteTarget.email}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
