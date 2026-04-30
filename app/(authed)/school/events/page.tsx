'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';

type SchoolEvent = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
};

export default function SchoolEventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', eventDate: '' });
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/schools/events', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addEvent = async () => {
    if (!form.title || !form.eventDate) return;
    setAdding(true);
    await fetch('/api/schools/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setForm({ title: '', description: '', eventDate: '' });
    setAdding(false);
    load();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/schools/events/${id}`, { method: 'DELETE', credentials: 'include' });
    setEvents((e) => e.filter((ev) => ev.id !== id));
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-2">
        <Calendar className="w-6 h-6 text-brand-primary" /> SCHOOL EVENTS
      </h1>

      <section className="card p-6 space-y-3">
        <h2 className="font-display font-bold text-sm tracking-widest uppercase text-text-secondary">ADD EVENT</h2>
        <input
          className="input"
          placeholder="Event title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <input
          className="input"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <input
          className="input"
          type="date"
          value={form.eventDate}
          onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
        />
        <button
          onClick={addEvent}
          disabled={!form.title || !form.eventDate || adding}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {adding ? 'ADDING…' : 'ADD EVENT'}
        </button>
      </section>

      <section className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)
        ) : events.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-40" />
            <p className="text-sm text-text-secondary">No events scheduled.</p>
          </div>
        ) : events.map((ev) => (
          <div key={ev.id} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary">{ev.title}</p>
              {ev.description && <p className="text-xs text-text-secondary mt-0.5 truncate">{ev.description}</p>}
              <p className="text-xs font-mono text-accent-gold mt-1">
                {new Date(ev.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => deleteEvent(ev.id)}
              className="text-text-muted hover:text-accent-red transition-colors p-1 flex-shrink-0"
              aria-label="Delete event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
