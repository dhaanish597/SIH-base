'use client';

// ── TopicSidePanel ────────────────────────────────────────────────────────────
// Slide-in panel from the right. Shows topic detail + module progress.
// Rendered at Level 3 (topic map) when a topic node is clicked.

import { useRouter } from 'next/navigation';
import MasteryRing from '@/app/components/ui/MasteryRing';

interface TopicProgress {
  masteryScore: number;
  learnScore: number | null;
  playScore: number | null;
  practiceScore: number | null;
  quizScore: number | null;
}

interface TopicDetail {
  id: string;
  name: string;
  chapterName: string;
  progress: TopicProgress | null;
}

interface TopicSidePanelProps {
  topic: TopicDetail | null;
  subjectId: string;
  onClose: () => void;
}

interface ModuleBarProps {
  label: string;
  icon: string;
  score: number | null;
}

function ModuleBar({ label, icon, score }: ModuleBarProps) {
  const pct = score !== null ? Math.round(Math.min(100, Math.max(0, score))) : 0;
  const done = score !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#B7BEE0', fontFamily: 'var(--f-body, Nunito, sans-serif)' }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          {label}
        </span>
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: done ? '#18D6FF' : '#424878' }}>
          {done ? `${pct}%` : '—'}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: '#1F2342', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 99,
            background: pct >= 70 ? '#2DD46E' : pct > 0 ? '#18D6FF' : '#2D3260',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function TopicSidePanel({ topic, subjectId, onClose }: TopicSidePanelProps) {
  const router = useRouter();
  const visible = topic !== null;

  function handleContinue() {
    if (!topic) return;
    router.push(`/student/learn/${subjectId}/${topic.id}/learn`);
  }

  function handleViewStats() {
    if (!topic) return;
    router.push(`/student/learn/${subjectId}/${topic.id}/review`);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 40,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={topic?.name ?? 'Topic details'}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 320,
          zIndex: 50,
          background: '#0f1128',
          borderLeft: '2px solid #2D3260',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #2D3260',
          gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#6F77A6',
              marginBottom: 4,
            }}>
              {topic?.chapterName ?? ''}
            </p>
            <h2 style={{
              fontSize: 16,
              fontFamily: 'var(--f-display, Oxanium, sans-serif)',
              fontWeight: 700,
              color: '#F5F7FF',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}>
              {topic?.name ?? ''}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1.5px solid #2D3260',
              background: '#161930',
              color: '#6F77A6',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontSize: 18,
              lineHeight: 1,
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F5F7FF'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6F77A6'; }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Mastery ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <MasteryRing
              mastery={topic?.progress?.masteryScore ?? 0}
              size={72}
              strokeWidth={6}
            />
            <div>
              <p style={{ fontSize: 11, color: '#6F77A6', fontFamily: 'var(--f-hud, Oswald, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Mastery
              </p>
              <p style={{ fontSize: 22, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#F5F7FF' }}>
                {Math.round((topic?.progress?.masteryScore ?? 0) * 100)}%
              </p>
              <p style={{ fontSize: 10, color: '#424878', fontFamily: 'var(--f-body, Nunito, sans-serif)' }}>
                {topic?.progress ? 'In progress' : 'Not started'}
              </p>
            </div>
          </div>

          {/* Module progress bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 10, fontFamily: 'var(--f-hud, Oswald, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6F77A6' }}>
              Module Progress
            </p>
            <ModuleBar label="Learn"    icon="⚡" score={topic?.progress?.learnScore    ?? null} />
            <ModuleBar label="Play"     icon="🎮" score={topic?.progress?.playScore     ?? null} />
            <ModuleBar label="Practice" icon="✏️" score={topic?.progress?.practiceScore ?? null} />
            <ModuleBar label="Quiz"     icon="📝" score={topic?.progress?.quizScore     ?? null} />
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2D3260', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleContinue}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: 'var(--violet, #6B4BFF)',
              color: '#fff',
              fontFamily: 'var(--f-hud, Oswald, sans-serif)',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 0 0 var(--violet-deep, #3A2399)',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 0 0 var(--violet-deep, #3A2399)'; }}
            onMouseUp={e   => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 0 0 var(--violet-deep, #3A2399)'; }}
          >
            ▶ Continue Learning
          </button>

          <button
            onClick={handleViewStats}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 10,
              border: '1.5px solid #2D3260',
              background: 'transparent',
              color: '#B7BEE0',
              fontFamily: 'var(--f-hud, Oswald, sans-serif)',
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#6B4BFF'; b.style.color = '#F5F7FF'; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#2D3260'; b.style.color = '#B7BEE0'; }}
          >
            View Stats →
          </button>
        </div>
      </div>
    </>
  );
}
