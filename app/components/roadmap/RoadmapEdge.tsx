'use client';

// ── RoadmapEdge ──────────────────────────────────────────────────────────────
// Curved dashed SVG path between two points in the roadmap canvas.

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
  color = '#2D3260',
  opacity = 0.6,
}: RoadmapEdgeProps) {
  // Cubic bezier control points — curve bulges inward between the two nodes.
  // cp1 is anchored near (x1, y1) pulled 40% of the vertical distance upward.
  // cp2 is anchored near (x2, y2) pulled 40% of the vertical distance downward.
  const dy = y1 - y2; // positive when y1 > y2 (parent is below child)
  const cp1x = x1;
  const cp1y = y1 - dy * 0.4;
  const cp2x = x2;
  const cp2y = y2 + dy * 0.4;

  const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray="7 5"
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}
