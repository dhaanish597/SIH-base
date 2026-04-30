'use client';

import { useEffect, useState } from 'react';
import { UserPlus, CheckCircle, XCircle } from 'lucide-react';

type ClassItem = { id: string; name: string; gradeLevel: number; section?: string | null };

export default function AddStudentPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [form, setForm] = useState({ name: '', email: '', studentId: '', classId: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/classes/mine', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  const valid = form.name.trim() && form.classId && form.password.trim();

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setResult(null);
    const r = await fetch('/api/users/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (r.ok) {
      setResult({ ok: true, msg: `Student "${form.name}" added successfully!` });
      setForm({ name: '', email: '', studentId: '', classId: '', password: '' });
    } else {
      const err = await r.json().catch(() => ({}));
      setResult({ ok: false, msg: (err as { message?: string }).message || 'Failed to add student.' });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-brand-primary" /> ADD STUDENT
      </h1>

      <section className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">FULL NAME *</label>
          <input type="text" className="input" placeholder="Student full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">EMAIL (OPTIONAL)</label>
          <input type="email" className="input" placeholder="student@school.edu" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">ROLL / STUDENT ID (OPTIONAL)</label>
          <input type="text" className="input" placeholder="e.g. 2024001" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">CLASS *</label>
          <select value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} className="input">
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.section ? ` — ${c.section}` : ''} · Grade {c.gradeLevel}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">TEMPORARY PASSWORD *</label>
          <input type="password" className="input" placeholder="Set a temporary password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </div>

        {result && (
          <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${result.ok ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 'bg-accent-red/10 text-accent-red border border-accent-red/30'}`}>
            {result.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
            {result.msg}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!valid || submitting}
          className="btn btn-primary btn-block flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {submitting ? 'ADDING…' : 'ADD STUDENT'}
        </button>
      </section>
    </div>
  );
}
