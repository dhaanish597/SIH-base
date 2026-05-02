'use client';

import { useEffect, useState } from 'react';
import { Building2, Search, Plus, X, Users } from 'lucide-react';
import CredentialTicket from '../../../components/ui/CredentialTicket';

type School = {
  id: string; name: string; schoolCode: string; address: string | null;
  email: string; isActive: boolean; subscriptionTier: string | null;
  createdAt: string; _count: { users: number };
};
type NewCredential = { schoolCode: string; adminEmail: string; tempPassword: string; schoolName: string };

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [credential, setCredential] = useState<NewCredential | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subscriptionTier: 'FREE' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const r = await fetch('/api/admin/schools', { credentials: 'include' });
    if (r.ok) setSchools(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = schools.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
           s.schoolCode.toLowerCase().includes(search.toLowerCase()) ||
           s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const createSchool = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setSubmitting(true); setError('');
    const r = await fetch('/api/admin/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    const data = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(data.error || 'Failed to create school.'); return; }
    setCredential({ schoolCode: data.school.schoolCode, adminEmail: data.admin.email, tempPassword: data.admin.tempPassword, schoolName: data.school.name });
    setShowModal(false);
    setForm({ name: '', email: '', subscriptionTier: 'FREE' });
    await load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-violet-400" />
        <h1 className="text-2xl font-bold text-white">Schools</h1>
        <span className="text-sm text-gray-400">{schools.length} total</span>
        <button
          onClick={() => { setShowModal(true); setCredential(null); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New School
        </button>
      </header>

      {credential && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-3">
          <p className="text-sm font-bold text-emerald-400">✓ School &quot;{credential.schoolName}&quot; created! Share these credentials with the school admin:</p>
          <CredentialTicket
            title="School Admin Login"
            credentials={[
              { label: 'School Code', value: credential.schoolCode },
              { label: 'Email', value: credential.adminEmail },
              { label: 'Password', value: credential.tempPassword },
            ]}
            note="This password is shown only once. Ask the admin to change it after first login."
          />
          <button onClick={() => setCredential(null)} className="text-xs text-gray-400 hover:text-gray-200 underline">Dismiss</button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text" placeholder="Search by name, code or email…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {['School', 'Code', 'Email', 'Tier', 'Users', 'Status', 'Joined'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-white/10 rounded animate-pulse" /></td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No schools found.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3 font-mono text-gray-400 text-xs">{s.schoolCode}</td>
                <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[140px]">{s.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium">{s.subscriptionTier || 'FREE'}</span>
                </td>
                <td className="px-4 py-3 text-gray-400"><div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{s._count?.users ?? 0}</div></td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create New School</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">School Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Greenfield Academy"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Admin Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@school.edu"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Subscription Tier</label>
                <select value={form.subscriptionTier} onChange={(e) => setForm((f) => ({ ...f, subscriptionTier: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="FREE">Free</option>
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={createSchool} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Creating…' : 'Create School'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
