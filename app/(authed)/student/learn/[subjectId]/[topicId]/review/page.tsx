'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReviewDashboard from '@/app/components/modules/ReviewDashboard';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface TopicProgressData {
  masteryScore: number;
  learnScore: number | null;
  playScore: number | null;
  practiceScore: number | null;
  quizScore: number | null;
  nextReviewAt: string | null;
  lastAttemptAt: string | null;
}

interface TopicItem {
  id: string;
  name: string;
  progress?: TopicProgressData | null;
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ReviewPage() {
  const params = useParams();
  const subjectId = params?.subjectId as string;
  const topicId = params?.topicId as string;

  const [topicName, setTopicName] = useState<string>('');
  const [progress, setProgress] = useState<TopicProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId || !topicId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/learn/topics/${subjectId}`);
        if (!res.ok) throw new Error(`Failed to load topics (${res.status})`);
        const data: TopicItem[] = await res.json();
        if (cancelled) return;

        const topic = data.find((t) => t.id === topicId);
        if (!topic) throw new Error('Topic not found');

        setTopicName(topic.name);
        setProgress(topic.progress ?? null);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setError(msg);
          // Demo fallback so the page is still useful during development
          setTopicName('Trigonometry Basics');
          setProgress(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [subjectId, topicId]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-4 animate-spin"
            style={{ borderColor: 'var(--violet)', borderTopColor: 'transparent' }}
          />
          <p
            style={{
              color: 'var(--ink-3)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
            }}
          >
            Loading progress…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-sm w-full"
          style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--hot)' }}
        >
          <p style={{ color: 'var(--hot)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Could not load progress
          </p>
          <p style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>{error}</p>
          <Link
            href={`/student/learn/${subjectId}`}
            className="inline-block mt-6 py-2 px-6 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--violet)', color: '#fff', textDecoration: 'none' }}
          >
            ← Back to Roadmap
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-deep)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg-arena)', borderBottom: '1px solid var(--line)' }}
      >
        <Link
          href={`/student/learn/${subjectId}`}
          className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-2)', textDecoration: 'none' }}
        >
          ← Back to Roadmap
        </Link>
        <span
          className="text-xs uppercase tracking-widest"
          style={{
            color: 'var(--violet-bright)',
            fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
            letterSpacing: '0.12em',
          }}
        >
          Review
        </span>
        <div style={{ width: '7rem' }} /> {/* spacer to balance header */}
      </header>

      {/* Content */}
      <main className="flex-1 py-8 px-4 max-w-lg mx-auto w-full">
        {/* Topic title */}
        <div className="mb-6">
          <p
            className="text-xs uppercase tracking-widest mb-1"
            style={{ color: 'var(--ink-3)' }}
          >
            Topic
          </p>
          <h1
            className="font-bold leading-tight"
            style={{
              fontSize: '1.4rem',
              color: 'var(--ink-1)',
              fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
            }}
          >
            {topicName || topicId}
          </h1>
        </div>

        {/* Dashboard */}
        <ReviewDashboard
          topicId={topicId}
          topicName={topicName || topicId}
          subjectId={subjectId}
          progress={progress}
        />
      </main>
    </div>
  );
}
