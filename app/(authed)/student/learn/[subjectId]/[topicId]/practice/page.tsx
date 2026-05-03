'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PracticeExamples from '@/app/components/modules/PracticeExamples';

interface Example {
  problem: string;
  steps: string[];
  answer: string;
}

const DEMO_EXAMPLES: Example[] = [
  {
    problem: "Find the HCF of 96 and 72 using Euclid's Division Algorithm.",
    steps: [
      "Step 1: Apply Euclid's algorithm: 96 = 72 × 1 + 24",
      "Step 2: Now apply to 72 and 24: 72 = 24 × 3 + 0",
      "Step 3: Since remainder is 0, the HCF is the last non-zero remainder.",
    ],
    answer: "HCF(96, 72) = 24",
  },
  {
    problem: "Prove that √2 is irrational.",
    steps: [
      "Step 1: Assume √2 is rational, so √2 = p/q where p,q are integers with no common factors.",
      "Step 2: Squaring both sides: 2 = p²/q², so p² = 2q².",
      "Step 3: Since p² is even, p must be even. Write p = 2m.",
      "Step 4: Then 4m² = 2q², so q² = 2m², meaning q is also even.",
      "Step 5: Both p and q are even — contradiction with 'no common factors'.",
    ],
    answer: "Therefore √2 is irrational. □",
  },
];

export default function PracticePage() {
  const router = useRouter();
  const params = useParams<{ subjectId: string; topicId: string }>();
  const { subjectId, topicId } = params;

  const [examples, setExamples] = useState<Example[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchContent() {
      try {
        const res = await fetch(`/api/learn/content/${topicId}/PRACTICE`);
        if (res.status === 404) {
          if (!cancelled) setExamples(DEMO_EXAMPLES);
          return;
        }
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        if (!cancelled) setExamples((data.payload as { examples: Example[] }).examples);
      } catch (e) {
        if (!cancelled) {
          // Network / parse error — fall back to demo so the page is always usable
          console.warn('Practice content fetch failed, using demo:', e);
          setExamples(DEMO_EXAMPLES);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchContent();
    return () => { cancelled = true; };
  }, [topicId]);

  async function handleComplete(score: number) {
    try {
      await fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          <p className="text-white/40 text-sm">Loading examples…</p>
        </div>
      </div>
    );
  }

  if (!examples || examples.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white/60">No practice examples available yet.</p>
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
    <div className="min-h-screen arcade-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push(`/student/learn/${subjectId}`)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Back to topics"
          >
            ←
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

        {/* Practice component */}
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
