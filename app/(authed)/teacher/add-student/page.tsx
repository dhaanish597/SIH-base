'use client';

import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import CredentialTicket from '../../../components/ui/CredentialTicket';

type ClassItem = { id: string; name: string; gradeLevel: number; section?: string | null };
type CreatedStudent = { name: string; studentId: string; pin: string };

export default function AddStudentPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [form, setForm] = useState({ name: '', classId: '', rollNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedStudent | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/classes/mine', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.classId) { setError('Name and class are required.'); return; }
    setSubmitting(true); setError(''); setCreated(null);
    try {
      const r = await fetch('/api/users/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name.trim(), classId: form.classId, rollNumber: form.rollNumber || undefined }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.message || data.error || 'Failed to add student.'); return; }
      setCreated({ name: data.name, studentId: data.studentId, pin: data.pin });
      setForm({ name: '', classId: form.classId, rollNumber: '' });
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-brand-primary" /> ADD STUDENT
      </h1>

      <section className="card p-6 space-y-4">
        <p className="text-sm text-text-secondary">Fill in the student&apos;s details. Login credentials (Student ID + PIN) are generated automatically.</p>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">FULL NAME *</label>
          <input type="text" className="input" placeholder="Student full name"
            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">CLASS *</label>
          <select value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} className="input">
            <option value="">Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''} · Grade {c.gradeLevel}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">ROLL NUMBER (OPTIONAL)</label>
          <input type="text" className="input" placeholder="e.g. 2024001"
            value={form.rollNumber} onChange={(e) => setForm((f) => ({ ...f, rollNumber: e.target.value }))} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button onClick={submit} disabled={!form.name.trim() || !form.classId || submitting}
          className="btn btn-primary btn-block flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" />
          {submitting ? 'ADDING…' : 'ADD STUDENT'}
        </button>
      </section>

      {created && (
        <section className="card p-6 space-y-3">
          <p className="font-bold text-accent-green">✓ Student &quot;{created.name}&quot; added!</p>
          <p className="text-sm text-text-secondary">Hand these credentials to the student. The PIN cannot be recovered — ask them to remember it.</p>
          <CredentialTicket
            title="Student Login Credentials"
            credentials={[
              { label: 'Student ID', value: created.studentId },
              { label: 'PIN', value: created.pin },
            ]}
            note="The PIN is shown only once and stored encrypted. Cannot be recovered — only reset."
          />
          <button onClick={() => setCreated(null)} className="text-xs text-text-secondary hover:text-text-primary underline">Add another student</button>
        </section>
      )}
    </div>
  );
}
