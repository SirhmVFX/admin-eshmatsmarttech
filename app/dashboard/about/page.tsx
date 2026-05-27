'use client';

import { useEffect, useState } from 'react';
import { aboutApi, AboutContent } from '@/lib/firestore';
import { useToast } from '@/components/Toast';

const DEFAULT: Omit<AboutContent, 'id'> = {
  heroHeadline: 'Your trusted smart security partner',
  heroSubheadline: 'About Us',
  storyTitle: 'Built on a simple belief',
  storyBody1: 'Eshmart SmartTech was founded on a simple belief: that Nigerian homes, estates, and businesses deserve the same quality of smart security that is standard in developed markets — installed correctly, documented properly, and backed by real accountability.',
  storyBody2: 'We saw too many properties with systems that were under-specified, poorly installed, and abandoned by vendors who disappeared after payment. We built Eshmart to be different.',
  storyBody3: 'Every installation is led by an EEE-qualified engineer. Every job comes with as-built drawings, warranty certificates, and a maintenance log. Every client gets a signed 24-hour response SLA — not a promise, a contract.',
  founderName: 'Emeka Okonkwo',
  founderRole: 'Founder & Lead Engineer, Eshmart SmartTech',
  stats: [
    { value: '500+', label: 'Installations completed' },
    { value: '15+', label: 'Years combined experience' },
    { value: '2', label: 'Offices — Lagos & Abuja' },
    { value: '98%', label: 'Client satisfaction rate' },
  ],
};

export default function AboutPage() {
  const [form, setForm] = useState<Omit<AboutContent, 'id'>>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    aboutApi.get().then(a => {
      if (a) setForm({ heroHeadline: a.heroHeadline, heroSubheadline: a.heroSubheadline, storyTitle: a.storyTitle, storyBody1: a.storyBody1, storyBody2: a.storyBody2, storyBody3: a.storyBody3, founderName: a.founderName, founderRole: a.founderRole, stats: a.stats });
      setLoading(false);
    });
  }, []);

  const set = (key: keyof typeof form, val: unknown) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await aboutApi.save(form);
      showToast('About content saved!', 'success');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>Loading...</div>;

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">About Page Content</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Hero Section</div>
        <div className="form-grid" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">Hero Headline</label>
            <input className="adm-input" value={form.heroHeadline} onChange={e => set('heroHeadline', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Hero Subheadline (badge)</label>
            <input className="adm-input" value={form.heroSubheadline} onChange={e => set('heroSubheadline', e.target.value)} />
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Our Story</div>
        <div className="form-grid" style={{ marginBottom: 24 }}>
          <div className="form-group form-full">
            <label className="form-label">Story Title</label>
            <input className="adm-input" value={form.storyTitle} onChange={e => set('storyTitle', e.target.value)} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Story Paragraph 1</label>
            <textarea className="adm-input" rows={3} value={form.storyBody1} onChange={e => set('storyBody1', e.target.value)} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Story Paragraph 2</label>
            <textarea className="adm-input" rows={3} value={form.storyBody2} onChange={e => set('storyBody2', e.target.value)} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Story Paragraph 3</label>
            <textarea className="adm-input" rows={3} value={form.storyBody3} onChange={e => set('storyBody3', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Founder Name</label>
            <input className="adm-input" value={form.founderName} onChange={e => set('founderName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Founder Role</label>
            <input className="adm-input" value={form.founderRole} onChange={e => set('founderRole', e.target.value)} />
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Stats (up to 4)</div>
        {form.stats.map((stat, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <input className="adm-input" value={stat.value} onChange={e => {
              const stats = [...form.stats];
              stats[i] = { ...stats[i], value: e.target.value };
              set('stats', stats);
            }} placeholder="500+" />
            <input className="adm-input" value={stat.label} onChange={e => {
              const stats = [...form.stats];
              stats[i] = { ...stats[i], label: e.target.value };
              set('stats', stats);
            }} placeholder="Installations completed" />
            <button type="button" className="btn btn-danger btn-sm" onClick={() => set('stats', form.stats.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        {form.stats.length < 4 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('stats', [...form.stats, { value: '', label: '' }])}>
            + Add Stat
          </button>
        )}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save About Content'}</button>
      </div>
    </div>
  );
}
