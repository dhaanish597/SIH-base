'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QuizRunner from '@/app/components/modules/QuizRunner';

interface RawQuestion {
  id: string;
  text: string;
  choices: unknown;
  answerIndex: number;
  explanation?: string | null;
}

interface Question {
  id: string;
  text: string;
  choices: string[];
  answerIndex: number;
  explanation: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const subjectId = params.subjectId as string;

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooFew, setTooFew] = useState(false);

  useEffect(() => {
    if (!topicId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/questions?topicId=${encodeURIComponent(topicId)}&status=APPROVED&take=20`,
          { credentials: 'include' }
        );

        if (!res.ok) {
          throw new Error(`Failed to load questions (${res.status})`);
        }

        const raw: RawQuestion[] = await res.json();

        if (raw.length < 3) {
          setTooFew(true);
          return;
        }

        const mapped: Question[] = raw.map((q) => ({
          id: q.id,
          text: q.text,
          choices: Array.isArray(q.choices)
            ? (q.choices as string[])
            : (JSON.parse(q.choices as string) as string[]),
          answerIndex: q.answerIndex,
          explanation: q.explanation ?? null,
        }));

        const picked = shuffle(mapped).slice(0, 10);
        setQuestions(picked);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [topicId]);

  const handleComplete = useCallback(
    async (score: number) => {
      try {
        await fetch('/api/learn/progress', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topicId, module: 'quiz', score }),
        });
      } catch {
        // Non-fatal — navigation proceeds regardless
      }
      router.push(`/student/learn/${subjectId}`);
    },
    [topicId, subjectId, router]
  );

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{
            borderColor: 'var(--bg-elev-3)',
            borderTopColor: 'var(--violet)',
          }}
        />
        <p className="text-sm" style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          Loading questions…
        </p>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <span className="text-4xl">⚠️</span>
        <p className="text-base font-semibold text-center" style={{ color: 'var(--red, #EF4444)' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="py-2 px-6 rounded-xl font-bold text-sm"
          style={{ background: 'var(--violet)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ── Not enough questions state ── */
  if (tooFew) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <span className="text-5xl">📭</span>
        <p className="text-base font-semibold" style={{ color: 'var(--ink-1)' }}>
          Not enough questions yet. Check back later!
        </p>
        <button
          onClick={() => router.back()}
          className="py-2 px-6 rounded-xl font-bold text-sm"
          style={{ background: 'var(--bg-elev-3)', color: 'var(--ink-2)', border: '1px solid var(--line)', cursor: 'pointer' }}
        >
          ← Go Back
        </button>
      </div>
    );
  }

  if (!questions) return null;

  return (
    <div className="min-h-screen py-6" style={{ background: 'var(--bg-deep, #07070F)' }}>
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto px-4 mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-xs py-1.5 px-3 rounded-lg font-medium transition-all"
          style={{
            background: 'var(--bg-elev-2)',
            color: 'var(--ink-3)',
            border: '1px solid var(--line)',
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <h1
          className="text-lg font-extrabold tracking-wide"
          style={{ fontFamily: 'Bowlby One, Orbitron, sans-serif', color: 'var(--ink-1)' }}
        >
          TOPIC QUIZ
        </h1>
      </div>

      <QuizRunner
        questions={questions}
        topicId={topicId}
        subjectId={subjectId}
        onComplete={handleComplete}
      />
    </div>
  );
}
