'use client';

import { useState } from 'react';
import { Save, Building2, Mail, Phone, MapPin, CheckCircle } from 'lucide-react';

export default function SchoolSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const handleSave = async () => {
    setSaving(true);
    const r = await fetch('/api/schools/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (r.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const fields: Array<{ key: keyof typeof form; label: string; icon: typeof Building2; type: string }> = [
    { key: 'name',    label: 'School Name',    icon: Building2, type: 'text' },
    { key: 'email',   label: 'Contact Email',  icon: Mail,      type: 'email' },
    { key: 'phone',   label: 'Phone',          icon: Phone,     type: 'tel' },
    { key: 'address', label: 'Address',        icon: MapPin,    type: 'text' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
        <Building2 className="w-6 h-6 text-brand-primary" /> SCHOOL SETTINGS
      </h1>

      <section className="card p-6 space-y-4">
        <h2 className="font-display font-bold text-sm tracking-widest uppercase text-text-secondary">SCHOOL INFORMATION</h2>

        {fields.map(({ key, label, icon: Icon, type }) => (
          <div key={key}>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">{label}</label>
            <div className="relative">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="input pl-11"
                placeholder={label}
              />
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary btn-block flex items-center justify-center gap-2 mt-2"
        >
          {saved
            ? <><CheckCircle className="w-4 h-4" /> SAVED!</>
            : <><Save className="w-4 h-4" /> {saving ? 'SAVING…' : 'SAVE CHANGES'}</>
          }
        </button>
      </section>
    </div>
  );
}
