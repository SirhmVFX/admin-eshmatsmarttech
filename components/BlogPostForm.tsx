'use client';

import { useState } from 'react';
import { BlogPost } from '@/lib/firestore';
import TagInput from './TagInput';
import ImageUpload from './ImageUpload';
import RichEditor from './RichEditor';

interface Props { initial?: Partial<BlogPost>; onSave: (data: Omit<BlogPost, 'id'>) => Promise<void>; saving: boolean; }

const EMPTY: Omit<BlogPost, 'id'> = {
  slug: '', title: '', excerpt: '', content: '', coverImage: '',
  category: '', tags: [], author: '', authorImage: '',
  readTime: 5, isPublished: false, isFeatured: false, publishedAt: '',
};

const CATEGORIES = ['Security', 'Solar Energy', 'Smart Home', 'Access Control', 'CCTV', 'Gate Automation', 'Industry News', 'Tips & Guides'];

export default function BlogPostForm({ initial = {}, onSave, saving }: Props) {
  const [form, setForm] = useState<Omit<BlogPost, 'id'>>({ ...EMPTY, ...initial });
  const [tab, setTab] = useState<'content' | 'meta' | 'settings'>('content');

  const set = (key: keyof typeof form, val: unknown) => setForm(f => ({ ...f, [key]: val }));
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await onSave(form); };
  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <form onSubmit={handleSubmit}>
      <div className="tab-bar">
        {(['content', 'meta', 'settings'] as const).map(t => (
          <button key={t} type="button" className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Title *</label>
            <input className="adm-input" required value={form.title}
              onChange={e => { set('title', e.target.value); if (!form.slug || form.slug === autoSlug(form.title)) set('slug', autoSlug(e.target.value)); }} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Excerpt (shown in blog listing)</label>
            <textarea className="adm-input" rows={2} value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="A brief summary of the post..." />
          </div>
          <div className="form-group form-full">
            <ImageUpload
              value={form.coverImage}
              onChange={v => set('coverImage', v)}
              folder="blog/covers"
              label="Cover Image"
              height={180}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Content *</label>
            <RichEditor
              value={form.content}
              onChange={v => set('content', v)}
              placeholder="Write your blog post here..."
              minHeight={400}
              folder="blog/images"
            />
          </div>
        </div>
      )}

      {tab === 'meta' && (
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Slug (URL) *</label>
            <input className="adm-input" required value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="my-blog-post" />
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>/blog/{form.slug || 'your-slug'}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="adm-input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Author Name *</label>
            <input className="adm-input" required value={form.author} onChange={e => set('author', e.target.value)} placeholder="Emeka Okonkwo" />
          </div>
          <div className="form-group">
            <label className="form-label">Read Time (minutes)</label>
            <input className="adm-input" type="number" min={1} value={form.readTime} onChange={e => set('readTime', Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Publish Date</label>
            <input className="adm-input" type="date" value={form.publishedAt || ''} onChange={e => set('publishedAt', e.target.value)} />
          </div>
          <div className="form-group form-full">
            <ImageUpload
              value={form.authorImage || ''}
              onChange={v => set('authorImage', v)}
              folder="blog/authors"
              label="Author Photo"
              height={100}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Tags</label>
            <TagInput values={form.tags} onChange={v => set('tags', v)} placeholder="Add tag, press Enter" />
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="form-grid">
          <div className="form-group form-full">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'isPublished', label: 'Published', desc: 'Visible on the public blog' },
                { key: 'isFeatured', label: 'Featured', desc: 'Shown prominently on the blog homepage and homepage section' },
              ].map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', background: 'var(--bg3)', padding: '12px 14px', borderRadius: 5 }}>
                  <input type="checkbox" checked={!!form[f.key as keyof typeof form]} onChange={e => set(f.key as keyof typeof form, e.target.checked)} style={{ accentColor: 'var(--gold)', width: 16, height: 16, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Post'}</button>
        {!form.isPublished && (
          <button type="button" className="btn btn-success" disabled={saving}
            onClick={() => { set('isPublished', true); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50); }}>
            Publish Now
          </button>
        )}
      </div>
    </form>
  );
}
