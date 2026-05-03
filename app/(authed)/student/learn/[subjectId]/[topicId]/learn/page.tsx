'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LearnStepper from '@/app/components/modules/LearnStepper';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface Slide {
  type: string;
  title: string;
  body: string;
  animationData?: { type: string };
}

/* ------------------------------------------------------------------ */
/* Demo fallback                                                        */
/* Used until GET /api/learn/content/:topicId/LEARN is implemented.    */
/* TODO: replace with real API fetch once the Express route exists.    */
/* ------------------------------------------------------------------ */

const DEMO_SLIDES: Slide[] = [
  {
    type: 'text',
    title: 'Introduction',
    body: 'Welcome to this topic. Let us explore the core concepts together.',
  },
  {
    type: 'diagram',
    title: 'Visual Overview',
    body: 'Study this diagram carefully. Notice how the sides of a right triangle relate to each other.',
    animationData: { type: 'RightTriangleDiagram' },
  },
  {
    type: 'interactive',
    title: 'Try It Yourself',
    body: 'Drag the vertex to explore how angles relate to sin, cos, and tan.',
    animationData: { type: 'DraggableTriangle' },
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();

  const subjectId = params?.subjectId as string;
  const topicId = params?.topicId as string;

  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;

    // TODO: replace with real API call once route is implemented:
    // GET /api/learn/content/:topicId/LEARN
    // The route should fetch the Content row (type = 'LEARN') for the topic
    // and return its `payload` field (an array of Slide objects).
    //
    // Example:
    // const res = await fetch(`/api/learn/content/${topicId}/LEARN`);
    // if (!res.ok) throw new Error('Content not found');
    // const data = await res.json();
    // setSlides(data.slides ?? DEMO_SLIDES);

    // Demo fallback for now:
    const timer = setTimeout(() => {
      setSlides(DEMO_SLIDES);
      setLoading(false);
    }, 300); // small delay to simulate fetch

    return () => clearTimeout(timer);
  }, [topicId]);

  const handleComplete = async () => {
    try {
      // POST progress — fire and don't block navigation
      fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, module: 'learn', score: 100 }),
      }).catch(() => {
        // TODO: queue for retry if offline
      });
    } finally {
      router.push(`/student/learn/${subjectId}`);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                             */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--violet)', borderTopColor: 'transparent' }}
          />
          <p style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
            Loading content…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-sm"
          style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--hot)' }}
        >
          <p style={{ color: 'var(--hot)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Could not load content
          </p>
          <p style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 py-2 px-6 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--violet)', color: '#fff' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--ink-2)' }}
        >
          ← Back
        </button>
        <span
          className="text-xs uppercase tracking-widest"
          style={{
            color: 'var(--violet-bright)',
            fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
            letterSpacing: '0.12em',
          }}
        >
          Learn
        </span>
        <div style={{ width: '3.5rem' }} /> {/* spacer */}
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <LearnStepper
          slides={slides}
          topicId={topicId}
          subjectId={subjectId}
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}
