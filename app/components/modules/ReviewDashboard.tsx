'use client';

import Link from 'next/link';
import MasteryRing from '@/app/components/ui/MasteryRing';

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

interface ReviewDashboardProps {
  topicId: string;
  topicName: string;
  subjectId: string;
  progress: TopicProgressData | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function daysUntil(iso: string): number {
  const now = Date.now();
  const target = new Date(iso).getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/* ------------------------------------------------------------------ */
/* Sub-component: module score bar                                      */
/* ------------------------------------------------------------------ */

interface ScoreBarProps {
  label: string;
  icon: string;
  score: number | null;
  fillColor: string; // CSS var or hex
}

function ScoreBar({ label, icon, score, fillColor }: ScoreBarProps) {
  const pct = score !== null ? Math.round(score * 100) : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>
          {icon} {label}
        </span>
        {pct !== null ? (
          <span
            style={{
              color: fillColor,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            {pct}%
          </span>
        ) : (
          <span style={{ color: 'var(--ink-3)', fontSize: '0.75rem' }}>
            Not attempted yet
          </span>
        )}
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 8, background: 'rgba(255,255,255,0.07)' }}
      >
        {pct !== null && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: fillColor }}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Action buttons row                                                   */
/* ------------------------------------------------------------------ */

interface ActionButtonsProps {
  subjectId: string;
  topicId: string;
  hasProgress: boolean;
}

function ActionButtons({ subjectId, topicId, hasProgress }: ActionButtonsProps) {
  const base = `/student/learn/${subjectId}/${topicId}`;
  const label = hasProgress ? 'again' : 'Start';

  const buttons = [
    { icon: '⚡', module: 'learn', color: 'var(--violet)', shadow: 'var(--hd-violet)' },
    { icon: '🎮', module: 'play', color: 'var(--cyan)', shadow: 'var(--hd-cyan)' },
    { icon: '✏️', module: 'practice', color: 'var(--gold)', shadow: 'var(--hd-gold)' },
    { icon: '📝', module: 'quiz', color: 'var(--green)', shadow: 'var(--hd-green)' },
  ] as const;

  const moduleLabel: Record<string, string> = {
    learn: 'Learn',
    play: 'Play',
    practice: 'Practice',
    quiz: 'Quiz',
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {buttons.map(({ icon, module, color, shadow }) => (
        <Link
          key={module}
          href={`${base}/${module}`}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95"
          style={{
            background: `${color}22`,
            border: `1.5px solid ${color}`,
            color,
            boxShadow: shadow,
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>{icon}</span>
          <span style={{ fontSize: '0.75rem' }}>
            {hasProgress ? `${moduleLabel[module]} again` : `Start ${moduleLabel[module]}`}
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state (not started)                                            */
/* ------------------------------------------------------------------ */

function NotStartedState({
  subjectId,
  topicId,
}: {
  subjectId: string;
  topicId: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)' }}
      >
        🗺️
      </div>
      <div>
        <p
          className="font-bold mb-1"
          style={{
            color: 'var(--ink-1)',
            fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
          }}
        >
          Not started yet
        </p>
        <p style={{ color: 'var(--ink-3)', fontSize: '0.85rem' }}>
          Begin your journey through this topic.
        </p>
      </div>
      <ActionButtons subjectId={subjectId} topicId={topicId} hasProgress={false} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export default function ReviewDashboard({
  topicId,
  topicName,
  subjectId,
  progress,
}: ReviewDashboardProps) {
  /* ── Empty state ── */
  if (!progress) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)' }}
      >
        <NotStartedState subjectId={subjectId} topicId={topicId} />
      </div>
    );
  }

  const { masteryScore, learnScore, playScore, practiceScore, quizScore, nextReviewAt } =
    progress;

  const pct = Math.round(masteryScore * 100);

  /* ── Status chip ── */
  let statusNode: React.ReactNode;
  if (!nextReviewAt) {
    statusNode = (
      <span style={{ color: 'var(--ink-3)' }}>Not scheduled yet</span>
    );
  } else {
    const days = daysUntil(nextReviewAt);
    if (days < 0) {
      statusNode = (
        <span
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(255,201,60,0.12)',
            color: 'var(--gold)',
            border: '1px solid var(--gold)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          ⚠ Review overdue!
        </span>
      );
    } else if (days === 0) {
      statusNode = (
        <span
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(255,201,60,0.12)',
            color: 'var(--gold)',
            border: '1px solid var(--gold)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          📅 Review due today
        </span>
      );
    } else {
      statusNode = (
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(18,214,255,0.10)',
            color: 'var(--cyan)',
            border: '1px solid var(--cyan)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          📅 Next review: {days} day{days !== 1 ? 's' : ''}
        </span>
      );
    }
  }

  /* ── Render ── */
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-6"
      style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)' }}
    >
      {/* 1 ── Mastery ring */}
      <div className="flex flex-col items-center gap-2">
        <MasteryRing mastery={masteryScore} size={120} strokeWidth={8} />
        <div className="text-center">
          <p
            className="font-bold"
            style={{
              fontSize: '2rem',
              lineHeight: 1.1,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--ink-1)',
            }}
          >
            {pct}%
          </p>
          <p
            className="text-xs uppercase tracking-widest mt-0.5"
            style={{ color: 'var(--ink-3)' }}
          >
            Overall Mastery
          </p>
        </div>
      </div>

      {/* 2 ── Module score bars */}
      <div
        className="flex flex-col gap-3 p-4 rounded-xl"
        style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line-soft)' }}
      >
        <ScoreBar label="Learn" icon="⚡" score={learnScore} fillColor="var(--violet)" />
        <ScoreBar label="Play" icon="🎮" score={playScore} fillColor="var(--cyan)" />
        <ScoreBar label="Practice" icon="✏️" score={practiceScore} fillColor="var(--gold)" />
        <ScoreBar label="Quiz" icon="📝" score={quizScore} fillColor="var(--green)" />
      </div>

      {/* 3 ── Status */}
      <div className="flex items-center justify-center">{statusNode}</div>

      {/* 4 ── Weak area warning */}
      {masteryScore < 0.6 && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: 'rgba(255,201,60,0.08)',
            border: '1px solid rgba(255,201,60,0.35)',
          }}
        >
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: 'var(--gold)' }}
            >
              This topic needs more practice
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
              Aim for at least 60% mastery to move on confidently.
            </p>
          </div>
        </div>
      )}

      {/* 5 ── Action buttons */}
      <ActionButtons subjectId={subjectId} topicId={topicId} hasProgress={true} />
    </div>
  );
}
