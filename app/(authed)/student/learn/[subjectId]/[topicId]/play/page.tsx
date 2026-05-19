'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormulaMatchGame from '@/app/components/games/FormulaMatchGame';
import EquationBalanceGame from '@/app/components/games/EquationBalanceGame';
import TriangleRatioGame from '@/app/components/games/TriangleRatioGame';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface PlayPayload {
  gameType: string;
  config: Record<string, unknown>;
  topicName?: string;
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();

  const subjectId = params?.subjectId as string;
  const topicId = params?.topicId as string;

  const [payload, setPayload] = useState<PlayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/learn/content/${topicId}/PLAY`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async res => {
        if (!res.ok) throw new Error(res.status === 404 ? 'No play module is available for this topic.' : `HTTP ${res.status}`);
        const data = await res.json();
        if (!data.payload?.gameType) throw new Error('No play module is available for this topic.');
        setPayload(data.payload);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load play module.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [topicId]);

  const handleComplete = async (score: number) => {
    try {
      await fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topicId, module: 'play', score }),
      });
    } catch {
      // fire-and-forget — don't block navigation
    } finally {
      router.push(`/student/learn/${subjectId}`);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render helpers                                                     */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'transparent' }}
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
            Loading game…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'transparent' }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-sm"
          style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--hot)' }}
        >
          <p style={{ color: 'var(--hot)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Could not load game
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

  /* ---------------------------------------------------------------- */
  /* Game renderer                                                      */
  /* ---------------------------------------------------------------- */

  const renderGame = () => {
    if (!payload) return null;
    const { gameType, config } = payload;

    switch (gameType) {
      case 'FormulaMatchGame':
        return (
          <FormulaMatchGame
            config={config as { pairs: Array<{ formula: string; name: string }> }}
            onComplete={handleComplete}
          />
        );
      case 'EquationBalanceGame':
        return (
          <EquationBalanceGame
            config={
              config as {
                equations: Array<{
                  left: string;
                  right: string;
                  answer: number;
                  variable: string;
                }>;
              }
            }
            onComplete={handleComplete}
          />
        );
      case 'TriangleRatioGame':
        return (
          <TriangleRatioGame
            config={
              config as {
                questions: Array<{
                  opposite: number;
                  adjacent: number;
                  hypotenuse: number;
                  ask: 'sin' | 'cos' | 'tan';
                }>;
              }
            }
            onComplete={handleComplete}
          />
        );
      default:
        return (
          <div
            className="text-center py-10"
            style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Unknown game type: {gameType}
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
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
          🎮 Play — {payload?.topicName ?? topicId}
        </span>
        <div style={{ width: '3.5rem' }} />
      </header>

      {/* Game */}
      <main className="flex-1 flex items-start justify-center py-8 px-4">
        {renderGame()}
      </main>
    </div>
  );
}
