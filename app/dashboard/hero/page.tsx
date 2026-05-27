'use client';

import { useEffect, useState } from 'react';
import { heroSlidesApi, HeroSlide } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import TagInput from '@/components/TagInput';
import ImageUpload from '@/components/ImageUpload';

const EMPTY: Omit<HeroSlide, 'id'> = {
  headline: '',
  subheadline: '',
  description: '',
  backgroundImage: '',
  ctaPrimaryLabel: 'GET A FREE QUOTE →',
  ctaPrimaryHref: '/consultation',
  ctaSecondaryLabel: 'HOW IT WORKS',
  ctaSecondaryHref: '/how-it-works',
  badge: '',
  stats: [
    { value: '500+', label: 'Installations completed' },
    { value: '24 hr', label: 'Response SLA guaranteed' },
    { value: '2 yr', label: 'Installation warranty' },
  ],
  order: 99,
  isActive: true,
};

const DEFAULT_SLIDES: Omit<HeroSlide, 'id'>[] = [
  {
    headline: 'Protect what matters with intelligent technology',
    subheadline: "Nigeria's Certified Smart Security Specialists",
    description: 'Professional installation of smart home automation, biometric access control, remote gate systems, CCTV, and solar power — backed by a signed 24-hour response SLA.',
    backgroundImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
    ctaPrimaryLabel: 'GET A FREE QUOTE →',
    ctaPrimaryHref: '/consultation',
    ctaSecondaryLabel: 'HOW IT WORKS',
    ctaSecondaryHref: '/how-it-works',
    badge: "Nigeria's Certified Smart Security Specialists",
    stats: [
      { value: '500+', label: 'Installations completed across Lagos & Abuja' },
      { value: '24 hr', label: 'Guaranteed response SLA on all maintenance contracts' },
      { value: '2 yr', label: "Installation warranty — industry's strongest guarantee" },
    ],
    order: 1,
    isActive: true,
  },
  {
    headline: 'Never lose power to your security systems',
    subheadline: 'Solar Power Solutions',
    description: 'Keep every access point, camera, and gate fully operational — even during extended grid outages. Tier 1 panels, LiFePO4 batteries, hybrid inverters.',
    backgroundImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&q=80',
    ctaPrimaryLabel: 'GET A SOLAR QUOTE →',
    ctaPrimaryHref: '/products/solar-power-system',
    ctaSecondaryLabel: 'LEARN MORE',
    ctaSecondaryHref: '/solar',
    badge: 'Solar Power Solutions',
    stats: [
      { value: '3–20kW', label: 'System sizes available' },
      { value: '36 hr', label: 'Maximum backup duration' },
      { value: '₦600K', label: 'Est. annual savings (20kW)' },
    ],
    order: 2,
    isActive: true,
  },
  {
    headline: 'Biometric access control for every property',
    subheadline: 'Access Control Systems',
    description: 'Fingerprint, facial recognition, and card-based access systems for estates, offices, and residences. EEE-qualified installation with 2-year warranty.',
    backgroundImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600&q=80',
    ctaPrimaryLabel: 'VIEW PRODUCTS →',
    ctaPrimaryHref: '/products/biometric-access-control',
    ctaSecondaryLabel: 'BOOK CONSULTATION',
    ctaSecondaryHref: '/consultation',
    badge: 'Access Control Systems',
    stats: [
      { value: '10,000', label: 'Max user capacity per system' },
      { value: '0.5s', label: 'Recognition speed' },
      { value: 'IP65', label: 'Outdoor rated' },
    ],
    order: 3,
    isActive: true,
  },
];

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | HeroSlide | null>(null);
  const [form, setForm] = useState<Omit<HeroSlide, 'id'>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [seeding, setSeeding] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await heroSlidesApi.getAll();
    data.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setSlides(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setModal('new'); };
  const openEdit = (s: HeroSlide) => {
    setForm({ headline: s.headline, subheadline: s.subheadline, description: s.description, backgroundImage: s.backgroundImage, ctaPrimaryLabel: s.ctaPrimaryLabel, ctaPrimaryHref: s.ctaPrimaryHref, ctaSecondaryLabel: s.ctaSecondaryLabel, ctaSecondaryHref: s.ctaSecondaryHref, badge: s.badge, stats: s.stats, order: s.order, isActive: s.isActive });
    setModal(s);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') { await heroSlidesApi.create(form); showToast('Slide created!', 'success'); }
      else if (modal && typeof modal === 'object' && modal.id) { await heroSlidesApi.update(modal.id, form); showToast('Slide updated!', 'success'); }
      setModal(null); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await heroSlidesApi.delete(deleteTarget.id);
    showToast('Slide deleted', 'success');
    setDeleteTarget(null);
    load();
  };

  const handleToggle = async (s: HeroSlide) => {
    if (!s.id) return;
    await heroSlidesApi.update(s.id, { isActive: !s.isActive });
    showToast(`Slide ${s.isActive ? 'deactivated' : 'activated'}`, 'success');
    load();
  };

  const handleSeed = async () => {
    setSeeding(true);
    for (const slide of DEFAULT_SLIDES) await heroSlidesApi.create(slide);
    showToast('3 default slides seeded!', 'success');
    setSeeding(false);
    load();
  };

  const set = (key: keyof typeof form, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Hero Slides</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>The homepage hero is a slider — each slide is shown in order. Active slides rotate automatically.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {slides.length === 0 && <button className="btn btn-ghost btn-sm" onClick={handleSeed} disabled={seeding}>{seeding ? 'Seeding...' : '⬇ Seed 3 Defaults'}</button>}
          <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Slide</button>
        </div>
      </div>

      {/* Slide preview strip */}
      {slides.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {slides.map((s, i) => (
            <div key={s.id} style={{ flexShrink: 0, width: 200, borderRadius: 6, overflow: 'hidden', border: `2px solid ${s.isActive ? 'var(--gold)' : 'var(--border)'}`, cursor: 'pointer', opacity: s.isActive ? 1 : 0.5 }} onClick={() => openEdit(s)}>
              <div style={{ height: 90, background: '#111', backgroundImage: `url(${s.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
                <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8 }}>
                  <div style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 700, marginBottom: 2 }}>SLIDE {i + 1}</div>
                  <div style={{ fontSize: 10, color: '#fff', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.headline}</div>
                </div>
              </div>
              <div style={{ padding: '6px 8px', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: s.isActive ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{s.isActive ? 'ACTIVE' : 'HIDDEN'}</span>
                <span style={{ fontSize: 9, color: 'var(--muted)' }}>Order {s.order}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : slides.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No slides yet. Click "Seed 3 Defaults" to get started.</div>
        ) : (
          <table className="adm-table">
            <thead><tr><th>#</th><th>Slide</th><th>Badge</th><th>CTAs</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {slides.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--muted)', fontWeight: 700 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {s.backgroundImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.backgroundImage} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12 }}>{s.headline}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>{s.description?.slice(0, 60)}...</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{s.badge}</td>
                  <td style={{ fontSize: 11 }}>
                    <div style={{ color: 'var(--gold)' }}>{s.ctaPrimaryLabel}</div>
                    <div style={{ color: 'var(--muted)' }}>{s.ctaSecondaryLabel}</div>
                  </td>
                  <td>
                    <button onClick={() => handleToggle(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: s.isActive ? 'var(--green)' : 'var(--subtle)' }}>
                      {s.isActive ? '●' : '○'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ padding: 24, maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>{modal === 'new' ? 'New Hero Slide' : 'Edit Slide'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label className="form-label">Badge Text (small label above headline)</label>
                  <input className="adm-input" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="Nigeria's Certified Smart Security Specialists" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Headline *</label>
                  <textarea className="adm-input" required rows={2} value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="Protect what matters with intelligent technology" />
                </div>
                <div className="form-group form-full">
                  <label className="form-label">Description</label>
                  <textarea className="adm-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
                </div>
                <div className="form-group form-full">
                  <ImageUpload
                    value={form.backgroundImage}
                    onChange={v => set('backgroundImage', v)}
                    folder="hero"
                    label="Background Image"
                    height={120}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary CTA Label</label>
                  <input className="adm-input" value={form.ctaPrimaryLabel} onChange={e => set('ctaPrimaryLabel', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary CTA Link</label>
                  <input className="adm-input" value={form.ctaPrimaryHref} onChange={e => set('ctaPrimaryHref', e.target.value)} placeholder="/consultation" />
                </div>
                <div className="form-group">
                  <label className="form-label">Secondary CTA Label</label>
                  <input className="adm-input" value={form.ctaSecondaryLabel} onChange={e => set('ctaSecondaryLabel', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Secondary CTA Link</label>
                  <input className="adm-input" value={form.ctaSecondaryHref} onChange={e => set('ctaSecondaryHref', e.target.value)} placeholder="/how-it-works" />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="adm-input" type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)', marginTop: 20 }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                    Active (shown in slider)
                  </label>
                </div>
              </div>

              {/* Stats */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Stats (up to 3)</div>
                {form.stats.map((stat, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input className="adm-input" value={stat.value} onChange={e => { const s = [...form.stats]; s[i] = { ...s[i], value: e.target.value }; set('stats', s); }} placeholder="500+" />
                    <input className="adm-input" value={stat.label} onChange={e => { const s = [...form.stats]; s[i] = { ...s[i], label: e.target.value }; set('stats', s); }} placeholder="Installations completed" />
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => set('stats', form.stats.filter((_, j) => j !== i))}>×</button>
                  </div>
                ))}
                {form.stats.length < 3 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('stats', [...form.stats, { value: '', label: '' }])}>+ Add Stat</button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Slide'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal message={`Delete this slide? This cannot be undone.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
