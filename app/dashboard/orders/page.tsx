'use client';

import { useEffect, useState } from 'react';
import { ordersApi, Order, OrderStatus } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const STATUS_COLOR: Record<string, string> = {
  pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
  shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red', refunded: 'badge-gray',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await ordersApi.getAll();
    data.sort((a, b) => ((b.createdAt as any)?.seconds ?? 0) - ((a.createdAt as any)?.seconds ?? 0));
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => {
    const ms = o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      (o.id ?? '').toLowerCase().includes(search.toLowerCase());
    return ms && (filterStatus === 'all' || o.status === filterStatus);
  });

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    if (!order.id) return;
    setUpdatingId(order.id);
    await ordersApi.update(order.id, { status });
    showToast('Status updated', 'success');
    setUpdatingId(null);
    if (selected?.id === order.id) setSelected({ ...selected, status });
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o));
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await ordersApi.delete(deleteTarget.id);
    showToast('Order deleted', 'success');
    setDeleteTarget(null);
    if (selected?.id === deleteTarget.id) setSelected(null);
    load();
  };

  const fmt = (n: number) => `₦${(n || 0).toLocaleString()}`;
  const totalRevenue = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded').reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Orders</h1>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{orders.length} total</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Orders', value: orders.length, color: 'var(--blue)' },
          { label: 'Revenue', value: fmt(totalRevenue), color: 'var(--green)' },
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'var(--yellow)' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 14, alignItems: 'start' }}>
        <div className="card">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input className="adm-input" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
            <select className="adm-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value as OrderStatus | 'all')} style={{ width: 130 }}>
              <option value="all">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
            </div>
          ) : (
            <table className="adm-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(order)}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>#{order.id?.slice(-6).toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{order.customerName}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{order.customerEmail}</div>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{order.items?.length ?? 0}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(order.total)}</td>
                    <td><span className={`badge ${STATUS_COLOR[order.status] ?? 'badge-gray'}`}>{order.status}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {order.createdAt ? new Date((order.createdAt as any).seconds * 1000).toLocaleDateString() : '—'}
                    </td>
                    <td><button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(order); }}>View</button></td>
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
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>#{selected.id?.slice(-6).toUpperCase()}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {selected.createdAt ? new Date((selected.createdAt as any).seconds * 1000).toLocaleString() : '—'}
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }} onClick={() => setSelected(null)}>×</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Update Status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {STATUSES.map(s => (
                  <button key={s} className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-ghost'}`}
                    disabled={updatingId === selected.id} onClick={() => handleStatusChange(selected, s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg3)', borderRadius: 5, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Customer</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{selected.customerName}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{selected.customerEmail}</div>
              {selected.customerPhone && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{selected.customerPhone}</div>}
            </div>

            <div style={{ background: 'var(--bg3)', borderRadius: 5, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Shipping Address</div>
              <div style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.6 }}>
                {selected.shippingAddress?.street}<br />
                {selected.shippingAddress?.city}, {selected.shippingAddress?.state}<br />
                {selected.shippingAddress?.country}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Items</div>
              {selected.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg3)', borderRadius: 4, padding: '7px 10px', marginBottom: 5 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.productName}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>×{item.qty}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{item.price}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg3)', borderRadius: 5, padding: '10px 12px', marginBottom: 14 }}>
              {[
                { label: 'Subtotal', value: fmt(selected.subtotal || 0) },
                { label: 'Shipping', value: fmt(selected.shippingCost || 0) },
                ...(selected.discount > 0 ? [{ label: `Promo (${selected.promoCode ?? ''})`, value: `-${fmt(selected.discount)}` }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>
                  <span>{row.label}</span><span>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: 'var(--fg)', borderTop: '1px solid var(--border)', paddingTop: 7, marginTop: 5 }}>
                <span>Total</span><span>{fmt(selected.total)}</span>
              </div>
            </div>

            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(selected)}>Delete Order</button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmModal
          message={`Delete order #${deleteTarget.id?.slice(-6).toUpperCase()}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
