'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Check, X, RefreshCw } from 'lucide-react';

type PendingQuestion = {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  gradeLevel: number;
  choices: string[] | null;
  answerIndex: number | null;
  correctAnswer: string | null;
  explanation: string | null;
  createdAt: string;
  subject: { name: string } | null;
  chapter: { name: string } | null;
  createdBy: { id: string; name: string; role: string; schoolId: string | null } | null;
};

export default function ModerationPage() {
  const [queue, setQueue] = useState<PendingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/admin/moderation-queue', { credentials: 'include' });
    if (r.ok) setQueue(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const moderate = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setBusy(id);
    await fetch(`/api/questions/${id}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    });
    setQueue((prev) => prev.filter((q) => q.id !== id));
    setBusy(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
          <span className="text-sm text-gray-500">{queue.length} pending</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-3 py-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-16">
          <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">All clear — no pending questions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{q.subject?.name || 'Unknown'}</span>
                    {q.chapter && <span className="text-xs text-gray-500">{q.chapter.name}</span>}
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{q.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      q.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                      q.difficulty === 'HARD' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{q.difficulty}</span>
                    <span className="text-xs text-gray-400">Grade {q.gradeLevel}</span>
                  </div>
                  <p className="text-sm text-gray-900 mb-2">{q.text}</p>
                  {q.choices && (
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {q.choices.map((c, i) => (
                        <div key={i} className={`text-xs px-2 py-1 rounded-lg ${i === q.answerIndex ? 'bg-emerald-50 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                          {i === q.answerIndex && <Check className="inline w-3 h-3 mr-0.5" />}{c}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.explanation && (
                    <p className="text-xs text-gray-400 italic mt-1">"{q.explanation}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted by <span className="font-medium text-gray-600">{q.createdBy?.name || 'Unknown'}</span>
                    {' '}({q.createdBy?.role}) · {new Date(q.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => moderate(q.id, 'APPROVE')}
                    disabled={busy === q.id}
                    className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs rounded-lg px-3 py-2 hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => moderate(q.id, 'REJECT')}
                    disabled={busy === q.id}
                    className="flex items-center gap-1.5 bg-rose-500 text-white text-xs rounded-lg px-3 py-2 hover:bg-rose-600 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
