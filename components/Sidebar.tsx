'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { canAccess } from '@/lib/roles';

const NAV_GROUPS = [
  {
    label: 'Store',
    items: [
      { href: '/dashboard', icon: '▦', label: 'Dashboard', section: null },
      { href: '/dashboard/orders', icon: '◫', label: 'Orders', section: 'orders' },
      { href: '/dashboard/users', icon: '◎', label: 'Users', section: 'users' },
      { href: '/dashboard/products', icon: '◈', label: 'Products', section: 'products' },
      { href: '/dashboard/categories', icon: '◉', label: 'Categories', section: 'products' },
      { href: '/dashboard/shipping', icon: '◳', label: 'Shipping', section: 'shipping' },
      { href: '/dashboard/promo-codes', icon: '%', label: 'Promo Codes', section: 'promos' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/blog', icon: '✎', label: 'Blog / CMS', section: 'blog' },
      { href: '/dashboard/consultations', icon: '◐', label: 'Consultations', section: 'consultations' },
      { href: '/dashboard/testimonials', icon: '❝', label: 'Testimonials', section: 'testimonials' },
      { href: '/dashboard/faqs', icon: '?', label: 'FAQs', section: 'faqs' },
      { href: '/dashboard/team', icon: '◈', label: 'Team', section: 'team' },
      { href: '/dashboard/projects', icon: '◱', label: 'Projects', section: 'projects' },
      { href: '/dashboard/pages', icon: '◱', label: 'Pages', section: 'content' },
    ],
  },
  {
    label: 'Site',
    items: [
      { href: '/dashboard/hero', icon: '◑', label: 'Hero Slides', section: 'content' },
      { href: '/dashboard/about', icon: '◒', label: 'About Content', section: 'content' },
      { href: '/dashboard/sections', icon: '◓', label: 'Page Sections', section: 'content' },
      { href: '/dashboard/theme', icon: '◔', label: 'Theme & Colors', section: 'theme' },
      { href: '/dashboard/settings', icon: '⚙', label: 'Site Settings', section: 'settings' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/dashboard/admins', icon: '🔑', label: 'Admin Management', section: 'admins' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, adminProfile, logOut } = useAuth();

  const handleLogOut = async () => {
    await logOut();
    router.push('/');
  };

  const isSuperAdmin = adminProfile?.role === 'super_admin';

  return (
    <aside style={{
      width: 210,
      minHeight: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#000', borderRadius: 5 }}>E</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--fg)' }}>ESHMART</div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 7px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {NAV_GROUPS.map(group => {
          const visibleItems = group.items.filter(item =>
            item.section === null || canAccess(adminProfile, item.section)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--subtle)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 4 }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {visibleItems.map(item => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                      <span className="nav-icon" style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '10px 7px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '6px 12px', marginBottom: 3 }}>
          <div style={{ fontSize: 11, color: 'var(--fg2)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {adminProfile?.displayName || user?.email}
          </div>
          <div style={{ fontSize: 9, color: isSuperAdmin ? 'var(--gold)' : 'var(--muted)', marginTop: 1, fontWeight: 600 }}>
            {isSuperAdmin ? '★ Super Admin' : 'Admin'}
          </div>
        </div>
        <button onClick={handleLogOut} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', color: 'var(--red)' }}>
          <span style={{ fontSize: 13, width: 16, textAlign: 'center' }}>→</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
