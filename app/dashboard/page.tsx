'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi, ordersApi, usersApi, consultationsApi, Order, blogApi } from '@/lib/firestore';

// ── Mini bar chart ─────────────────────────────────────────────────────────
function BarChart({ data, color = 'var(--gold)' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: '100%', background: color, borderRadius: '2px 2px 0 0', height: `${(d.value / max) * 52}px`, minHeight: d.value > 0 ? 3 : 0, transition: 'height 0.3s ease', opacity: 0.85 }} />
          <span style={{ fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const r = 40, cx = 50, cy = 50, strokeW = 14;
  const circumference = 2 * Math.PI * r;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth={strokeW} />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const offset = circumference - cumulative * circumference;
          cumulative += pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
              strokeWidth={strokeW} strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset} style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }} />
          );
        })}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--fg)">{total}</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{seg.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg)', marginLeft: 'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ values, color = 'var(--gold)' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 120, h = 36;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    products: number; orders: number; users: number; revenue: number;
    pending: number; consultations: number; posts: number;
    ordersByStatus: Record<string, number>;
    revenueByMonth: { label: string; value: number }[];
    ordersByMonth: { label: string; value: number }[];
    usersByMonth: { label: string; value: number }[];
  } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.getAll(),
      ordersApi.getAll(),
      usersApi.getAll(),
      consultationsApi.getAll(),
      blogApi.getAll(),
    ]).then(([products, orders, users, consultations, posts]) => {
      const revenue = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded').reduce((s, o) => s + (o.total || 0), 0);

      // Orders by status
      const ordersByStatus: Record<string, number> = {};
      orders.forEach(o => { ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1; });

      // Last 6 months data
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { label: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() };
      });

      const revenueByMonth = months.map(m => ({
        label: m.label,
        value: orders.filter(o => {
          const d = o.createdAt ? new Date((o.createdAt as any).seconds * 1000) : null;
          return d && d.getFullYear() === m.year && d.getMonth() === m.month && o.status !== 'cancelled';
        }).reduce((s, o) => s + (o.total || 0), 0),
      }));

      const ordersByMonth = months.map(m => ({
        label: m.label,
        value: orders.filter(o => {
          const d = o.createdAt ? new Date((o.createdAt as any).seconds * 1000) : null;
          return d && d.getFullYear() === m.year && d.getMonth() === m.month;
        }).length,
      }));

      const usersByMonth = months.map(m => ({
        label: m.label,
        value: users.filter(u => {
          const d = u.createdAt ? new Date((u.createdAt as any).seconds * 1000) : null;
          return d && d.getFullYear() === m.year && d.getMonth() === m.month;
        }).length,
      }));

      setStats({ products: products.length, orders: orders.length, users: users.length, revenue, pending: orders.filter(o => o.status === 'pending').length, consultations: consultations.filter(c => c.status === 'new').length, posts: posts.length, ordersByStatus, revenueByMonth, ordersByMonth, usersByMonth });

      const sorted = [...orders].sort((a, b) => ((b.createdAt as any)?.seconds ?? 0) - ((a.createdAt as any)?.seconds ?? 0));
      setRecentOrders(sorted.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `₦${n.toLocaleString()}`;
  const fmtK = (n: number) => n >= 1000000 ? `₦${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `₦${(n / 1000).toFixed(0)}K` : `₦${n}`;

  const STATUS_COLOR: Record<string, string> = {
    pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
    shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red', refunded: 'badge-gray',
  };

  const STAT_CARDS = [
    { label: 'Total Orders', value: stats?.orders, color: 'var(--blue)', href: '/dashboard/orders', spark: stats?.ordersByMonth.map(m => m.value) },
    { label: 'Revenue', value: stats ? fmtK(stats.revenue) : null, color: 'var(--green)', href: '/dashboard/orders', spark: stats?.revenueByMonth.map(m => m.value) },
    { label: 'Pending', value: stats?.pending, color: 'var(--yellow)', href: '/dashboard/orders', spark: null },
    { label: 'Customers', value: stats?.users, color: 'var(--gold)', href: '/dashboard/users', spark: stats?.usersByMonth.map(m => m.value) },
    { label: 'Products', value: stats?.products, color: 'var(--muted)', href: '/dashboard/products', spark: null },
    { label: 'Blog Posts', value: stats?.posts, color: 'var(--purple)', href: '/dashboard/blog', spark: null },
  ];

  const QUICK_LINKS = [
    { href: '/dashboard/products/new', label: '+ Add Product' },
    { href: '/dashboard/blog/new', label: '+ New Post' },
    { href: '/dashboard/orders', label: 'View Orders' },
    { href: '/dashboard/hero', label: 'Edit Hero Slides' },
    { href: '/dashboard/theme', label: 'Change Theme' },
    { href: '/dashboard/settings', label: 'Site Settings' },
  ];

  const donutSegments = stats ? [
    { label: 'Delivered', value: stats.ordersByStatus['delivered'] || 0, color: 'var(--green)' },
    { label: 'Pending', value: stats.ordersByStatus['pending'] || 0, color: 'var(--yellow)' },
    { label: 'Processing', value: (stats.ordersByStatus['processing'] || 0) + (stats.ordersByStatus['confirmed'] || 0), color: 'var(--blue)' },
    { label: 'Cancelled', value: (stats.ordersByStatus['cancelled'] || 0) + (stats.ordersByStatus['refunded'] || 0), color: 'var(--red)' },
  ] : [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg)', letterSpacing: '-0.02em', marginBottom: 3 }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Welcome back. Here&apos;s your store overview.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
        {STAT_CARDS.map(card => (
          <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = card.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: card.color, letterSpacing: '-0.02em', marginBottom: 3 }}>
                    {loading ? '—' : card.value ?? 0}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{card.label}</div>
                </div>
                {card.spark && !loading && <Sparkline values={card.spark} color={card.color} />}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
        {/* Revenue chart */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Revenue (6 months)</div>
          {loading ? <div style={{ height: 60, background: 'var(--bg3)', borderRadius: 4 }} /> : (
            <BarChart data={stats?.revenueByMonth ?? []} color="var(--green)" />
          )}
        </div>

        {/* Orders chart */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Orders (6 months)</div>
          {loading ? <div style={{ height: 60, background: 'var(--bg3)', borderRadius: 4 }} /> : (
            <BarChart data={stats?.ordersByMonth ?? []} color="var(--blue)" />
          )}
        </div>

        {/* Order status donut */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Order Status</div>
          {loading ? <div style={{ height: 60, background: 'var(--bg3)', borderRadius: 4 }} /> : (
            <DonutChart segments={donutSegments} />
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Quick Actions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {QUICK_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
              <button className="btn btn-ghost btn-sm">{l.label}</button>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Recent orders */}
        <div className="card">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Recent Orders</span>
            <Link href="/dashboard/orders" style={{ fontSize: 11, color: 'var(--gold)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No orders yet.</div>
          ) : (
            <table className="adm-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>#{order.id?.slice(-6).toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>{order.customerName}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{order.customerEmail}</div>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: 12 }}>{fmt(order.total || 0)}</td>
                    <td><span className={`badge ${STATUS_COLOR[order.status] ?? 'badge-gray'}`}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Content overview */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Content Overview</div>
          {[
            { label: 'Hero Slides', href: '/dashboard/hero', desc: 'Manage homepage slider' },
            { label: 'Blog Posts', href: '/dashboard/blog', desc: `${stats?.posts ?? 0} posts` },
            { label: 'Testimonials', href: '/dashboard/testimonials', desc: 'Customer reviews' },
            { label: 'FAQs', href: '/dashboard/faqs', desc: 'Frequently asked questions' },
            { label: 'Team Members', href: '/dashboard/team', desc: 'About page team' },
            { label: 'Projects', href: '/dashboard/projects', desc: 'Case studies' },
            { label: 'Page Sections', href: '/dashboard/sections', desc: 'Why Us, How It Works, Solar' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.paddingLeft = '4px')}
                onMouseLeave={e => (e.currentTarget.style.paddingLeft = '0')}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--subtle)' }}>{item.desc}</div>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 14 }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
