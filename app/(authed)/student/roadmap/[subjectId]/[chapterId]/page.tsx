'use client';

// ── /student/roadmap/[subjectId]/[chapterId] ─────────────────────────────────
// Level 3 — Topic Branching Map.
// Fetches all chapters for the subject, finds the matching chapter, and renders
// its topics as small circular nodes. Clicking a topic opens the TopicSidePanel.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { computeLayout, type RawNode } from '@/app/lib/roadmapLayout';
import RoadmapCanvas from '@/app/components/roadmap/RoadmapCanvas';
import TopicSidePanel from '@/app/components/roadmap/TopicSidePanel';

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

interface SelectedTopic {
  id: string;
  name: string;
  chapterName: string;
  progress: {
    masteryScore: number;
    learnScore: number | null;
    playScore: number | null;
    practiceScore: number | null;
    quizScore: number | null;
  } | null;
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

const NODE_RADIUS = 24;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBiomeColor(subjectId: string): string {
  const key = subjectId.toLowerCase();
  for (const [token, color] of Object.entries(BIOME_COLORS)) {
    if (key.includes(token)) return color;
  }
  return BIOME_COLORS.default;
}

function topicToRawNode(topic: Topic, sortedTopics: Topic[], biomeColor: string): RawNode {
  let state: RawNode['state'];
  if (topic.locked) {
    state = 'locked';
  } else if (!topic.progress) {
    state = 'available';
  } else if (topic.progress.masteryScore >= 0.8) {
    state = 'completed';
  } else {
    state = 'in-progress';
  }

  const mastery = topic.progress?.masteryScore ?? 0;

  // Sequential prereqs: topic at orderIndex N prereqs topic at orderIndex N-1
  const myIndex = sortedTopics.findIndex(t => t.id === topic.id);
  const prereqIds: string[] = myIndex > 0 ? [sortedTopics[myIndex - 1].id] : [];

  return {
    id:        topic.id,
    label:     topic.name,
    state,
    mastery,
    prereqIds,
    biomeColor,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TopicRoadmapPage() {
  const params     = useParams<{ subjectId: string; chapterId: string }>();
  const subjectId  = params.subjectId;
  const chapterId  = params.chapterId;
  const router     = useRouter();

  const [chapters,       setChapters]       = useState<Chapter[]>([]);
  const [loading,        setLoading]         = useState(true);
  const [error,          setError]           = useState<string | null>(null);
  const [selectedTopic,  setSelectedTopic]   = useState<SelectedTopic | null>(null);

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

  // Find the chapter matching chapterId
  const currentChapter = chapters.find(c => c.id === chapterId) ?? null;
  const chapterName    = currentChapter?.name ?? 'Chapter';

  const biomeColor = getBiomeColor(subjectId ?? '');

  // Sort topics by orderIndex, then compute layout
  const sortedTopics = (currentChapter?.topics ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const rawNodes: RawNode[] = sortedTopics.map(t => topicToRawNode(t, sortedTopics, biomeColor));
  const layout = computeLayout(rawNodes, NODE_RADIUS);

  function handleNodeClick(nodeId: string) {
    const topic = sortedTopics.find(t => t.id === nodeId);
    if (!topic || topic.locked) return;

    setSelectedTopic({
      id:          topic.id,
      name:        topic.name,
      chapterName,
      progress:    topic.progress
        ? {
            masteryScore:   topic.progress.masteryScore,
            learnScore:     topic.progress.learnScore,
            playScore:      topic.progress.playScore,
            practiceScore:  topic.progress.practiceScore,
            quizScore:      topic.progress.quizScore,
          }
        : null,
    });
  }

  // Biome class for CSS tinting
  const biomeKey = Object.keys(BIOME_COLORS).find(k => (subjectId ?? '').toLowerCase().includes(k)) ?? 'default';
  const biomeClass = `biome-${biomeKey}`;

  return (
    <div
      className={biomeClass}
      style={{
        minHeight: '100vh',
        background: 'var(--bg-deep, #060614)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px 12px', flexShrink: 0 }}>
        <Link
          href={`/student/roadmap/${subjectId}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--ink-3, #6F77A6)', textDecoration: 'none',
            marginBottom: 12, fontFamily: 'var(--f-body, Nunito, sans-serif)',
          }}
        >
          <span style={{ fontSize: 16 }}>←</span> Chapters
        </Link>

        <h1 style={{
          fontFamily: 'var(--f-display, Oxanium, sans-serif)',
          fontSize: 'clamp(16px, 3vw, 22px)',
          fontWeight: 800,
          color: 'var(--ink-1, #F5F7FF)',
          letterSpacing: '0.04em',
          marginBottom: 4,
        }}>
          {loading ? 'Loading…' : chapterName}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3, #6F77A6)', fontFamily: 'var(--f-body, Nunito, sans-serif)' }}>
          Click a topic to see details and continue learning.
        </p>
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 300, color: 'var(--ink-3)', fontFamily: 'var(--f-hud)', fontSize: 14, letterSpacing: '0.1em',
          }}>
            Loading topics…
          </div>
        )}

        {!loading && error && (
          <div style={{
            margin: '24px', padding: '16px', borderRadius: 12,
            border: '1.5px solid #EF4444', background: 'rgba(239,68,68,0.1)',
            color: '#EF4444', fontSize: 14, fontFamily: 'var(--f-body)',
          }}>
            Failed to load topics: {error}
          </div>
        )}

        {!loading && !error && sortedTopics.length === 0 && !currentChapter && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 8, paddingTop: 80, color: 'var(--ink-3)', fontFamily: 'var(--f-body)', fontSize: 14,
          }}>
            <span style={{ fontSize: 40 }}>📖</span>
            <p>Chapter not found or has no topics.</p>
            <button
              onClick={() => router.push(`/student/roadmap/${subjectId}`)}
              style={{
                marginTop: 8, padding: '8px 16px', borderRadius: 8,
                border: '1.5px solid #6B4BFF', background: 'transparent',
                color: '#8A6DFF', cursor: 'pointer', fontSize: 13,
              }}
            >
              ← Back to chapters
            </button>
          </div>
        )}

        {!loading && !error && sortedTopics.length > 0 && (
          <RoadmapCanvas
            layout={layout}
            nodeRadius={NODE_RADIUS}
            biomeColor={biomeColor}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>

      {/* Topic side panel */}
      <TopicSidePanel
        topic={selectedTopic}
        subjectId={subjectId ?? ''}
        onClose={() => setSelectedTopic(null)}
      />
    </div>
  );
}
