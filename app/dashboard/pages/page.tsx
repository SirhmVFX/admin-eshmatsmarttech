'use client';

import { useEffect, useState } from 'react';
import { pagesApi, PageSettings } from '@/lib/firestore';
import { useToast } from '@/components/Toast';

const DEFAULT_PAGES: Omit<PageSettings, 'id'>[] = [
  { slug: 'home', title: 'Home', metaTitle: 'Eshmart SmartTech — Smart Security Specialists', metaDescription: 'Professional installation of biometric access control, CCTV, remote gate systems, smart home automation, and solar power.', isVisible: true },
  { slug: 'products', title: 'Products', metaTitle: 'Products — Eshmart SmartTech', metaDescription: 'Browse our complete range of smart security and automation products.', isVisible: true },
  { slug: 'services', title: 'Services', metaTitle: 'Services — Eshmart SmartTech', metaDescription: 'Professional security installation and maintenance services.', isVisible: true },
  { slug: 'solar', title: 'Solar', metaTitle: 'Solar Power Systems — Eshmart SmartTech', metaDescription: 'Keep your security systems running 24/7 with our solar power solutions.', isVisible: true },
  { slug: 'about', title: 'About', metaTitle: 'About Us — Eshmart SmartTech', metaDescription: 'Learn about Nigeria\'s certified smart security specialists.', isVisible: true },
  { slug: 'consultation', title: 'Consultation', metaTitle: 'Free Consultation — Eshmart SmartTech', metaDescription: 'Book your free site assessment with a certified Eshmart engineer.', isVisible: true },
  { slug: 'how-it-works', title: 'How It Works', metaTitle: 'How It Works — Eshmart SmartTech', metaDescription: 'Our 4-step process from enquiry to installation.', isVisible: true },
  { slug: 'get-a-quote', title: 'Get a Quote', metaTitle: 'Get a Quote — Eshmart SmartTech', metaDescription: 'Request a fixed-price quote for your security installation.', isVisible: true },
];

export default function PagesPage() {
  const [pages, setPages] = useState<PageSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PageSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    setPages(await pagesApi.getAll());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const seedDefaults = async () => {
    for (const p of DEFAULT_PAGES) await pagesApi.upsert(p.slug, p);
    showToast('Default pages seeded!', 'success');
    load();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await pagesApi.upsert(editing.slug, { slug: editing.slug, title: editing.title, metaTitle: editing.metaTitle, metaDescription: editing.metaDescription, isVisible: editing.isVisible });
      showToast('Page settings saved!', 'success');
      setEditing(null);
      load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Page Settings</h1>
        {pages.length === 0 && <button className="btn btn-ghost btn-sm" onClick={seedDefaults}>⬇ Seed Default Pages</button>}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : pages.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No pages configured yet. Click "Seed Default Pages" to get started.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Page</th><th>Slug</th><th>Meta Title</th><th>Visible</th><th>Actions</th></tr></thead>
            <tbody>
              {pages.map(page => (
                <tr key={page.id || page.slug}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{page.title}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>/{page.slug}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.metaTitle}</td>
                  <td><span className={`badge ${page.isVisible ? 'badge-green' : 'badge-gray'}`}>{page.isVisible ? 'Visible' : 'Hidden'}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setEditing(page)}>Edit SEO</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Edit Page: {editing.title}</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 18 }}>/{editing.slug}</p>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Meta Title</label>
                  <input className="adm-input" value={editing.metaTitle} onChange={e => setEditing(p => p ? { ...p, metaTitle: e.target.value } : p)} />
                  <div style={{ fontSize: 10, color: editing.metaTitle.length > 60 ? 'var(--red)' : 'var(--muted)', marginTop: 3 }}>
                    {editing.metaTitle.length}/60 chars
                  </div>
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Meta Description</label>
                  <textarea className="adm-input" rows={3} value={editing.metaDescription} onChange={e => setEditing(p => p ? { ...p, metaDescription: e.target.value } : p)} />
                  <div style={{ fontSize: 10, color: editing.metaDescription.length > 160 ? 'var(--red)' : 'var(--muted)', marginTop: 3 }}>
                    {editing.metaDescription.length}/160 chars
                  </div>
                </div>
                <div className="form-group form-full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)' }}>
                    <input type="checkbox" checked={editing.isVisible} onChange={e => setEditing(p => p ? { ...p, isVisible: e.target.checked } : p)} style={{ accentColor: 'var(--gold)' }} />
                    Page is visible / indexed
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
