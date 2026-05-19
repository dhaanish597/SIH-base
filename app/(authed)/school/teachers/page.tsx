'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { GraduationCap, Search, Plus, X } from 'lucide-react';
import CredentialTicket from '../../../components/ui/CredentialTicket';

type Teacher = {
  id: string; name: string; email: string | null; status: string;
  department: string | null; subjectsTaught: string[]; classesHandled: string[]; lastLogin: string | null;
};
type NewCred = { name: string; email: string; tempPassword: string };

export default function SchoolTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [credential, setCredential] = useState<NewCred | null>(null);
  const [form, setForm] = useState({ name: '', email: '', department: '', subjectsTaught: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!user?.schoolId) return;
    try {
      const r = await fetch(`/api/schools/${user.schoolId}/teachers`, { credentials: 'include' });
      if (r.ok) setTeachers(await r.json());
    } catch {
      // network error — list stays empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.schoolId]);

  const filtered = teachers.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) ||
           (t.department || '').toLowerCase().includes(search.toLowerCase()),
  );

  const addTeacher = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const subjects = form.subjectsTaught.split(',').map((s) => s.trim()).filter(Boolean);
      const r = await fetch(`/api/schools/${user!.schoolId}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name, email: form.email, department: form.department || undefined, subjectsTaught: subjects }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Failed to add teacher.'); return; }
      setCredential({ name: data.name, email: data.email, tempPassword: data.tempPassword });
      setShowModal(false);
      setForm({ name: '', email: '', department: '', subjectsTaught: '' });
      await load();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header className="flex items-center gap-3">
        <GraduationCap className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-white">Teachers</h1>
        <span className="text-sm text-gray-400">{teachers.length} total</span>
        <button
          onClick={() => { setShowModal(true); setCredential(null); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </header>

      {credential && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-3">
          <p className="text-sm font-bold text-emerald-400">✓ Teacher &quot;{credential.name}&quot; added! Share these login credentials:</p>
          <CredentialTicket
            title="Teacher Login"
            credentials={[
              { label: 'Email', value: credential.email },
              { label: 'Password', value: credential.tempPassword },
            ]}
            note="This password is shown only once."
          />
          <button onClick={() => setCredential(null)} className="text-xs text-gray-400 hover:text-gray-200 underline">Dismiss</button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Search by name or department…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>{['Name', 'Email', 'Department', 'Subjects', 'Status', 'Last login'].map((h) => (
              <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(4)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => (
                <td key={j} className="px-4 py-3"><div className="h-4 bg-white/10 rounded animate-pulse" /></td>
              ))}</tr>)
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No teachers yet. Add your first teacher above.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                <td className="px-4 py-3 text-gray-400">{t.email || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{t.department || '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{(t.subjectsTaught || []).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>{t.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{t.lastLogin ? new Date(t.lastLogin).toLocaleDateString() : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Add Teacher</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'e.g. Priya Sharma' },
                { label: 'Email *', key: 'email', type: 'email', placeholder: 'teacher@school.edu' },
                { label: 'Department', key: 'department', type: 'text', placeholder: 'e.g. Mathematics' },
                { label: 'Subjects (comma-separated)', key: 'subjectsTaught', type: 'text', placeholder: 'Math, Physics' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
                  <input type={type} placeholder={placeholder}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 text-sm font-semibold rounded-xl hover:bg-white/10">Cancel</button>
              <button onClick={addTeacher} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Adding…' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
