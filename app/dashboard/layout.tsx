'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';
import { canAccess } from '@/lib/roles';

// Map URL segments to permission sections
const SECTION_MAP: Record<string, string> = {
  orders: 'orders',
  users: 'users',
  products: 'products',
  categories: 'products',
  shipping: 'shipping',
  'promo-codes': 'promos',
  blog: 'blog',
  consultations: 'consultations',
  testimonials: 'testimonials',
  faqs: 'faqs',
  team: 'team',
  projects: 'projects',
  pages: 'content',
  hero: 'content',
  about: 'content',
  sections: 'content',
  theme: 'theme',
  settings: 'settings',
  admins: 'admins',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, adminProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  // Check section-level access
  const segment = pathname.split('/')[2]; // e.g. 'orders', 'products'
  const requiredSection = segment ? SECTION_MAP[segment] : null;
  const hasAccess = !requiredSection || !adminProfile || adminProfile.role === 'super_admin' || canAccess(adminProfile, requiredSection);

  if (loading || !user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
    </div>
  );

  if (!adminProfile?.isActive) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 32 }}>🚫</div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)' }}>Account Deactivated</h2>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Your admin account has been deactivated. Contact a super admin.</p>
      <button className="btn btn-ghost btn-sm" onClick={() => { router.push('/'); }}>Sign Out</button>
    </div>
  );

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 28, overflowX: 'hidden', minWidth: 0 }}>
          {!hasAccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
              <div style={{ fontSize: 40 }}>🔒</div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Access Denied</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>You don&apos;t have permission to access this section.</p>
              <p style={{ color: 'var(--subtle)', fontSize: 11 }}>Contact your super admin to request access.</p>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>← Back to Dashboard</button>
            </div>
          ) : children}
        </main>
      </div>
    </ToastProvider>
  );
}
