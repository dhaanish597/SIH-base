'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PracticeExamples from '@/app/components/modules/PracticeExamples';

interface Example {
  problem: string;
  steps: string[];
  answer: string;
}

export default function PracticePage() {
  const router = useRouter();
  const params = useParams<{ subjectId: string; topicId: string }>();
  const { subjectId, topicId } = params;

  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchContent() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/learn/content/${topicId}/PRACTICE`, { credentials: 'include' });
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'No practice examples are available for this topic.' : `Server error ${res.status}`);
        }
        const data = await res.json();
        const nextExamples = (data.payload as { examples?: Example[] })?.examples;
        if (!Array.isArray(nextExamples) || nextExamples.length === 0) {
          throw new Error('No practice examples are available for this topic.');
        }
        if (!cancelled) setExamples(nextExamples);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load practice examples.');
          setExamples([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (topicId) fetchContent();
    return () => { cancelled = true; };
  }, [topicId]);

  async function handleComplete(score: number) {
    try {
      await fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topicId, module: 'practice', score }),
      });
    } catch (e) {
      console.error('Failed to save practice progress:', e);
    }
    router.push(`/student/learn/${subjectId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--violet)] border-t-transparent animate-spin" />
          <p className="text-white/40 text-sm">Loading examples...</p>
        </div>
      </div>
    );
  }

  if (examples.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white/60">{error || 'No practice examples available yet.'}</p>
          <button
            onClick={() => router.push(`/student/learn/${subjectId}`)}
            className="px-4 py-2 rounded-lg bg-[var(--violet)] text-white text-sm font-semibold hover:bg-[var(--violet)]/80 transition-colors"
          >
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push(`/student/learn/${subjectId}`)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Back to topics"
          >
            Back
          </button>
          <div>
            <h1 className="font-display text-lg text-white font-bold tracking-wide">
              Worked Examples
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              Step through each solution at your own pace
            </p>
          </div>
        </div>

        <div className="card p-6">
          <PracticeExamples
            examples={examples}
            topicId={topicId}
            subjectId={subjectId}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  );
}
