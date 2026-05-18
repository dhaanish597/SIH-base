'use client';

// ── /student/learn/[subjectId] ────────────────────────────────────────────────
// Fantasy winding-path roadmap — matches the reference image.
// Left (70%): SVG S-curve path with circular chapter nodes.
// Right (30%): frosted-glass sidebar panel with chapter info, progress, rewards.

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface TopicProgress {
  masteryScore: number;
  learnScore: number | null;
  playScore: number | null;
  practiceScore: number | null;
  quizScore: number | null;
  nextReviewAt: string | null;
}

interface Topic {
  id: string;
  name: string;
  orderIndex: number;
  progress: TopicProgress | null;
  locked: boolean;
}

interface Chapter {
  id: string;
  name: string;
  orderIndex: number;
  topics: Topic[];
}

/* ── Subject meta ─────────────────────────────────────────────────────────── */

const SUBJECT_META: Record<string, { icon: string; tagline: string; color: string }> = {
  math:        { icon: '📐', tagline: 'Master Math. Conquer the world.',      color: '#6B4BFF' },
  mathematics: { icon: '📐', tagline: 'Master Math. Conquer the world.',      color: '#6B4BFF' },
  science:     { icon: '🔬', tagline: 'Explore Science. Unlock secrets.',      color: '#18D6FF' },
  english:     { icon: '📖', tagline: 'Command Language. Shape your story.',   color: '#2DD46E' },
  history:     { icon: '🏛️', tagline: 'Learn History. Change the future.',    color: '#FFC93C' },
  geography:   { icon: '🌍', tagline: 'Map the world. Find your place.',       color: '#FF4D8A' },
  cs:          { icon: '💻', tagline: 'Code the future. Build anything.',      color: '#FF8A2B' },
  default:     { icon: '📚', tagline: 'Learn. Grow. Conquer.',                 color: '#6B4BFF' },
};

// Winding S-curve node positions (normalised 0–1, scaled to SVG canvas)
const PATH_POINTS = [
  { x: 0.50, y: 0.93 }, // 1  — bottom centre
  { x: 0.72, y: 0.80 }, // 2
  { x: 0.55, y: 0.66 }, // 3  — "current" in reference
  { x: 0.72, y: 0.53 }, // 4
  { x: 0.28, y: 0.52 }, // 5
  { x: 0.40, y: 0.39 }, // 6
  { x: 0.62, y: 0.28 }, // 7
  { x: 0.28, y: 0.22 }, // 8
  { x: 0.42, y: 0.10 }, // 9
  { x: 0.60, y: 0.02 }, // 10
];

const SVG_W = 680;
const SVG_H = 950;
const NODE_R = 40;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getSubjectMeta(subjectId: string) {
  const id = subjectId.toLowerCase();
  for (const [key, val] of Object.entries(SUBJECT_META)) {
    if (id.includes(key)) return val;
  }
  return SUBJECT_META.default;
}

function getChapterState(ch: Chapter): 'completed' | 'in-progress' | 'available' | 'locked' {
  const all = ch.topics;
  if (all.length === 0) return 'locked';
  const mastered = all.filter(t => t.progress && t.progress.masteryScore >= 0.8);
  const touched  = all.filter(t => t.progress !== null);
  if (mastered.length === all.length) return 'completed';
  if (touched.length > 0) return 'in-progress';
  if (all.every(t => t.locked)) return 'locked';
  return 'available';
}

function getChapterMastery(ch: Chapter): number {
  if (ch.topics.length === 0) return 0;
  return ch.topics.reduce((s, t) => s + (t.progress?.masteryScore ?? 0), 0) / ch.topics.length;
}

function buildPathD(pts: { x: number; y: number }[], W: number, H: number): string {
  const scaled = pts.map(p => ({ x: p.x * W, y: p.y * H }));
  if (scaled.length < 2) return '';
  let d = `M ${scaled[0].x} ${scaled[0].y}`;
  for (let i = 1; i < scaled.length; i++) {
    const p = scaled[i - 1];
    const c = scaled[i];
    const mx = (p.x + c.x) / 2;
    d += ` Q ${mx} ${p.y}, ${c.x} ${c.y}`;
  }
  return d;
}

/* ── Chapter node (SVG) ──────────────────────────────────────────────────── */

interface ChapterNodeProps {
  chapter: Chapter;
  index: number;
  cx: number;
  cy: number;
  state: 'completed' | 'in-progress' | 'available' | 'locked';
  mastery: number;
  isSelected: boolean;
  onClick: () => void;
}

function ChapterNode({ chapter, index, cx, cy, state, mastery, isSelected, onClick }: ChapterNodeProps) {
  const isLocked = state === 'locked';

  const STYLES = {
    completed:    { bg1: '#FFE880', bg2: '#FFA820', ring: '#FFD060', glow: 'rgba(255,200,60,0.90)', drop: '#B87A00', num: '#2a1400' },
    'in-progress':{ bg1: '#9A7AFF', bg2: '#5535D0', ring: '#8B6FFF', glow: 'rgba(107,75,255,0.80)', drop: '#3D1EBF', num: '#ffffff' },
    available:    { bg1: '#7A5AEE', bg2: '#3D22B8', ring: '#7A60EE', glow: 'rgba(107,75,255,0.60)', drop: '#2D14A0', num: '#ffffff' },
    locked:       { bg1: '#262250', bg2: '#130E2E', ring: 'rgba(107,75,255,0.25)', glow: 'rgba(0,0,0,0.30)', drop: '#090720', num: '#4a4870' },
  };
  const s = STYLES[state];
  const gradId = `cg-${chapter.id}`;
  const glowId = `gw-${chapter.id}`;
  const arcCirc = 2 * Math.PI * (NODE_R + 6);
  const arcFill = arcCirc * mastery;

  return (
    <g
      style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
      onClick={!isLocked ? onClick : undefined}
      opacity={isLocked ? 0.50 : 1}
    >
      <defs>
        <radialGradient id={gradId} cx="32%" cy="26%" r="72%">
          <stop offset="0%"   stopColor={s.bg1} />
          <stop offset="100%" stopColor={s.bg2} />
        </radialGradient>
        <filter id={glowId} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation={isSelected ? 10 : 6} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer halo glow */}
      {!isLocked && (
        <circle cx={cx} cy={cy} r={NODE_R + 22} fill={s.glow} opacity={isSelected ? 0.60 : 0.35} filter={`url(#${glowId})`} />
      )}

      {/* Duolingo-style hard drop shadow */}
      <circle cx={cx} cy={cy + 6} r={NODE_R + 3} fill={s.drop} opacity={0.85} />

      {/* Mastery arc ring (outside the node) */}
      {mastery > 0 && !isLocked && (
        <circle
          cx={cx} cy={cy} r={NODE_R + 6}
          fill="none"
          stroke={s.ring}
          strokeWidth={4}
          strokeDasharray={`${arcFill} ${arcCirc - arcFill}`}
          strokeDashoffset={arcCirc * 0.25}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={0.70}
        />
      )}

      {/* Outer ring border */}
      <circle cx={cx} cy={cy} r={NODE_R + 3} fill="none" stroke={s.ring} strokeWidth={isSelected ? 4 : 2.5} opacity={0.88} />

      {/* Main filled circle */}
      <circle cx={cx} cy={cy} r={NODE_R} fill={`url(#${gradId})`} />

      {/* Inner specular highlight */}
      {!isLocked && (
        <ellipse
          cx={cx - NODE_R * 0.24} cy={cy - NODE_R * 0.30}
          rx={NODE_R * 0.42} ry={NODE_R * 0.24}
          fill="white" opacity={0.18}
        />
      )}

      {/* Chapter number / state icon */}
      <text
        x={cx} y={cy}
        dominantBaseline="central" textAnchor="middle"
        fontSize={state === 'completed' ? 18 : 22}
        fontFamily="'Bowlby One', 'Orbitron', sans-serif"
        fontWeight="900"
        fill={s.num}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {isLocked ? '🔒' : state === 'completed' ? '✓' : index + 1}
      </text>

      {/* Chapter name label pill */}
      <g style={{ pointerEvents: 'none' }}>
        <rect
          x={cx - 66} y={cy + NODE_R + 10}
          width={132} height={24} rx={12}
          fill="rgba(10,10,28,0.85)"
          stroke={isLocked ? 'rgba(107,75,255,0.18)' : 'rgba(107,75,255,0.45)'}
          strokeWidth={1}
        />
        <text
          x={cx} y={cy + NODE_R + 22}
          dominantBaseline="central" textAnchor="middle"
          fontSize={9.5}
          fontFamily="'Nunito', sans-serif"
          fontWeight="700"
          fill={isLocked ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.82)'}
          style={{ userSelect: 'none' }}
        >
          {chapter.name.length > 20 ? chapter.name.slice(0, 18) + '…' : chapter.name}
        </text>
      </g>
    </g>
  );
}

/* ── Right sidebar ──────────────────────────────────────────────────────────── */

interface SidebarProps {
  chapter: Chapter | null;
  allChapters: Chapter[];
  subjectId: string;
  onNavigate: (topicId: string) => void;
  onClose?: () => void;
}

function Sidebar({ chapter, allChapters, subjectId, onNavigate, onClose }: SidebarProps) {
  if (!chapter) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 14,
        color: 'rgba(180,180,220,0.45)',
        fontFamily: "'Nunito', sans-serif", fontSize: 14,
        textAlign: 'center', padding: '0 28px',
      }}>
        <span style={{ fontSize: 44 }}>👆</span>
        <p>Tap a chapter node<br/>to see its details</p>
      </div>
    );
  }

  const state = getChapterState(chapter);
  const mastery = getChapterMastery(chapter);
  const pct = Math.round(mastery * 100);

  const sorted = allChapters.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const sortedTopics = chapter.topics.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const masteredCount = sortedTopics.filter(t => t.progress && t.progress.masteryScore >= 0.8).length;
  const totalTopics = sortedTopics.length;

  const myIdx = sorted.findIndex(c => c.id === chapter.id);
  const nextChapter = myIdx >= 0 && myIdx < sorted.length - 1 ? sorted[myIdx + 1] : null;
  const nextState = nextChapter ? getChapterState(nextChapter) : null;

  const xpEarned = Math.round(mastery * totalTopics * 150);
  const chapterNum = myIdx + 1;

  const btnLabel = state === 'completed' ? 'Review Chapter' : state === 'in-progress' ? 'Continue Chapter' : 'Start Chapter';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 22px', overflowY: 'auto', height: '100%' }}>

      {/* Close button (mobile only) */}
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(200,200,240,0.70)', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
      )}

      {/* Chapter label */}
      <div>
        <div style={{
          fontSize: 11, color: 'rgba(160,160,200,0.65)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          Chapter {chapterNum}
        </div>
        <h2 style={{
          fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
          fontSize: 'clamp(16px, 2.2vw, 24px)', fontWeight: 900,
          lineHeight: 1.18, color: '#F5F7FF', marginBottom: 10,
        }}>
          {chapter.name}
        </h2>
        <p style={{
          fontSize: 12, color: 'rgba(170,170,210,0.60)',
          fontFamily: "'Nunito', sans-serif", lineHeight: 1.55,
        }}>
          Learn to solve real-world problems with all {totalTopics} topics in this chapter.
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F5F7FF', fontFamily: "'Nunito', sans-serif" }}>Progress</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#FFC93C', fontFamily: "'JetBrains Mono', monospace" }}>{pct}%</span>
        </div>
        <div style={{ height: 11, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.40)' }}>
          <div style={{
            height: '100%', borderRadius: 99, transition: 'width 0.7s ease',
            width: `${pct}%`,
            background: pct >= 80
              ? 'linear-gradient(90deg,#2DD46E,#10B981)'
              : 'linear-gradient(90deg,#6B4BFF,#A080FF)',
            boxShadow: pct >= 80
              ? '0 0 12px rgba(45,212,110,0.55)'
              : '0 0 12px rgba(107,75,255,0.55)',
          }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ borderRadius: 14, padding: '12px 14px', background: 'rgba(255,200,60,0.09)', border: '1px solid rgba(255,200,60,0.22)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,200,60,0.70)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 5, letterSpacing: '0.07em' }}>
            ⭐ XP Earned
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFC93C', fontFamily: "'Bowlby One', sans-serif", lineHeight: 1 }}>
            {xpEarned}
          </div>
        </div>
        <div style={{ borderRadius: 14, padding: '12px 14px', background: 'rgba(45,212,110,0.09)', border: '1px solid rgba(45,212,110,0.22)' }}>
          <div style={{ fontSize: 10, color: 'rgba(45,212,110,0.70)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 5, letterSpacing: '0.07em' }}>
            ✅ Quests Completed
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#2DD46E', fontFamily: "'Bowlby One', sans-serif", lineHeight: 1 }}>
            {masteredCount}/{totalTopics}
          </div>
        </div>
      </div>

      {/* Continue button */}
      {state !== 'locked' && (
        <button
          onClick={() => {
            const first = sortedTopics.find(t => !t.locked);
            if (first) onNavigate(first.id);
          }}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 16,
            background: 'linear-gradient(135deg, #7050FF 0%, #A080FF 100%)',
            border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 900,
            fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
            color: '#fff', letterSpacing: '0.05em',
            boxShadow: '0 7px 0 #3D1EBF, 0 0 24px rgba(107,75,255,0.45)',
            transition: 'transform 0.1s, box-shadow 0.1s',
            flex: 'none',
          }}
          onMouseDown={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(4px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 0 #3D1EBF';
          }}
          onMouseUp={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = '';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 7px 0 #3D1EBF, 0 0 24px rgba(107,75,255,0.45)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = '';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 7px 0 #3D1EBF, 0 0 24px rgba(107,75,255,0.45)';
          }}
        >
          {btnLabel}
        </button>
      )}

      {/* Topic list */}
      <div>
        <div style={{
          fontSize: 11, color: 'rgba(160,160,200,0.55)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 10,
        }}>Topics</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {sortedTopics.map(topic => {
            const ts = topic.locked ? 'locked'
              : !topic.progress ? 'available'
              : topic.progress.masteryScore >= 0.8 ? 'completed' : 'in-progress';
            return (
              <button
                key={topic.id}
                onClick={() => !topic.locked && onNavigate(topic.id)}
                disabled={topic.locked}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 13px', borderRadius: 11, textAlign: 'left', width: '100%',
                  background: ts === 'completed' ? 'rgba(45,212,110,0.09)' : ts === 'in-progress' ? 'rgba(107,75,255,0.11)' : 'rgba(255,255,255,0.04)',
                  border: ts === 'completed' ? '1px solid rgba(45,212,110,0.28)' : ts === 'in-progress' ? '1px solid rgba(107,75,255,0.32)' : '1px solid rgba(255,255,255,0.07)',
                  cursor: topic.locked ? 'not-allowed' : 'pointer',
                  opacity: topic.locked ? 0.40 : 1,
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>
                  {ts === 'completed' ? '✅' : ts === 'locked' ? '🔒' : ts === 'in-progress' ? '🔄' : '▶️'}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: topic.locked ? 'rgba(255,255,255,0.30)' : '#F0F2FF', fontFamily: "'Nunito', sans-serif", lineHeight: 1.3 }}>
                  {topic.name}
                </span>
                {topic.progress && topic.progress.masteryScore > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#FFC93C', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                    {Math.round(topic.progress.masteryScore * 100)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Up Next */}
      {nextChapter && (
        <div>
          <div style={{ fontSize: 11, color: 'rgba(160,160,200,0.55)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 9 }}>
            Up Next
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 15px', borderRadius: 13,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(160,160,200,0.50)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                Chapter {myIdx + 2}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F7FF', fontFamily: "'Nunito', sans-serif" }}>
                {nextChapter.name}
              </div>
            </div>
            <span style={{ fontSize: 18 }}>{nextState === 'locked' ? '🔒' : '→'}</span>
          </div>
        </div>
      )}

      {/* You'll Unlock */}
      {state !== 'completed' && (
        <div>
          <div style={{ fontSize: 11, color: 'rgba(160,160,200,0.55)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 9 }}>
            You&apos;ll Unlock
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 11, background: 'rgba(107,75,255,0.09)', border: '1px solid rgba(107,75,255,0.22)' }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <div>
                <div style={{ fontSize: 12, color: '#F5F7FF', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>New Quests</div>
                <div style={{ fontSize: 10, color: 'rgba(160,160,200,0.55)', fontFamily: "'JetBrains Mono', monospace" }}>{totalTopics * 2} available</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 11, background: 'rgba(255,200,60,0.07)', border: '1px solid rgba(255,200,60,0.20)' }}>
              <span style={{ fontSize: 20 }}>⚔️</span>
              <div>
                <div style={{ fontSize: 12, color: '#F5F7FF', fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Battle Challenge</div>
                <div style={{ fontSize: 10, color: 'rgba(160,160,200,0.55)', fontFamily: "'JetBrains Mono', monospace" }}>vs Classmates</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Legend ──────────────────────────────────────────────────────────────── */

function Legend() {
  const items = [
    { color: '#FFC93C', label: 'Completed',      fill: true  },
    { color: '#8B6FFF', label: 'Current',         fill: true  },
    { color: '#6B4BFF', label: 'Locked',          fill: false },
    { color: 'rgba(255,255,255,0.28)', label: 'Available Later', fill: false },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 22, left: 18,
      padding: '13px 16px', borderRadius: 16,
      background: 'rgba(8,8,22,0.84)', backdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,255,255,0.09)',
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 10,
    }}>
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 11, height: 11, borderRadius: '50%', flexShrink: 0,
            background: item.fill ? item.color : 'transparent',
            border: `2px solid ${item.color}`,
          }} />
          <span style={{ fontSize: 11, color: 'rgba(200,200,235,0.75)', fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function TopicRoadmapPage() {
  const params = useParams<{ subjectId: string }>();
  const router = useRouter();
  const subjectId = params.subjectId ?? '';

  const [chapters,   setChapters]   = useState<Chapter[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/learn/topics/${subjectId}`, { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data: Chapter[] = await res.json();
        setChapters(data);
        const first = data.slice().sort((a, b) => a.orderIndex - b.orderIndex).find(c => getChapterState(c) !== 'locked');
        if (first) setSelectedId(first.id);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [subjectId]);

  const meta = getSubjectMeta(subjectId);
  const sorted = chapters.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const selectedChapter = chapters.find(c => c.id === selectedId) ?? null;

  const handleNavigate = useCallback((topicId: string) => {
    router.push(`/student/learn/${subjectId}/${topicId}/learn`);
  }, [router, subjectId]);

  // Map chapters to SVG node positions
  const nodes = sorted.map((ch, i) => {
    const pt = PATH_POINTS[i % PATH_POINTS.length];
    return { chapter: ch, x: pt.x * SVG_W, y: pt.y * SVG_H };
  });

  const usedNorm = nodes.map(n => ({ x: n.x / SVG_W, y: n.y / SVG_H }));
  const fullPath = buildPathD(usedNorm, SVG_W, SVG_H);

  const completedCount = sorted.filter(c => getChapterState(c) === 'completed').length;
  const donePath = completedCount > 0 ? buildPathD(usedNorm.slice(0, completedCount + 1), SVG_W, SVG_H) : '';

  const titleName = subjectId.charAt(0).toUpperCase() + subjectId.slice(1).replace(/-/g, ' ');

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top header ──────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px',
        background: 'rgba(7,7,18,0.72)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexWrap: 'wrap',
      }}>
        <Link href="/student/learn" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: 'rgba(107,75,255,0.16)', border: '1px solid rgba(107,75,255,0.38)',
          color: '#9070FF', textDecoration: 'none', fontSize: 18,
        }}>←</Link>

        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: `${meta.color}1E`, border: `1.5px solid ${meta.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {meta.icon}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 'clamp(14px,2vw,18px)', fontWeight: 900,
            color: '#F5F7FF', fontFamily: "'Bowlby One', 'Orbitron', sans-serif", lineHeight: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {titleName}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(160,160,200,0.55)', fontFamily: "'Nunito', sans-serif", marginTop: 2 }}>
            {meta.tagline}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Mobile "Details" toggle */}
        {selectedChapter && (
          <button
            className="mobile-details-btn"
            onClick={() => setMobileOpen(v => !v)}
            style={{
              padding: '8px 15px', borderRadius: 11,
              background: 'rgba(107,75,255,0.20)', border: '1px solid rgba(107,75,255,0.42)',
              color: '#A080FF', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Nunito', sans-serif", display: 'none',
            }}
          >
            Details
          </button>
        )}
      </div>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 1 }}>

        {/* ── Left: roadmap canvas ─────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>

          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 400, color: 'rgba(107,75,255,0.70)',
              fontFamily: "'Oswald', sans-serif", fontSize: 14, letterSpacing: '0.18em',
            }}>
              LOADING CHAPTERS…
            </div>
          )}

          {!loading && error && (
            <div style={{ margin: 24, padding: 16, borderRadius: 12, border: '1.5px solid #EF4444', background: 'rgba(239,68,68,0.10)', color: '#EF4444', fontSize: 14 }}>
              Failed to load: {error}
            </div>
          )}

          {!loading && !error && chapters.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 80, color: 'rgba(160,160,210,0.55)', fontFamily: "'Nunito', sans-serif" }}>
              <span style={{ fontSize: 44 }}>📚</span>
              <p>No chapters found for this subject.</p>
            </div>
          )}

          {!loading && !error && chapters.length > 0 && (
            <div style={{ position: 'relative', width: '100%', minHeight: SVG_H }}>
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                width="100%"
                style={{ display: 'block', maxWidth: SVG_W, margin: '0 auto' }}
                preserveAspectRatio="xMidYMin meet"
              >
                <defs>
                  {/* Golden glowing path filter */}
                  <filter id="path-glow-done" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="5" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="path-glow-lock" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <linearGradient id="path-grad-gold" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#FFC93C" />
                    <stop offset="100%" stopColor="#FFE880" />
                  </linearGradient>
                </defs>

                {/* Wide glow halo behind entire path */}
                <path d={fullPath} fill="none" stroke="rgba(255,200,60,0.18)" strokeWidth={30} strokeLinecap="round" filter="url(#path-glow-done)" />

                {/* Locked / remaining path — dashed dim gold */}
                <path d={fullPath} fill="none" stroke="rgba(255,200,60,0.35)" strokeWidth={10} strokeLinecap="round" strokeDasharray="22 12" />

                {/* Completed path — bright gold solid */}
                {donePath && (
                  <>
                    <path d={donePath} fill="none" stroke="url(#path-grad-gold)" strokeWidth={16} strokeLinecap="round" filter="url(#path-glow-done)" />
                    <path d={donePath} fill="none" stroke="rgba(255,240,160,0.85)" strokeWidth={5} strokeLinecap="round" />
                  </>
                )}

                {/* Chapter nodes */}
                {nodes.map(({ chapter, x, y }, i) => {
                  const st = getChapterState(chapter);
                  const ms = getChapterMastery(chapter);
                  return (
                    <ChapterNode
                      key={chapter.id}
                      chapter={chapter}
                      index={i}
                      cx={x} cy={y}
                      state={st}
                      mastery={ms}
                      isSelected={chapter.id === selectedId}
                      onClick={() => {
                        setSelectedId(chapter.id);
                        setMobileOpen(true);
                      }}
                    />
                  );
                })}
              </svg>

              <Legend />
            </div>
          )}
        </div>

        {/* ── Right: Sidebar (desktop) ──────────────────────────────── */}
        <aside
          className="roadmap-sidebar"
          style={{
            width: 'clamp(280px, 28vw, 340px)',
            flexShrink: 0,
            background: 'rgba(8,8,22,0.84)',
            backdropFilter: 'blur(22px)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0 0 0 0',
            position: 'sticky',
            top: 0,
            height: 'calc(100vh - 72px)',
            overflowY: 'auto',
          }}
        >
          <Sidebar
            chapter={selectedChapter}
            allChapters={sorted}
            subjectId={subjectId}
            onNavigate={handleNavigate}
          />
        </aside>

        {/* ── Mobile bottom-sheet ───────────────────────────────────── */}
        {mobileOpen && selectedChapter && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
            onClick={() => setMobileOpen(false)}
          >
            <div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                maxHeight: '80vh', borderRadius: '22px 22px 0 0',
                background: 'rgba(9,9,26,0.97)',
                border: '1px solid rgba(255,255,255,0.10)',
                overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 44, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.22)' }} />
              </div>
              <Sidebar
                chapter={selectedChapter}
                allChapters={sorted}
                subjectId={subjectId}
                onNavigate={handleNavigate}
                onClose={() => setMobileOpen(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Pulse animation + responsive rules ──────────────────────── */}
      <style>{`
        @keyframes nodePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.82; transform: scale(1.04); }
        }
        @media (max-width: 768px) {
          .roadmap-sidebar    { display: none !important; }
          .mobile-details-btn { display: flex !important; }
        }
        @media (max-width: 480px) {
          .roadmap-sidebar    { display: none !important; }
          .mobile-details-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
