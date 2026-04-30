'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { Users, Plus, X, Search } from 'lucide-react';

type Student = {
  id: string;
  name: string;
  studentId: string;
  class: string | null;
  rollNumber: string | null;
  status: string;
  totalPoints: number;
  level: number;
  lastLogin: string | null;
  createdAt: string;
};

export default function SchoolStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!user?.schoolId) return;
    const r = await fetch(`/api/schools/${user.schoolId}/students`, { credentials: 'include' });
    if (r.ok) setStudents(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      (s.class || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <span className="text-sm text-gray-500">{students.length} total</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add student
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, student ID or class…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {showForm && <AddStudentForm schoolId={user?.schoolId ?? ''} onDone={() => { setShowForm(false); load(); }} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Student ID', 'Class', 'Level', 'Points', 'Status', 'Last login'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No students found.</td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{s.studentId}</td>
                  <td className="px-4 py-3 text-gray-600">{s.class || '—'}</td>
                  <td className="px-4 py-3 text-indigo-600 font-semibold">{s.level}</td>
                  <td className="px-4 py-3 text-amber-600 font-medium">{s.totalPoints}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddStudentForm({ schoolId, onDone }: { schoolId: string; onDone: () => void }) {
  const [form, setForm] = useState({ name: '', studentId: '', pin: '', class: '', rollNumber: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.studentId || !form.pin) { setError('Name, Student ID and PIN are required'); return; }
    setSaving(true);
    setError('');
    const r = await fetch(`/api/schools/${schoolId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    if (r.ok) {
      onDone();
    } else {
      const err = await r.json().catch(() => ({}));
      setError(err.error || 'Failed to create');
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Add Student</h2>
        <button onClick={onDone} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { k: 'name', label: 'Full Name *', type: 'text' },
          { k: 'studentId', label: 'Student ID *', type: 'text' },
          { k: 'pin', label: 'PIN (4-6 digits) *', type: 'password' },
          { k: 'class', label: 'Class / Grade', type: 'text' },
          { k: 'rollNumber', label: 'Roll Number', type: 'text' },
          { k: 'email', label: 'Email (optional)', type: 'email' },
        ].map(({ k, label, type }) => (
          <div key={k}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input
              type={type}
              value={(form as any)[k]}
              onChange={(e) => set(k, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <button
        onClick={submit}
        disabled={saving}
        className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? 'Creating…' : 'Create Student'}
      </button>
    </div>
  );
}
