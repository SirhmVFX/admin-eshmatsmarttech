'use client';

import { useEffect, useState } from 'react';
import { themeApi, ThemeSettings } from '@/lib/firestore';
import { useToast } from '@/components/Toast';

const TEMPLATES = [
  {
    id: 'eshmart-dark',
    name: 'Eshmart Dark',
    desc: 'Current — dark bg, gold accent, sharp corners',
    preview: { bg: '#0d1117', accent: '#c9a84c', card: '#111827', text: '#ffffff' },
    settings: { primaryColor: '#c9a84c', primaryHover: '#b8963e', bgDark: '#0d1117', bgLight: '#f5f5f0', bgCard: '#111827', fontFamily: 'Geist, sans-serif', borderRadius: '3px' },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    desc: 'Deep navy with electric blue accents',
    preview: { bg: '#0f172a', accent: '#3b82f6', card: '#1e293b', text: '#f1f5f9' },
    settings: { primaryColor: '#3b82f6', primaryHover: '#2563eb', bgDark: '#0f172a', bgLight: '#f8fafc', bgCard: '#1e293b', fontFamily: 'Inter, sans-serif', borderRadius: '6px' },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    desc: 'Deep forest tones with emerald highlights',
    preview: { bg: '#0a1628', accent: '#10b981', card: '#0f2027', text: '#ecfdf5' },
    settings: { primaryColor: '#10b981', primaryHover: '#059669', bgDark: '#0a1628', bgLight: '#f0fdf4', bgCard: '#0f2027', fontFamily: 'Geist, sans-serif', borderRadius: '4px' },
  },
  {
    id: 'crimson-luxury',
    name: 'Crimson Luxury',
    desc: 'Rich dark background with crimson red accents',
    preview: { bg: '#0c0a0a', accent: '#dc2626', card: '#1a0f0f', text: '#fef2f2' },
    settings: { primaryColor: '#dc2626', primaryHover: '#b91c1c', bgDark: '#0c0a0a', bgLight: '#fef2f2', bgCard: '#1a0f0f', fontFamily: 'Geist, sans-serif', borderRadius: '2px' },
  },
  {
    id: 'purple-tech',
    name: 'Purple Tech',
    desc: 'Modern dark with vibrant purple accents',
    preview: { bg: '#0d0d1a', accent: '#a855f7', card: '#13132b', text: '#faf5ff' },
    settings: { primaryColor: '#a855f7', primaryHover: '#9333ea', bgDark: '#0d0d1a', bgLight: '#faf5ff', bgCard: '#13132b', fontFamily: 'Inter, sans-serif', borderRadius: '8px' },
  },
  {
    id: 'clean-white',
    name: 'Clean White',
    desc: 'Light minimal design with dark text',
    preview: { bg: '#ffffff', accent: '#1a1a1a', card: '#f5f5f5', text: '#111111' },
    settings: { primaryColor: '#1a1a1a', primaryHover: '#333333', bgDark: '#111111', bgLight: '#ffffff', bgCard: '#f5f5f5', fontFamily: 'Geist, sans-serif', borderRadius: '4px' },
  },
];

const DEFAULT_THEME: Omit<ThemeSettings, 'id'> = {
  activeTemplate: 'eshmart-dark',
  primaryColor: '#c9a84c',
  primaryHover: '#b8963e',
  bgDark: '#0d1117',
  bgLight: '#f5f5f0',
  bgCard: '#111827',
  fontFamily: 'Geist, sans-serif',
  borderRadius: '3px',
};

export default function ThemePage() {
  const [theme, setTheme] = useState<Omit<ThemeSettings, 'id'>>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    themeApi.get().then(t => {
      if (t) setTheme({ activeTemplate: t.activeTemplate, primaryColor: t.primaryColor, primaryHover: t.primaryHover, bgDark: t.bgDark, bgLight: t.bgLight, bgCard: t.bgCard, fontFamily: t.fontFamily, borderRadius: t.borderRadius });
      setLoading(false);
    });
  }, []);

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTheme(prev => ({ ...prev, activeTemplate: tpl.id, ...tpl.settings }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await themeApi.save(theme);
      showToast('Theme saved! Refresh the storefront to see changes.', 'success');
    } catch { showToast('Failed to save theme', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>Loading...</div>;

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Theme & Colors</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>

      {/* Template picker */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Choose a Template
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {TEMPLATES.map(tpl => (
            <div key={tpl.id} className={`template-card ${theme.activeTemplate === tpl.id ? 'selected' : ''}`}
              onClick={() => applyTemplate(tpl)}>
              {/* Preview */}
              <div style={{ height: 100, background: tpl.preview.bg, padding: 12, position: 'relative' }}>
                <div style={{ width: '60%', height: 8, background: tpl.preview.accent, borderRadius: 2, marginBottom: 6 }} />
                <div style={{ width: '80%', height: 5, background: tpl.preview.text, opacity: 0.3, borderRadius: 2, marginBottom: 4 }} />
                <div style={{ width: '70%', height: 5, background: tpl.preview.text, opacity: 0.2, borderRadius: 2, marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ background: tpl.preview.card, border: `1px solid ${tpl.preview.accent}30`, borderRadius: 4, padding: '4px 8px', fontSize: 8, color: tpl.preview.accent, fontWeight: 700 }}>BUTTON</div>
                  <div style={{ background: 'transparent', border: `1px solid ${tpl.preview.text}30`, borderRadius: 4, padding: '4px 8px', fontSize: 8, color: tpl.preview.text, opacity: 0.6 }}>OUTLINE</div>
                </div>
                {theme.activeTemplate === tpl.id && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, background: tpl.preview.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#000', fontWeight: 700 }}>✓</div>
                )}
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg3)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{tpl.name}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{tpl.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom color overrides */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>
          Custom Color Overrides
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { key: 'primaryColor', label: 'Primary / Accent Color' },
            { key: 'primaryHover', label: 'Primary Hover Color' },
            { key: 'bgDark', label: 'Dark Background' },
            { key: 'bgLight', label: 'Light Background' },
            { key: 'bgCard', label: 'Card Background' },
          ].map(({ key, label }) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={theme[key as keyof typeof theme] as string}
                  onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                  style={{ width: 36, height: 36, border: '1px solid var(--border2)', borderRadius: 4, cursor: 'pointer', background: 'none', padding: 2 }} />
                <input className="adm-input" value={theme[key as keyof typeof theme] as string}
                  onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                  style={{ fontFamily: 'monospace', fontSize: 12 }} />
              </div>
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Border Radius</label>
            <input className="adm-input" value={theme.borderRadius}
              onChange={e => setTheme(t => ({ ...t, borderRadius: e.target.value }))}
              placeholder="3px" />
          </div>
          <div className="form-group">
            <label className="form-label">Font Family</label>
            <select className="adm-input" value={theme.fontFamily} onChange={e => setTheme(t => ({ ...t, fontFamily: e.target.value }))}>
              <option value="Geist, sans-serif">Geist (Default)</option>
              <option value="Inter, sans-serif">Inter</option>
              <option value="'DM Sans', sans-serif">DM Sans</option>
              <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
              <option value="'Outfit', sans-serif">Outfit</option>
              <option value="Georgia, serif">Georgia (Serif)</option>
            </select>
          </div>
        </div>

        {/* Live preview */}
        <div style={{ marginTop: 24, padding: 20, borderRadius: 8, background: theme.bgDark, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Live Preview</div>
          <div style={{ fontFamily: theme.fontFamily }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Smart Security for Homes</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>Professional installation backed by a signed 24-hour response SLA.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ background: theme.primaryColor, color: '#000', border: 'none', padding: '9px 18px', borderRadius: theme.borderRadius, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: theme.fontFamily }}>
                GET A QUOTE →
              </button>
              <button style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '9px 18px', borderRadius: theme.borderRadius, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: theme.fontFamily }}>
                HOW IT WORKS
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Theme Settings'}
        </button>
      </div>
    </div>
  );
}
