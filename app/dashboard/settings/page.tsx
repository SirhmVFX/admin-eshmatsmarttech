'use client';

import { useEffect, useState } from 'react';
import { siteSettingsApi, SiteSettings } from '@/lib/firestore';
import { useToast } from '@/components/Toast';

const DEFAULT: Omit<SiteSettings, 'id'> = {
  siteName: 'Eshmart SmartTech',
  tagline: "Nigeria's Certified Smart Security Specialists",
  email: 'info@eshmartsmarttech.com',
  phone1: '+234 (0) 801 000 0001',
  phone2: '+234 (0) 801 000 0002',
  whatsapp: '+234 (0) 801 000 0001',
  address: 'Lagos & Abuja, Nigeria',
  instagram: '',
  twitter: '',
  tiktok: '',
  linkedin: '',
  youtube: '',
  promoBarText: 'Free site assessment for all new clients — Book now →',
  promoBarEnabled: true,
  freeShippingThreshold: 500000,
  defaultShippingCost: 5000,
  returnDays: 14,
  currency: 'NGN',
  currencySymbol: '₦',
  metaTitle: 'Eshmart SmartTech — Nigeria\'s Certified Smart Security Specialists',
  metaDescription: 'Professional installation of biometric access control, CCTV, remote gate systems, smart home automation, and solar power across Lagos & Abuja.',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Omit<SiteSettings, 'id'>>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'brand' | 'contact' | 'social' | 'commerce' | 'seo'>('brand');
  const { showToast } = useToast();

  useEffect(() => {
    siteSettingsApi.get().then(s => {
      if (s) setSettings({ siteName: s.siteName, tagline: s.tagline, email: s.email, phone1: s.phone1, phone2: s.phone2, whatsapp: s.whatsapp, address: s.address, instagram: s.instagram, twitter: s.twitter, tiktok: s.tiktok, linkedin: s.linkedin, youtube: s.youtube, promoBarText: s.promoBarText, promoBarEnabled: s.promoBarEnabled, freeShippingThreshold: s.freeShippingThreshold, defaultShippingCost: s.defaultShippingCost, returnDays: s.returnDays, currency: s.currency, currencySymbol: s.currencySymbol, metaTitle: s.metaTitle, metaDescription: s.metaDescription });
      setLoading(false);
    });
  }, []);

  const set = (key: keyof typeof settings, val: unknown) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await siteSettingsApi.save(settings);
      showToast('Settings saved!', 'success');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)', fontSize: 13 }}>Loading...</div>;

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Site Settings</h1>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>

      <div className="tab-bar">
        {(['brand', 'contact', 'social', 'commerce', 'seo'] as const).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 22 }}>
        {tab === 'brand' && (
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Site Name</label>
              <input className="adm-input" value={settings.siteName} onChange={e => set('siteName', e.target.value)} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Tagline</label>
              <input className="adm-input" value={settings.tagline} onChange={e => set('tagline', e.target.value)} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Promo Bar Text</label>
              <input className="adm-input" value={settings.promoBarText} onChange={e => set('promoBarText', e.target.value)} />
            </div>
            <div className="form-group form-full">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--fg2)' }}>
                <input type="checkbox" checked={settings.promoBarEnabled} onChange={e => set('promoBarEnabled', e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                Show promo bar on site
              </label>
            </div>
          </div>
        )}

        {tab === 'contact' && (
          <div className="form-grid">
            {[
              { key: 'email', label: 'Email Address', type: 'email' },
              { key: 'phone1', label: 'Phone 1 (Lagos)', type: 'tel' },
              { key: 'phone2', label: 'Phone 2 (Abuja)', type: 'tel' },
              { key: 'whatsapp', label: 'WhatsApp Number', type: 'tel' },
              { key: 'address', label: 'Address', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                <input className="adm-input" type={type} value={settings[key as keyof typeof settings] as string} onChange={e => set(key as keyof typeof settings, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {tab === 'social' && (
          <div className="form-grid">
            {[
              { key: 'instagram', label: 'Instagram URL' },
              { key: 'twitter', label: 'Twitter / X URL' },
              { key: 'tiktok', label: 'TikTok URL' },
              { key: 'linkedin', label: 'LinkedIn URL' },
              { key: 'youtube', label: 'YouTube URL' },
            ].map(({ key, label }) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                <input className="adm-input" type="url" value={settings[key as keyof typeof settings] as string} onChange={e => set(key as keyof typeof settings, e.target.value)} placeholder="https://..." />
              </div>
            ))}
          </div>
        )}

        {tab === 'commerce' && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Currency Code</label>
              <input className="adm-input" value={settings.currency} onChange={e => set('currency', e.target.value)} placeholder="NGN" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input className="adm-input" value={settings.currencySymbol} onChange={e => set('currencySymbol', e.target.value)} placeholder="₦" />
            </div>
            <div className="form-group">
              <label className="form-label">Default Shipping Cost (₦)</label>
              <input className="adm-input" type="number" min={0} value={settings.defaultShippingCost} onChange={e => set('defaultShippingCost', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Free Shipping Threshold (₦)</label>
              <input className="adm-input" type="number" min={0} value={settings.freeShippingThreshold} onChange={e => set('freeShippingThreshold', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Return Policy (days)</label>
              <input className="adm-input" type="number" min={0} value={settings.returnDays} onChange={e => set('returnDays', Number(e.target.value))} />
            </div>
          </div>
        )}

        {tab === 'seo' && (
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Default Meta Title</label>
              <input className="adm-input" value={settings.metaTitle} onChange={e => set('metaTitle', e.target.value)} />
              <div style={{ fontSize: 10, color: settings.metaTitle.length > 60 ? 'var(--red)' : 'var(--muted)', marginTop: 4 }}>
                {settings.metaTitle.length}/60 characters {settings.metaTitle.length > 60 ? '(too long)' : '(recommended)'}
              </div>
            </div>
            <div className="form-group form-full">
              <label className="form-label">Default Meta Description</label>
              <textarea className="adm-input" rows={3} value={settings.metaDescription} onChange={e => set('metaDescription', e.target.value)} />
              <div style={{ fontSize: 10, color: settings.metaDescription.length > 160 ? 'var(--red)' : 'var(--muted)', marginTop: 4 }}>
                {settings.metaDescription.length}/160 characters {settings.metaDescription.length > 160 ? '(too long)' : '(recommended)'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>
    </div>
  );
}
