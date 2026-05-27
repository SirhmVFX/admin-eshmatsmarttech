// ── Permission system ──────────────────────────────────────────────────────

export type Permission =
  | 'orders:read'   | 'orders:write'   | 'orders:delete'
  | 'products:read' | 'products:write' | 'products:delete'
  | 'users:read'    | 'users:write'    | 'users:delete'
  | 'blog:read'     | 'blog:write'     | 'blog:delete'
  | 'content:read'  | 'content:write'
  | 'settings:read' | 'settings:write'
  | 'theme:read'    | 'theme:write'
  | 'shipping:read' | 'shipping:write' | 'shipping:delete'
  | 'promos:read'   | 'promos:write'   | 'promos:delete'
  | 'consultations:read' | 'consultations:write'
  | 'testimonials:read'  | 'testimonials:write' | 'testimonials:delete'
  | 'faqs:read'     | 'faqs:write'     | 'faqs:delete'
  | 'team:read'     | 'team:write'     | 'team:delete'
  | 'projects:read' | 'projects:write' | 'projects:delete'
  | 'admins:manage';

export type AdminRole = 'super_admin' | 'admin';

export interface AdminProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: Permission[];
  isActive: boolean;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// All permissions — only super_admin has this
export const ALL_PERMISSIONS: Permission[] = [
  'orders:read', 'orders:write', 'orders:delete',
  'products:read', 'products:write', 'products:delete',
  'users:read', 'users:write', 'users:delete',
  'blog:read', 'blog:write', 'blog:delete',
  'content:read', 'content:write',
  'settings:read', 'settings:write',
  'theme:read', 'theme:write',
  'shipping:read', 'shipping:write', 'shipping:delete',
  'promos:read', 'promos:write', 'promos:delete',
  'consultations:read', 'consultations:write',
  'testimonials:read', 'testimonials:write', 'testimonials:delete',
  'faqs:read', 'faqs:write', 'faqs:delete',
  'team:read', 'team:write', 'team:delete',
  'projects:read', 'projects:write', 'projects:delete',
  'admins:manage',
];

// Permission groups for the UI
export const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  { label: 'Orders', perms: ['orders:read', 'orders:write', 'orders:delete'] },
  { label: 'Products', perms: ['products:read', 'products:write', 'products:delete'] },
  { label: 'Users', perms: ['users:read', 'users:write', 'users:delete'] },
  { label: 'Blog / CMS', perms: ['blog:read', 'blog:write', 'blog:delete'] },
  { label: 'Content', perms: ['content:read', 'content:write'] },
  { label: 'Settings', perms: ['settings:read', 'settings:write'] },
  { label: 'Theme', perms: ['theme:read', 'theme:write'] },
  { label: 'Shipping', perms: ['shipping:read', 'shipping:write', 'shipping:delete'] },
  { label: 'Promo Codes', perms: ['promos:read', 'promos:write', 'promos:delete'] },
  { label: 'Consultations', perms: ['consultations:read', 'consultations:write'] },
  { label: 'Testimonials', perms: ['testimonials:read', 'testimonials:write', 'testimonials:delete'] },
  { label: 'FAQs', perms: ['faqs:read', 'faqs:write', 'faqs:delete'] },
  { label: 'Team', perms: ['team:read', 'team:write', 'team:delete'] },
  { label: 'Projects', perms: ['projects:read', 'projects:write', 'projects:delete'] },
  { label: 'Admin Management', perms: ['admins:manage'] },
];

// Preset role templates
export const ROLE_PRESETS: { label: string; perms: Permission[] }[] = [
  {
    label: 'Content Editor',
    perms: ['blog:read', 'blog:write', 'content:read', 'content:write', 'testimonials:read', 'testimonials:write', 'faqs:read', 'faqs:write', 'team:read', 'team:write', 'projects:read', 'projects:write'],
  },
  {
    label: 'Store Manager',
    perms: ['orders:read', 'orders:write', 'products:read', 'products:write', 'users:read', 'shipping:read', 'shipping:write', 'promos:read', 'promos:write', 'consultations:read', 'consultations:write'],
  },
  {
    label: 'Order Fulfillment',
    perms: ['orders:read', 'orders:write', 'users:read', 'consultations:read', 'consultations:write'],
  },
  {
    label: 'Read Only',
    perms: ['orders:read', 'products:read', 'users:read', 'blog:read', 'content:read', 'settings:read'],
  },
];

export function hasPermission(profile: AdminProfile | null, perm: Permission): boolean {
  if (!profile) return false;
  if (profile.role === 'super_admin') return true;
  return profile.permissions.includes(perm);
}

export function canAccess(profile: AdminProfile | null, section: string): boolean {
  if (!profile) return false;
  if (profile.role === 'super_admin') return true;
  const sectionMap: Record<string, Permission> = {
    orders: 'orders:read',
    products: 'products:read',
    users: 'users:read',
    blog: 'blog:read',
    content: 'content:read',
    settings: 'settings:read',
    theme: 'theme:read',
    shipping: 'shipping:read',
    promos: 'promos:read',
    consultations: 'consultations:read',
    testimonials: 'testimonials:read',
    faqs: 'faqs:read',
    team: 'team:read',
    projects: 'projects:read',
    admins: 'admins:manage',
  };
  const required = sectionMap[section];
  return required ? profile.permissions.includes(required) : false;
}
