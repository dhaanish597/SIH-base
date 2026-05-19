'use client';

import MasteryRing from '../ui/MasteryRing';

export interface TopicNodeProps {
  id: string;
  name: string;
  chapterName: string;
  locked: boolean;
  progress: {
    masteryScore: number;
    learnScore: number | null;
    playScore: number | null;
    practiceScore: number | null;
    quizScore: number | null;
    nextReviewAt: string | null;
  } | null;
  onSelect: (id: string) => void;
}

interface ModulePip {
  label: string;
  icon: string;
  score: number | null;
}

function getPips(progress: TopicNodeProps['progress']): ModulePip[] {
  if (!progress) return [];
  return [
    { label: 'Learn',    icon: '⚡', score: progress.learnScore },
    { label: 'Play',     icon: '🎮', score: progress.playScore },
    { label: 'Practice', icon: '✏️', score: progress.practiceScore },
    { label: 'Quiz',     icon: '📝', score: progress.quizScore },
  ];
}

function isDueForReview(progress: TopicNodeProps['progress']): boolean {
  if (!progress?.nextReviewAt) return false;
  if (progress.masteryScore >= 0.8) return false;
  return new Date(progress.nextReviewAt) <= new Date();
}

type NodeVariant = 'locked' | 'not-started' | 'in-progress' | 'mastered';

function getVariant(locked: boolean, progress: TopicNodeProps['progress']): NodeVariant {
  if (locked) return 'locked';
  if (!progress) return 'not-started';
  if (progress.masteryScore >= 0.8) return 'mastered';
  return 'in-progress';
}

const BORDER_CLASSES: Record<NodeVariant, string> = {
  locked:       'border-[#2D3260] opacity-50',
  'not-started': 'border-[#6B4BFF] shadow-[0_0_12px_rgba(107,75,255,0.25)]',
  'in-progress': 'border-[#18D6FF] shadow-[0_0_12px_rgba(24,214,255,0.2)]',
  mastered:     'border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.25)]',
};

export default function TopicNode({
  id,
  name,
  chapterName,
  locked,
  progress,
  onSelect,
}: TopicNodeProps) {
  const variant = getVariant(locked, progress);
  const dueForReview = isDueForReview(progress);
  const pips = getPips(progress);
  const hasAnyScore = pips.some((p) => p.score !== null);

  function handleClick() {
    if (!locked) onSelect(id);
  }

  return (
    <div className="relative group" title={locked ? 'Complete prerequisites first' : undefined}>
      <button
        onClick={handleClick}
        disabled={locked}
        className={[
          'w-full text-left rounded-xl border bg-[#0F1128] p-4 transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4BFF]',
          locked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]',
          BORDER_CLASSES[variant],
        ].join(' ')}
      >
        {/* Chapter name */}
        <p
          className="text-[11px] font-semibold uppercase tracking-widest text-[#6F77A6] mb-0.5"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {chapterName}
        </p>

        {/* Topic name + badges row */}
        <div className="flex items-start justify-between gap-3">
          <span
            className="text-[15px] font-bold text-[#F5F7FF] leading-snug"
            style={{ fontFamily: "'Bowlby One', 'Orbitron', sans-serif" }}
          >
            {name}
          </span>

          {/* Mastery ring (in-progress only) */}
          {variant === 'in-progress' && progress && (
            <MasteryRing mastery={progress.masteryScore} size={40} strokeWidth={3} />
          )}

          {/* Locked overlay icon */}
          {locked && (
            <span className="text-2xl leading-none shrink-0" aria-label="Locked">
              🔒
            </span>
          )}
        </div>

        {/* Module pip dots (in-progress, if any score exists) */}
        {variant === 'in-progress' && hasAnyScore && (
          <div className="flex items-center gap-3 mt-3">
            {pips.map((pip) => {
              if (pip.score === null) return null;
              const filled = pip.score >= 60;
              return (
                <span
                  key={pip.label}
                  className="flex items-center gap-1 text-[11px]"
                  title={`${pip.label}: ${pip.score}`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <span
                    className={[
                      'inline-block w-2.5 h-2.5 rounded-full border',
                      filled
                        ? 'bg-[#18D6FF] border-[#18D6FF]'
                        : 'bg-transparent border-[#6F77A6]',
                    ].join(' ')}
                  />
                  <span className="text-[#6F77A6]">{pip.icon}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* CTA: not started */}
        {variant === 'not-started' && (
          <p
            className="mt-3 text-sm font-semibold text-[#6B4BFF] group-hover:text-[#8A6DFF] transition-colors"
          >
            Start Learning →
          </p>
        )}
      </button>

      {/* Gold star — mastered */}
      {variant === 'mastered' && (
        <span
          className="absolute -top-2 -right-2 text-xl leading-none select-none"
          aria-label="Mastered"
        >
          ⭐
        </span>
      )}

      {/* Amber pulsing dot — due for review */}
      {dueForReview && (
        <span
          className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#FFC93C] animate-pulse"
          aria-label="Due for review"
        />
      )}

      {/* Locked tooltip */}
      {locked && (
        <div
          className="
            absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2
            px-2.5 py-1.5 rounded-lg bg-[#1A1D3A] border border-[#2D3260]
            text-[11px] text-[#B0B7D8] whitespace-nowrap
            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-10
          "
          role="tooltip"
        >
          Complete prerequisites first
        </div>
      )}
    </div>
  );
}
