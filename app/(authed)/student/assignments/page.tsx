'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

type Assignment = {
  id: string;
  assignmentId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'PENDING' | 'COMPLETED' | 'LATE' | 'GRADED';
  score: number | null;
};

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assignments/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const pending = items.filter((a) => a.status === 'PENDING');
  const done = items.filter((a) => a.status !== 'PENDING');

  function timeLeft(dueDate: string | null) {
    if (!dueDate) return null;
    const ms = new Date(dueDate).getTime() - Date.now();
    if (ms <= 0) return 'Overdue';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h left` : `${h}h left`;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-brand-secondary" />
          ASSIGNMENTS
        </h1>
        <p className="text-sm text-text-secondary mt-1">Tasks assigned by your teacher</p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
        </div>
      ) : pending.length === 0 && done.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle className="w-12 h-12 text-accent-green mx-auto mb-3 opacity-50" />
          <p className="font-display font-bold text-lg text-text-primary">No assignments yet!</p>
          <p className="text-sm text-text-secondary mt-1">Your teacher hasn&apos;t assigned anything yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-text-secondary tracking-widest uppercase mb-3">
                Pending ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((a) => {
                  const due = timeLeft(a.dueDate);
                  const overdue = due === 'Overdue';
                  return (
                    <div key={a.id} className="card p-5 hover:border-brand-secondary transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-accent-red/20' : 'bg-brand-secondary/20'}`}>
                          {overdue
                            ? <AlertCircle className="w-5 h-5 text-accent-red" />
                            : <ScrollText className="w-5 h-5 text-brand-secondary" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-text-primary">{a.title}</p>
                          {a.description && <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{a.description}</p>}
                          {due && (
                            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${overdue ? 'text-accent-red' : 'text-accent-gold'}`}>
                              <Clock className="w-3 h-3" /> {due}
                            </div>
                          )}
                        </div>
                        <span className="badge badge-info">Pending</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-text-secondary tracking-widest uppercase mb-3">
                Completed ({done.length})
              </h2>
              <div className="space-y-3">
                {done.map((a) => (
                  <div key={a.id} className="card p-5 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-accent-green" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-text-primary">{a.title}</p>
                        {a.score !== null && <p className="text-xs text-accent-gold font-bold mt-0.5">Score: {a.score}</p>}
                      </div>
                      <span className="badge badge-success">Done</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
