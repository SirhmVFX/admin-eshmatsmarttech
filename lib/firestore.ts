import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, setDoc, Timestamp, writeBatch, query, orderBy, where, limit,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Product {
  id?: string;
  slug: string;
  name: string;
  category: string;
  tag?: string;
  shortDesc: string;
  longDesc: string;
  price: string;
  priceNote: string;
  image: string;
  gallery: string[];
  features: string[];
  specs: { label: string; value: string }[];
  useCases: string[];
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
  inStock: boolean;
  isVisible: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isVisible: boolean;
  createdAt?: Timestamp;
}

export interface AppUser {
  id?: string;
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  photoURL?: string;
  role: 'customer' | 'admin';
  totalOrders: number;
  totalSpend: number;
  address?: { street?: string; city?: string; state?: string; country?: string };
  cart: unknown[];
  favourites: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface OrderItem {
  productId?: string;
  productName: string;
  image?: string;
  category?: string;
  price: string;
  qty: number;
}

export interface Order {
  id?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  promoCode?: string;
  total: number;
  status: OrderStatus;
  shippingAddress: { street: string; city: string; state: string; country: string };
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ShippingZone {
  id?: string;
  name: string;
  states: string[];
  cost: number;
  freeThreshold?: number;
  estimatedDays: string;
  isActive: boolean;
  createdAt?: Timestamp;
}

export interface PromoCode {
  id?: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  expiresAt?: string;
  createdAt?: Timestamp;
}

export interface Testimonial {
  id?: string;
  name: string;
  role: string;
  quote: string;
  stars: number;
  initials: string;
  color: string;
  isVisible: boolean;
  order: number;
  createdAt?: Timestamp;
}

export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isVisible: boolean;
  createdAt?: Timestamp;
}

export interface ConsultationRequest {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  propertyType: string;
  city: string;
  address?: string;
  interests: string[];
  message?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  createdAt?: Timestamp;
}

export interface SiteSettings {
  id?: string;
  siteName: string;
  tagline: string;
  email: string;
  phone1: string;
  phone2: string;
  whatsapp: string;
  address: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  linkedin: string;
  youtube: string;
  promoBarText: string;
  promoBarEnabled: boolean;
  freeShippingThreshold: number;
  defaultShippingCost: number;
  returnDays: number;
  currency: string;
  currencySymbol: string;
  metaTitle: string;
  metaDescription: string;
  updatedAt?: Timestamp;
}

export interface ThemeSettings {
  id?: string;
  activeTemplate: string;
  primaryColor: string;
  primaryHover: string;
  bgDark: string;
  bgLight: string;
  bgCard: string;
  fontFamily: string;
  borderRadius: string;
  updatedAt?: Timestamp;
}

export interface HeroContent {
  id?: string;
  headline: string;
  subheadline: string;
  description: string;
  backgroundImage: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  badge: string;
  stats: { value: string; label: string }[];
  updatedAt?: Timestamp;
}

export interface AboutContent {
  id?: string;
  heroHeadline: string;
  heroSubheadline: string;
  storyTitle: string;
  storyBody1: string;
  storyBody2: string;
  storyBody3: string;
  founderName: string;
  founderRole: string;
  stats: { value: string; label: string }[];
  updatedAt?: Timestamp;
}

export interface PageSettings {
  id?: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  isVisible: boolean;
  updatedAt?: Timestamp;
}

export interface HeroSlide {
  id?: string;
  headline: string;
  subheadline: string;
  description: string;
  backgroundImage: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  badge: string;
  stats: { value: string; label: string }[];
  order: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  authorImage?: string;
  readTime: number;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SiteSection {
  id?: string;
  key: string;
  data: Record<string, unknown>;
  updatedAt?: Timestamp;
}

export interface TeamMember {
  id?: string;
  name: string;
  role: string;
  bio: string;
  initials: string;
  color: string;
  order: number;
  isVisible: boolean;
  createdAt?: Timestamp;
}

export interface Project {
  id?: string;
  name: string;
  description: string;
  tags: string[];
  stats: { label: string; value: string }[];
  images: string[];
  isVisible: boolean;
  order: number;
  createdAt?: Timestamp;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function getAll<T>(col: string): Promise<T[]> {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

async function getOne<T>(col: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

async function create<T extends object>(col: string, data: T) {
  const ref = await addDoc(collection(db, col), { ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  return ref.id;
}

async function update<T extends object>(col: string, id: string, data: Partial<T>) {
  await updateDoc(doc(db, col, id), { ...data, updatedAt: Timestamp.now() });
}

async function remove(col: string, id: string) {
  await deleteDoc(doc(db, col, id));
}

async function upsert<T extends object>(col: string, id: string, data: T) {
  await setDoc(doc(db, col, id), { ...data, updatedAt: Timestamp.now() }, { merge: true });
}

// ── APIs ───────────────────────────────────────────────────────────────────

export const productsApi = {
  getAll: () => getAll<Product>('products'),
  getOne: (id: string) => getOne<Product>('products', id),
  create: (data: Omit<Product, 'id'>) => create('products', data),
  update: (id: string, data: Partial<Product>) => update('products', id, data),
  delete: (id: string) => remove('products', id),
  bulkSeed: async (products: Omit<Product, 'id'>[]) => {
    const batch = writeBatch(db);
    products.forEach(p => {
      const ref = doc(collection(db, 'products'));
      batch.set(ref, { ...p, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    });
    await batch.commit();
  },
};

export const categoriesApi = {
  getAll: () => getAll<Category>('categories'),
  create: (data: Omit<Category, 'id'>) => create('categories', data),
  update: (id: string, data: Partial<Category>) => update('categories', id, data),
  delete: (id: string) => remove('categories', id),
};

export const usersApi = {
  getAll: () => getAll<AppUser>('users'),
  getOne: (id: string) => getOne<AppUser>('users', id),
  update: (id: string, data: Partial<AppUser>) => update('users', id, data),
  delete: (id: string) => remove('users', id),
};

export const ordersApi = {
  getAll: () => getAll<Order>('orders'),
  getOne: (id: string) => getOne<Order>('orders', id),
  create: (data: Omit<Order, 'id'>) => create('orders', data),
  update: (id: string, data: Partial<Order>) => update('orders', id, data),
  delete: (id: string) => remove('orders', id),
};

export const shippingApi = {
  getAll: () => getAll<ShippingZone>('shippingZones'),
  create: (data: Omit<ShippingZone, 'id'>) => create('shippingZones', data),
  update: (id: string, data: Partial<ShippingZone>) => update('shippingZones', id, data),
  delete: (id: string) => remove('shippingZones', id),
};

export const promoCodesApi = {
  getAll: () => getAll<PromoCode>('promoCodes'),
  create: (data: Omit<PromoCode, 'id'>) => create('promoCodes', data),
  update: (id: string, data: Partial<PromoCode>) => update('promoCodes', id, data),
  delete: (id: string) => remove('promoCodes', id),
};

export const testimonialsApi = {
  getAll: () => getAll<Testimonial>('testimonials'),
  create: (data: Omit<Testimonial, 'id'>) => create('testimonials', data),
  update: (id: string, data: Partial<Testimonial>) => update('testimonials', id, data),
  delete: (id: string) => remove('testimonials', id),
};

export const faqsApi = {
  getAll: () => getAll<FAQ>('faqs'),
  create: (data: Omit<FAQ, 'id'>) => create('faqs', data),
  update: (id: string, data: Partial<FAQ>) => update('faqs', id, data),
  delete: (id: string) => remove('faqs', id),
};

export const consultationsApi = {
  getAll: () => getAll<ConsultationRequest>('consultations'),
  update: (id: string, data: Partial<ConsultationRequest>) => update('consultations', id, data),
  delete: (id: string) => remove('consultations', id),
};

export const siteSettingsApi = {
  get: () => getOne<SiteSettings>('config', 'siteSettings'),
  save: (data: Omit<SiteSettings, 'id'>) => upsert('config', 'siteSettings', data),
};

export const themeApi = {
  get: () => getOne<ThemeSettings>('config', 'theme'),
  save: (data: Omit<ThemeSettings, 'id'>) => upsert('config', 'theme', data),
};

export const heroApi = {
  get: () => getOne<HeroContent>('content', 'hero'),
  save: (data: Omit<HeroContent, 'id'>) => upsert('content', 'hero', data),
};

export const aboutApi = {
  get: () => getOne<AboutContent>('content', 'about'),
  save: (data: Omit<AboutContent, 'id'>) => upsert('content', 'about', data),
};

export const pagesApi = {
  getAll: () => getAll<PageSettings>('pages'),
  upsert: (slug: string, data: Omit<PageSettings, 'id'>) => upsert('pages', slug, data),
};

export const heroSlidesApi = {
  getAll: () => getAll<HeroSlide>('heroSlides'),
  getOne: (id: string) => getOne<HeroSlide>('heroSlides', id),
  create: (data: Omit<HeroSlide, 'id'>) => create('heroSlides', data),
  update: (id: string, data: Partial<HeroSlide>) => update('heroSlides', id, data),
  delete: (id: string) => remove('heroSlides', id),
};

export const blogApi = {
  getAll: () => getAll<BlogPost>('blog'),
  getOne: (id: string) => getOne<BlogPost>('blog', id),
  create: (data: Omit<BlogPost, 'id'>) => create('blog', data),
  update: (id: string, data: Partial<BlogPost>) => update('blog', id, data),
  delete: (id: string) => remove('blog', id),
};

export const teamApi = {
  getAll: () => getAll<TeamMember>('team'),
  create: (data: Omit<TeamMember, 'id'>) => create('team', data),
  update: (id: string, data: Partial<TeamMember>) => update('team', id, data),
  delete: (id: string) => remove('team', id),
};

export const projectsApi = {
  getAll: () => getAll<Project>('projects'),
  create: (data: Omit<Project, 'id'>) => create('projects', data),
  update: (id: string, data: Partial<Project>) => update('projects', id, data),
  delete: (id: string) => remove('projects', id),
};

export const sectionsApi = {
  get: (key: string) => getOne<SiteSection>('sections', key),
  save: (key: string, data: Record<string, unknown>) => upsert('sections', key, { key, data }),
};

// ── Admin profiles ─────────────────────────────────────────────────────────

export interface AdminProfileDoc {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin';
  permissions: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const adminsApi = {
  getAll: () => getAll<AdminProfileDoc>('admins'),
  getOne: (uid: string) => getOne<AdminProfileDoc>('admins', uid),
  upsert: (uid: string, data: Partial<AdminProfileDoc>) => upsert('admins', uid, data),
  delete: (uid: string) => remove('admins', uid),
};
