'use client';

// ── /student/roadmap ─────────────────────────────────────────────────────────
// Level 1 — Subject World Map.
// Fetches all subjects for the student and renders them as glowing circular
// nodes on a celestial canvas using the roadmap layout algorithm.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { computeLayout, type RawNode } from '@/app/lib/roadmapLayout';
import RoadmapCanvas from '@/app/components/roadmap/RoadmapCanvas';

// ── Types ────────────────────────────────────────────────────────────────────

interface Subject {
  id: string;
  name: string;
  iconKey: string;
  avgMastery: number;
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

const SUBJECT_ICONS: Record<string, string> = {
  math:      '📐',
  science:   '🔬',
  english:   '📖',
  history:   '🏛️',
  geography: '🌍',
  geo:       '🌍',
  cs:        '💻',
  coding:    '💻',
  default:   '📚',
};

const PLACEHOLDER_SUBJECTS: Subject[] = [
  { id: 'math',      name: 'Mathematics',       iconKey: 'math',      avgMastery: 0 },
  { id: 'science',   name: 'Science',            iconKey: 'science',   avgMastery: 0 },
  { id: 'english',   name: 'English',            iconKey: 'english',   avgMastery: 0 },
  { id: 'history',   name: 'History',            iconKey: 'history',   avgMastery: 0 },
  { id: 'geography', name: 'Geography',          iconKey: 'geography', avgMastery: 0 },
  { id: 'cs',        name: 'Computer Science',   iconKey: 'cs',        avgMastery: 0 },
];

const NODE_RADIUS = 38;

// ── Helpers ──────────────────────────────────────────────────────────────────

function subjectToRawNode(s: Subject): RawNode {
  const biomeKey = s.iconKey.toLowerCase();
  const biomeColor = BIOME_COLORS[biomeKey] ?? BIOME_COLORS.default;
  const icon       = SUBJECT_ICONS[biomeKey] ?? SUBJECT_ICONS.default;

  let state: RawNode['state'];
  if (s.avgMastery >= 0.8) state = 'completed';
  else if (s.avgMastery > 0) state = 'in-progress';
  else state = 'available';

  return {
    id:         s.id,
    label:      s.name,
    icon,
    state,
    mastery:    s.avgMastery,
    prereqIds:  [], // all subjects always unlocked
    biomeColor,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch('/api/learn/subjects', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Subject[]>;
      })
      .then(data => {
        if (!cancelled) {
          setSubjects(Array.isArray(data) && data.length > 0 ? data : PLACEHOLDER_SUBJECTS);
        }
      })
      .catch(() => {
        if (!cancelled) setSubjects(PLACEHOLDER_SUBJECTS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const rawNodes = subjects.map(subjectToRawNode);
  const layout   = computeLayout(rawNodes, NODE_RADIUS);

  function handleNodeClick(nodeId: string) {
    router.push(`/student/roadmap/${nodeId}`);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-deep, #060614)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Page header */}
      <div style={{ padding: '24px 24px 16px', flexShrink: 0 }}>
        <h1 style={{
          fontFamily: 'var(--f-display, Oxanium, sans-serif)',
          fontSize: 'clamp(20px, 4vw, 28px)',
          fontWeight: 800,
          color: 'var(--ink-1, #F5F7FF)',
          marginBottom: 4,
          letterSpacing: '0.04em',
        }}>
          🗺️ Learning Roadmap
        </h1>
        <p style={{
          fontSize: 13,
          color: 'var(--ink-3, #6F77A6)',
          fontFamily: 'var(--f-body, Nunito, sans-serif)',
        }}>
          Choose a subject to explore its chapters and topics.
        </p>
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
            color: 'var(--ink-3, #6F77A6)',
            fontFamily: 'var(--f-hud, Oswald, sans-serif)',
            fontSize: 14,
            letterSpacing: '0.1em',
          }}>
            Loading subjects…
          </div>
        ) : (
          <RoadmapCanvas
            layout={layout}
            nodeRadius={NODE_RADIUS}
            biomeColor="#6B4BFF"
            onNodeClick={handleNodeClick}
          />
        )}
      </div>
    </div>
  );
}
