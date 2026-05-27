'use client';

import { useEffect, useState } from 'react';
import { sectionsApi } from '@/lib/firestore';
import { useToast } from '@/components/Toast';
import TagInput from '@/components/TagInput';

type SectionKey = 'whyUs' | 'howItWorks' | 'solar' | 'about';

const SECTION_LABELS: Record<SectionKey, string> = {
  whyUs: 'Why Us Section',
  howItWorks: 'How It Works Section',
  solar: 'Solar Section',
  about: 'About Section (Homepage)',
};

const DEFAULT_WHY_US = {
  headline: 'Why choose Eshmart SmartTech?',
  subheadline: 'Why Us',
  description: 'We take pride in delivering high-quality, future-proof smart security and automation solutions.',
  items: [
    { icon: '✦', title: 'EEE-qualified engineers', desc: 'Every installation is designed and overseen by a certified electrical engineer — not just a technician.' },
    { icon: '⚙', title: 'Premium technology', desc: 'We partner with leading manufacturers to bring you the best access control, CCTV, solar, and automation systems.' },
    { icon: '🛡', title: 'Long-term protection', desc: 'Our systems are designed to deter, detect, and respond — with a 2-year installation warranty on every job.' },
    { icon: '◎', title: 'End-to-end service', desc: 'From consultation to installation and maintenance, we provide full-service solutions tailored to your property.' },
    { icon: '₦', title: 'Transparent pricing', desc: 'Detailed scopes of work, fixed quotes, and flexible payment plans — no hidden costs, ever.' },
    { icon: '📊', title: 'Proven track record', desc: '500+ successful installations across Lagos and Abuja, serving residential estates, commercial offices, and developers.' },
  ],
};

const DEFAULT_HOW_IT_WORKS = {
  headline: 'From enquiry to installation in 4 steps',
  subheadline: 'How It Works',
  description: 'A clear, professional process — no guesswork, no surprises.',
  steps: [
    { n: 1, title: 'Free consultation', desc: 'Book a 45-minute site visit. We assess your property, understand your needs, and document any existing system gaps — at no cost.' },
    { n: 2, title: 'Custom proposal', desc: 'We deliver a detailed scope of work, product specifications, pricing, and installation timeline within 5 business days.' },
    { n: 3, title: 'Professional installation', desc: 'Our EEE-qualified team installs to international standards. Every job is commissioned, tested, and documented before handover.' },
    { n: 4, title: 'Ongoing support', desc: 'Sign a maintenance retainer for 24-hour emergency response, quarterly preventive visits, and parts coverage for complete peace of mind.' },
  ],
};

const DEFAULT_SOLAR = {
  headline: 'Never lose power to your security systems',
  subheadline: 'Solar Power Solutions',
  description: 'Keep every access point, camera, and gate fully operational — even during extended grid outages.',
  features: [
    { icon: '☀', title: 'Solar panels & inverter systems', desc: 'Tier 1 monocrystalline panels paired with hybrid inverters. Grid-tied, off-grid, and hybrid configurations available.' },
    { icon: '⚡', title: 'Battery storage solutions', desc: 'Lithium-iron phosphate battery banks ensuring your security systems, lighting, and essential loads stay powered through the night.' },
    { icon: '🛡', title: 'Security system solar priority', desc: 'Dedicated solar circuits that prioritise power to your gate motors, CCTV, and access control systems — always the last to go offline.' },
    { icon: '📡', title: 'Remote monitoring & management', desc: 'Real-time solar generation, battery state, and consumption visible from the Eshmart SmartTech app.' },
  ],
};

export default function SectionsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('whyUs');
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const load = async (key: SectionKey) => {
    setLoading(true);
    const result = await sectionsApi.get(key);
    if (result?.data) {
      setData(result.data);
    } else {
      // Load defaults
      const defaults: Record<SectionKey, Record<string, unknown>> = {
        whyUs: DEFAULT_WHY_US as unknown as Record<string, unknown>,
        howItWorks: DEFAULT_HOW_IT_WORKS as unknown as Record<string, unknown>,
        solar: DEFAULT_SOLAR as unknown as Record<string, unknown>,
        about: {},
      };
      setData(defaults[key]);
    }
    setLoading(false);
  };

  useEffect(() => { load(activeSection); }, [activeSection]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await sectionsApi.save(activeSection, data);
      showToast('Section saved!', 'success');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const setField = (key: string, val: unknown) => setData(d => ({ ...d, [key]: val }));

  const renderWhyUs = () => {
    const d = data as typeof DEFAULT_WHY_US;
    return (
      <div className="form-grid">
        <div className="form-group form-full">
          <label className="form-label">Section Headline</label>
          <input className="adm-input" value={d.headline || ''} onChange={e => setField('headline', e.target.value)} />
        </div>
        <div className="form-group form-full">
          <label className="form-label">Description</label>
          <textarea className="adm-input" rows={2} value={d.description || ''} onChange={e => setField('description', e.target.value)} />
        </div>
        <div className="form-group form-full">
          <label className="form-label" style={{ marginBottom: 10 }}>Items (6 cards)</label>
          {(d.items || []).map((item: { icon: string; title: string; desc: string }, i: number) => (
            <div key={i} style={{ background: 'var(--bg3)', borderRadius: 5, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 10, marginBottom: 8 }}>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <input className="adm-input" value={item.icon} onChange={e => {
                    const items = [...(d.items || [])];
                    items[i] = { ...items[i], icon: e.target.value };
                    setField('items', items);
                  }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="adm-input" value={item.title} onChange={e => {
                    const items = [...(d.items || [])];
                    items[i] = { ...items[i], title: e.target.value };
                    setField('items', items);
                  }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="adm-input" rows={2} value={item.desc} onChange={e => {
                  const items = [...(d.items || [])];
                  items[i] = { ...items[i], desc: e.target.value };
                  setField('items', items);
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHowItWorks = () => {
    const d = data as typeof DEFAULT_HOW_IT_WORKS;
    return (
      <div className="form-grid">
        <div className="form-group form-full">
          <label className="form-label">Section Headline</label>
          <input className="adm-input" value={d.headline || ''} onChange={e => setField('headline', e.target.value)} />
        </div>
        <div className="form-group form-full">
          <label className="form-label">Description</label>
          <input className="adm-input" value={d.description || ''} onChange={e => setField('description', e.target.value)} />
        </div>
        <div className="form-group form-full">
          <label className="form-label" style={{ marginBottom: 10 }}>Steps (4 steps)</label>
          {(d.steps || []).map((step: { n: number; title: string; desc: string }, i: number) => (
            <div key={i} style={{ background: 'var(--bg3)', borderRadius: 5, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0 }}>{step.n}</div>
                <input className="adm-input" value={step.title} onChange={e => {
                  const steps = [...(d.steps || [])];
                  steps[i] = { ...steps[i], title: e.target.value };
                  setField('steps', steps);
                }} placeholder="Step title" />
              </div>
              <textarea className="adm-input" rows={2} value={step.desc} onChange={e => {
                const steps = [...(d.steps || [])];
                steps[i] = { ...steps[i], desc: e.target.value };
                setField('steps', steps);
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSolar = () => {
    const d = data as typeof DEFAULT_SOLAR;
    return (
      <div className="form-grid">
        <div className="form-group form-full">
          <label className="form-label">Section Headline</label>
          <input className="adm-input" value={d.headline || ''} onChange={e => setField('headline', e.target.value)} />
        </div>
        <div className="form-group form-full">
          <label className="form-label">Description</label>
          <textarea className="adm-input" rows={2} value={d.description || ''} onChange={e => setField('description', e.target.value)} />
        </div>
        <div className="form-group form-full">
          <label className="form-label" style={{ marginBottom: 10 }}>Features (4 items)</label>
          {(d.features || []).map((f: { icon: string; title: string; desc: string }, i: number) => (
            <div key={i} style={{ background: 'var(--bg3)', borderRadius: 5, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 10, marginBottom: 8 }}>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <input className="adm-input" value={f.icon} onChange={e => {
                    const features = [...(d.features || [])];
                    features[i] = { ...features[i], icon: e.target.value };
                    setField('features', features);
                  }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="adm-input" value={f.title} onChange={e => {
                    const features = [...(d.features || [])];
                    features[i] = { ...features[i], title: e.target.value };
                    setField('features', features);
                  }} />
                </div>
              </div>
              <textarea className="adm-input" rows={2} value={f.desc} onChange={e => {
                const features = [...(d.features || [])];
                features[i] = { ...features[i], desc: e.target.value };
                setField('features', features);
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Page Sections</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Section'}</button>
      </div>

      <div className="tab-bar">
        {(Object.keys(SECTION_LABELS) as SectionKey[]).map(key => (
          <button key={key} className={`tab-btn ${activeSection === key ? 'active' : ''}`} onClick={() => setActiveSection(key)}>
            {SECTION_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 22 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
        ) : (
          <>
            {activeSection === 'whyUs' && renderWhyUs()}
            {activeSection === 'howItWorks' && renderHowItWorks()}
            {activeSection === 'solar' && renderSolar()}
            {activeSection === 'about' && (
              <div style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>
                About page content is managed in the <a href="/dashboard/about" style={{ color: 'var(--gold)' }}>About Content</a> section.
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Section'}</button>
      </div>
    </div>
  );
}
