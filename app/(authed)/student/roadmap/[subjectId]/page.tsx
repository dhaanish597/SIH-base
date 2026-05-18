'use client';

// ── /student/roadmap/[subjectId] ─────────────────────────────────────────────
// Level 2 — Chapter Branching Map.
// Fetches chapters for the given subject and renders them as medium circular
// nodes on a celestial canvas. Chapters are sequential (each prereqs the prior).

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { computeLayout, type RawNode } from '@/app/lib/roadmapLayout';
import RoadmapCanvas from '@/app/components/roadmap/RoadmapCanvas';

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Constants ────────────────────────────────────────────────────────────────

const BIOME_COLORS: Record<string, string> = {
  math:      '#6B4BFF',
  science:   '#18D6FF',
  english:   '#2DD46E',
  history:   '#FFC93C',
  geography: '#FF4D8A',
  geo:       '#FF4D8A',
  cs:        '#FF8A2B',
  coding:    '#FF8A2B',
  default:   '#6B4BFF',
};

const NODE_RADIUS = 28;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBiomeColor(subjectId: string): string {
  const key = subjectId.toLowerCase();
  for (const [token, color] of Object.entries(BIOME_COLORS)) {
    if (key.includes(token)) return color;
  }
  return BIOME_COLORS.default;
}

function chapterToRawNode(chapter: Chapter, sortedChapters: Chapter[]): RawNode {
  const allTopics = chapter.topics;
  const touchedTopics = allTopics.filter(t => t.progress !== null);
  const masteredTopics = allTopics.filter(t => t.progress && t.progress.masteryScore >= 0.8);

  let state: RawNode['state'];
  if (allTopics.length > 0 && masteredTopics.length === allTopics.length) {
    state = 'completed';
  } else if (touchedTopics.length > 0) {
    state = 'in-progress';
  } else {
    state = 'available';
  }

  // Avg mastery across topics (0 if none)
  const mastery =
    allTopics.length > 0
      ? allTopics.reduce((acc, t) => acc + (t.progress?.masteryScore ?? 0), 0) / allTopics.length
      : 0;

  // Prerequisites: chapter at orderIndex N prereqs chapter at orderIndex N-1
  const myIndex = sortedChapters.findIndex(c => c.id === chapter.id);
  const prereqIds: string[] = myIndex > 0 ? [sortedChapters[myIndex - 1].id] : [];

  // If the previous chapter isn't mastered yet, this one is locked
  if (prereqIds.length > 0) {
    const prev = sortedChapters[myIndex - 1];
    const prevMastery =
      prev.topics.length > 0
        ? prev.topics.filter(t => t.progress && t.progress.masteryScore >= 0.8).length /
          prev.topics.length
        : 0;
    if (prevMastery < 0.8 && touchedTopics.length === 0) {
      state = 'locked';
    }
  }

  return {
    id:        chapter.id,
    label:     chapter.name,
    state,
    mastery,
    prereqIds,
    biomeColor: '#6B4BFF', // will be overridden by canvas biomeColor prop
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChapterRoadmapPage() {
  const params    = useParams<{ subjectId: string }>();
  const subjectId = params.subjectId;
  const router    = useRouter();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/learn/topics/${subjectId}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Chapter[]>;
      })
      .then(data => {
        if (!cancelled) setChapters(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [subjectId]);

  const biomeColor = getBiomeColor(subjectId ?? '');

  // Sort chapters by orderIndex, then compute layout
  const sortedChapters = chapters.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const rawNodes: RawNode[] = sortedChapters.map(ch => chapterToRawNode(ch, sortedChapters));
  const layout = computeLayout(rawNodes, NODE_RADIUS);

  function handleNodeClick(nodeId: string) {
    router.push(`/student/roadmap/${subjectId}/${nodeId}`);
  }

  // Biome CSS class for tinting
  const biomeKey = Object.keys(BIOME_COLORS).find(k => (subjectId ?? '').toLowerCase().includes(k)) ?? 'default';
  const biomeClass = `biome-${biomeKey}`;

  return (
    <div
      className={biomeClass}
      style={{
        minHeight: '100vh',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px 12px', flexShrink: 0 }}>
        <Link
          href="/student/roadmap"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--ink-3, #6F77A6)',
            textDecoration: 'none',
            marginBottom: 12,
            fontFamily: 'var(--f-body, Nunito, sans-serif)',
          }}
        >
          <span style={{ fontSize: 16 }}>←</span> Subjects
        </Link>
        <h1 style={{
          fontFamily: 'var(--f-display, Oxanium, sans-serif)',
          fontSize: 'clamp(18px, 3.5vw, 24px)',
          fontWeight: 800,
          color: 'var(--ink-1, #F5F7FF)',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}>
          Chapter Map
        </h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3, #6F77A6)', fontFamily: 'var(--f-body, Nunito, sans-serif)' }}>
          Click a chapter to explore its topics.
        </p>
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, color: 'var(--ink-3)', fontFamily: 'var(--f-hud)', fontSize: 14, letterSpacing: '0.1em',
          }}>
            Loading chapters…
          </div>
        )}

        {!loading && error && (
          <div style={{
            margin: '24px', padding: '16px', borderRadius: 12,
            border: '1.5px solid #EF4444', background: 'rgba(239,68,68,0.1)',
            color: '#EF4444', fontSize: 14, fontFamily: 'var(--f-body)',
          }}>
            Failed to load chapters: {error}
          </div>
        )}

        {!loading && !error && chapters.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 8, paddingTop: 80, color: 'var(--ink-3)', fontFamily: 'var(--f-body)', fontSize: 14,
          }}>
            <span style={{ fontSize: 40 }}>📚</span>
            <p>No chapters found for this subject.</p>
          </div>
        )}

        {!loading && !error && chapters.length > 0 && (
          <RoadmapCanvas
            layout={layout}
            nodeRadius={NODE_RADIUS}
            biomeColor={biomeColor}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>
    </div>
  );
}
