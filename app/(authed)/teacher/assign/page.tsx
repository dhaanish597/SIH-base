'use client';

import { useEffect, useState } from 'react';
import { Send, BookOpen, Gamepad2 } from 'lucide-react';

type ClassItem = { id: string; name: string; gradeLevel: number; section?: string | null };

const GAME_TYPES = [
  { value: 'MATH_DUNGEON',      label: 'Math Dungeon' },
  { value: 'QUIZ_BATTLE',       label: 'Quiz Battle' },
  { value: 'SCIENCE_LAB',       label: 'Science Lab Escape' },
  { value: 'HISTORY_CONQUEST',  label: 'History Conquest' },
  { value: 'WORD_FORGE',        label: 'Word Forge' },
];

export default function TeacherAssignPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tab, setTab] = useState<'homework' | 'game'>('homework');
  const [form, setForm] = useState({ classId: '', title: '', description: '', dueDate: '', gameType: 'MATH_DUNGEON' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/classes/mine', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  const valid = form.classId && (tab === 'homework' ? form.title.trim() : form.gameType);

  const submit = async () => {
    if (!valid) return;
    setSending(true);
    const endpoint = tab === 'homework' ? '/api/homework' : '/api/games/assign';
    const body = tab === 'homework'
      ? { classId: form.classId, title: form.title, description: form.description || undefined, dueDate: form.dueDate || undefined }
      : { classId: form.classId, gameType: form.gameType, dueDate: form.dueDate || undefined };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    setSending(false);
    if (r.ok) {
      setSuccess(true);
      setForm({ classId: '', title: '', description: '', dueDate: '', gameType: 'MATH_DUNGEON' });
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
        <Send className="w-6 h-6 text-brand-primary" /> ASSIGN TO CLASS
      </h1>

      {/* Tab switcher */}
      <div className="flex gap-2 p-1 bg-bg-overlay rounded-xl border border-white/5">
        {(['homework', 'game'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === t ? 'bg-brand-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
          >
            {t === 'homework' ? <BookOpen className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
            {t === 'homework' ? 'Homework' : 'Game'}
          </button>
        ))}
      </div>

      <section className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">CLASS *</label>
          <select
            value={form.classId}
            onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
            className="input"
          >
            <option value="">Select a class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.section ? ` — ${c.section}` : ''} · Grade {c.gradeLevel}
              </option>
            ))}
          </select>
        </div>

        {tab === 'homework' ? (
          <>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">TITLE *</label>
              <input className="input" placeholder="Homework title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">DESCRIPTION (OPTIONAL)</label>
              <input className="input" placeholder="Instructions…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </>
        ) : (
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">GAME *</label>
            <select value={form.gameType} onChange={(e) => setForm((f) => ({ ...f, gameType: e.target.value }))} className="input">
              {GAME_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">DUE DATE (OPTIONAL)</label>
          <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
        </div>

        <button
          onClick={submit}
          disabled={!valid || sending}
          className="btn btn-primary btn-block flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {success ? 'ASSIGNED!' : sending ? 'ASSIGNING…' : 'ASSIGN NOW'}
        </button>
      </section>
    </div>
  );
}
