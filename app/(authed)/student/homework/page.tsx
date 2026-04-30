'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

type Homework = {
  id: string;
  homeworkId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'PENDING' | 'COMPLETED' | 'LATE' | 'GRADED';
  score: number | null;
};

export default function HomeworkPage() {
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/homework/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const pending = items.filter((h) => h.status === 'PENDING');
  const done = items.filter((h) => h.status !== 'PENDING');

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
          <BookOpen className="w-7 h-7 text-brand-primary" />
          HOMEWORK
        </h1>
        <p className="text-sm text-text-secondary mt-1">Assigned by your teacher</p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
        </div>
      ) : pending.length === 0 && done.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle className="w-12 h-12 text-accent-green mx-auto mb-3 opacity-50" />
          <p className="font-display font-bold text-lg text-text-primary">All caught up!</p>
          <p className="text-sm text-text-secondary mt-1">No homework assigned right now.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-text-secondary tracking-widest uppercase mb-3">
                Pending ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((h) => {
                  const due = timeLeft(h.dueDate);
                  const overdue = due === 'Overdue';
                  return (
                    <div key={h.id} className="card p-5 hover:border-brand-primary transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-accent-red/20' : 'bg-brand-primary/20'}`}>
                          {overdue
                            ? <AlertCircle className="w-5 h-5 text-accent-red" />
                            : <BookOpen className="w-5 h-5 text-brand-primary" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-text-primary">{h.title}</p>
                          {h.description && <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{h.description}</p>}
                          {due && (
                            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${overdue ? 'text-accent-red' : 'text-accent-gold'}`}>
                              <Clock className="w-3 h-3" /> {due}
                            </div>
                          )}
                        </div>
                        <Link href="/student/subjects" className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-primaryGlow uppercase tracking-wider flex-shrink-0">
                          START <ArrowRight className="w-3 h-3" />
                        </Link>
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
                {done.map((h) => (
                  <div key={h.id} className="card p-5 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-accent-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-primary">{h.title}</p>
                        {h.score !== null && (
                          <p className="text-xs text-accent-gold font-bold mt-0.5">Score: {h.score}</p>
                        )}
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
