'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { BookOpen, Plus, X, Users } from 'lucide-react';

type Cls = {
  id: string; name: string; gradeLevel: number; section: string | null;
  teacher: { id: string; name: string } | null; _count: { enrollments: number };
};
type Teacher = { id: string; name: string };

export default function SchoolClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', gradeLevel: '9', section: '', teacherId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!user?.schoolId) return;
    try {
      const [clsRes, tchRes] = await Promise.all([
        fetch(`/api/schools/${user.schoolId}/classes`, { credentials: 'include' }),
        fetch(`/api/schools/${user.schoolId}/teachers`, { credentials: 'include' }),
      ]);
      if (clsRes.ok) setClasses(await clsRes.json());
      if (tchRes.ok) setTeachers(await tchRes.json());
    } catch {
      // network error — lists stay empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.schoolId]);

  const createClass = async () => {
    if (!form.name.trim() || !form.gradeLevel) { setError('Name and grade level are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const r = await fetch(`/api/schools/${user!.schoolId}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          gradeLevel: Number(form.gradeLevel),
          section: form.section || undefined,
          teacherId: form.teacherId || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Failed to create class.'); return; }
      setShowModal(false);
      setForm({ name: '', gradeLevel: '9', section: '', teacherId: '' });
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
        <BookOpen className="w-6 h-6 text-yellow-400" />
        <h1 className="text-2xl font-bold text-white">Classes</h1>
        <span className="text-sm text-gray-400">{classes.length} total</span>
        <button
          onClick={() => setShowModal(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Class
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-2/3" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-1/3" />
            </div>
          ))
        ) : classes.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No classes yet</p>
            <p className="text-gray-600 text-sm mt-1">Create your first class to get started.</p>
          </div>
        ) : classes.map((c) => (
          <div key={c.id} className="bg-white/5 border border-white/10 hover:border-yellow-500/40 rounded-2xl p-5 space-y-3 transition-colors">
            <div>
              <h3 className="font-bold text-white text-lg">{c.name}</h3>
              <p className="text-sm text-gray-400">Grade {c.gradeLevel}{c.section ? ` · Section ${c.section}` : ''}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{c._count?.enrollments ?? 0} students</span>
              {c.teacher ? (
                <span className="text-cyan-400 text-xs">{c.teacher.name}</span>
              ) : (
                <span className="text-gray-600 text-xs">No teacher assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">New Class</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Class Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Grade 9A"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Grade *</label>
                  <select value={form.gradeLevel} onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    {[6,7,8,9,10,11,12].map((g) => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Section</label>
                  <input value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Assign Teacher</label>
                <select value={form.teacherId} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  <option value="">No teacher (assign later)</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 text-gray-300 text-sm font-semibold rounded-xl hover:bg-white/10">Cancel</button>
              <button onClick={createClass} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Creating…' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
