'use client';

import { useState } from 'react';
import { Product } from '@/lib/firestore';
import TagInput from './TagInput';
import ImageUpload, { MultiImageUpload } from './ImageUpload';
import RichEditor from './RichEditor';

interface Props { initial?: Partial<Product>; onSave: (data: Omit<Product, 'id'>) => Promise<void>; saving: boolean; }

const EMPTY: Omit<Product, 'id'> = {
  slug: '', name: '', category: '', tag: '', shortDesc: '', longDesc: '',
  price: '', priceNote: '', image: '', gallery: [], features: [], specs: [],
  useCases: [], faqs: [], relatedSlugs: [], inStock: true, isVisible: true, order: 99,
};

export default function ProductForm({ initial = {}, onSave, saving }: Props) {
  const [form, setForm] = useState<Omit<Product, 'id'>>({ ...EMPTY, ...initial });
  const [tab, setTab] = useState<'basic' | 'media' | 'details' | 'seo'>('basic');

  const set = (key: keyof typeof form, val: unknown) => setForm(f => ({ ...f, [key]: val }));
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await onSave(form); };
  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <form onSubmit={handleSubmit}>
      <div className="tab-bar">
        {(['basic', 'media', 'details', 'seo'] as const).map(t => (
          <button key={t} type="button" className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Product Name *</label>
            <input className="adm-input" required value={form.name}
              onChange={e => { set('name', e.target.value); if (!form.slug || form.slug === autoSlug(form.name)) set('slug', autoSlug(e.target.value)); }} />
          </div>
          <div className="form-group">
            <label className="form-label">Slug *</label>
            <input className="adm-input" required value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="biometric-access-control" />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <input className="adm-input" required value={form.category} onChange={e => set('category', e.target.value)} placeholder="Access Control" />
          </div>
          <div className="form-group">
            <label className="form-label">Price *</label>
            <input className="adm-input" required value={form.price} onChange={e => set('price', e.target.value)} placeholder="From ₦350,000" />
          </div>
          <div className="form-group">
            <label className="form-label">Price Note</label>
            <input className="adm-input" value={form.priceNote} onChange={e => set('priceNote', e.target.value)} placeholder="Installation inclusive." />
          </div>
          <div className="form-group">
            <label className="form-label">Tag (badge)</label>
            <input className="adm-input" value={form.tag || ''} onChange={e => set('tag', e.target.value)} placeholder="Most Popular" />
          </div>
          <div className="form-group">
            <label className="form-label">Display Order</label>
            <input className="adm-input" type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Short Description *</label>
            <textarea className="adm-input" required rows={2} value={form.shortDesc} onChange={e => set('shortDesc', e.target.value)} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Long Description (Rich Text)</label>
            <RichEditor value={form.longDesc} onChange={v => set('longDesc', v)} placeholder="Detailed product description..." minHeight={220} folder="products" />
          </div>
          <div className="form-group form-full">
            <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
              {[{ key: 'inStock', label: 'In Stock' }, { key: 'isVisible', label: 'Visible on site' }].map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)' }}>
                  <input type="checkbox" checked={!!form[f.key as keyof typeof form]} onChange={e => set(f.key as keyof typeof form, e.target.checked)} style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'media' && (
        <div className="form-grid">
          <div className="form-group form-full">
            <ImageUpload
              value={form.image}
              onChange={v => set('image', v)}
              folder="products"
              label="Main Product Image"
              height={200}
            />
          </div>
          <div className="form-group form-full">
            <MultiImageUpload
              values={form.gallery}
              onChange={v => set('gallery', v)}
              folder="products/gallery"
              label="Gallery Images (up to 8)"
              max={8}
            />
          </div>
        </div>
      )}

      {tab === 'details' && (
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Features</label>
            <TagInput values={form.features} onChange={v => set('features', v)} placeholder="Add feature, press Enter" />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Use Cases</label>
            <TagInput values={form.useCases} onChange={v => set('useCases', v)} placeholder="Add use case, press Enter" />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Related Product Slugs</label>
            <TagInput values={form.relatedSlugs} onChange={v => set('relatedSlugs', v)} placeholder="Add slug, press Enter" />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Specs (label: value, one per line)</label>
            <textarea className="adm-input" rows={6}
              value={form.specs.map(s => `${s.label}: ${s.value}`).join('\n')}
              onChange={e => set('specs', e.target.value.split('\n').map(l => {
                const [label, ...rest] = l.split(':');
                return { label: label?.trim() || '', value: rest.join(':').trim() };
              }).filter(s => s.label))}
              placeholder="Recognition speed: < 0.5 seconds&#10;User capacity: Up to 10,000" />
          </div>
          <div className="form-group form-full">
            <label className="form-label">FAQs (Q|A, one per line)</label>
            <textarea className="adm-input" rows={5}
              value={form.faqs.map(f => `${f.q}|${f.a}`).join('\n')}
              onChange={e => set('faqs', e.target.value.split('\n').map(l => {
                const [q, ...rest] = l.split('|');
                return { q: q?.trim() || '', a: rest.join('|').trim() };
              }).filter(f => f.q))}
              placeholder="Does it work during power outage?|Yes, 8 hours battery backup." />
          </div>
        </div>
      )}

      {tab === 'seo' && (
        <div className="form-grid">
          <div className="form-group form-full" style={{ background: 'var(--bg3)', padding: 14, borderRadius: 5 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              SEO is derived from the product name and short description. URL: <code style={{ color: 'var(--gold)' }}>/products/{form.slug || 'your-slug'}</code>
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
      </div>
    </form>
  );
}
