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

function deriveIconKey(s: Subject): string {
  if (s.iconKey) return s.iconKey.toLowerCase();
  // Derive from name when iconKey is null
  const name = s.name.toLowerCase();
  for (const token of Object.keys(BIOME_COLORS)) {
    if (name.includes(token)) return token;
  }
  return 'default';
}

function subjectToRawNode(s: Subject): RawNode {
  const biomeKey = deriveIconKey(s);
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
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 64px)' }}>
      {/* Canvas — full bleed, provides its own celestial background */}
      {!loading && (
        <RoadmapCanvas
          layout={layout}
          nodeRadius={NODE_RADIUS}
          biomeColor="#6B4BFF"
          onNodeClick={handleNodeClick}
        />
      )}

      {/* Loading state on top of (still dark) background */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6F77A6', fontFamily: 'Oswald, sans-serif',
          fontSize: 14, letterSpacing: '0.15em',
        }}>
          LOADING SUBJECTS…
        </div>
      )}

      {/* Title overlay — sits on top of SVG canvas */}
      {!loading && (
        <div style={{
          position: 'absolute', top: 20, left: 24, pointerEvents: 'none',
        }}>
          <h1 style={{
            fontFamily: 'var(--f-display, Oxanium, sans-serif)',
            fontSize: 'clamp(18px, 3.5vw, 26px)',
            fontWeight: 800,
            color: '#F5F7FF',
            marginBottom: 2,
            letterSpacing: '0.06em',
            textShadow: '0 0 20px rgba(107,75,255,0.8), 0 2px 8px rgba(0,0,0,0.9)',
          }}>
            🗺️ Learning Roadmap
          </h1>
          <p style={{
            fontSize: 12, color: '#9BA4C8',
            fontFamily: 'var(--f-body, Nunito, sans-serif)',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            Choose a subject to explore its chapters and topics.
          </p>
        </div>
      )}
    </div>
  );
}
