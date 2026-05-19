'use client';

// ── RoadmapEdge ──────────────────────────────────────────────────────────────
// Glowing curved dashed SVG path between two nodes.

interface RoadmapEdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  opacity?: number;
}

export default function RoadmapEdge({
  x1,
  y1,
  x2,
  y2,
  color = '#FFC93C',
  opacity = 0.7,
}: RoadmapEdgeProps) {
  const dy = y1 - y2;
  const dx = x2 - x1;
  const cp1x = x1 + dx * 0.15;
  const cp1y = y1 - dy * 0.45;
  const cp2x = x2 - dx * 0.15;
  const cp2y = y2 + dy * 0.45;

  const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

  return (
    <g>
      {/* Glow layer behind the dashed line */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        opacity={opacity * 0.18}
      />
      {/* Main dashed line */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="8 5"
        strokeLinecap="round"
        opacity={opacity}
      />
    </g>
  );
}
