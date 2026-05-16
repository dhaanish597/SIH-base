'use client';

// ── RoadmapCanvas ────────────────────────────────────────────────────────────
// SVG wrapper that renders the celestial background, all edges, and all nodes.
// Scrollable both vertically and horizontally if the content exceeds viewport.

import type { RoadmapLayout } from '@/app/lib/roadmapLayout';
import RoadmapEdge from './RoadmapEdge';
import RoadmapNode from './RoadmapNode';

interface RoadmapCanvasProps {
  layout: RoadmapLayout;
  nodeRadius: number;
  biomeColor: string;
  onNodeClick: (nodeId: string) => void;
}

// ~25 hardcoded star positions (cx%, cy%, r, opacity) to spread across viewBox
const STARS: Array<[number, number, number, number]> = [
  [5,   8,  1.2, 0.5],
  [12,  22, 1.0, 0.3],
  [18,  5,  1.5, 0.6],
  [25,  35, 1.0, 0.4],
  [32,  14, 1.3, 0.5],
  [38,  48, 0.8, 0.3],
  [44,  7,  1.1, 0.4],
  [50,  28, 1.4, 0.6],
  [57,  18, 0.9, 0.3],
  [63,  40, 1.2, 0.5],
  [70,  10, 1.5, 0.4],
  [76,  55, 1.0, 0.3],
  [82,  22, 1.3, 0.6],
  [88,  38, 0.8, 0.4],
  [94,  12, 1.1, 0.5],
  [9,   68, 1.2, 0.3],
  [20,  80, 1.0, 0.4],
  [30,  62, 1.4, 0.5],
  [42,  75, 0.9, 0.3],
  [55,  85, 1.3, 0.6],
  [65,  70, 1.1, 0.4],
  [75,  88, 0.8, 0.3],
  [85,  65, 1.5, 0.5],
  [92,  78, 1.0, 0.4],
  [48,  92, 1.2, 0.3],
];

export default function RoadmapCanvas({
  layout,
  nodeRadius,
  biomeColor,
  onNodeClick,
}: RoadmapCanvasProps) {
  const pad = nodeRadius * 2;
  const svgWidth  = layout.width  + pad * 2;
  const svgHeight = layout.height + pad * 2;

  // Build an index for quick node lookup
  const nodeById = new Map(layout.nodes.map(n => [n.id, n]));

  return (
    <div
      style={{
        overflow: 'auto',
        width: '100%',
        minHeight: '100%',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {/* ── Defs: gradients, filters ─────────────────────────────────── */}
        <defs>
          <radialGradient id="nbg1" cx="30%" cy="40%" r="70%">
            <stop offset="0%"   stopColor="#0d1035" />
            <stop offset="100%" stopColor="#060614" />
          </radialGradient>

          <radialGradient id="nbg2" cx="70%" cy="70%" r="50%">
            <stop offset="0%"   stopColor="#071520" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#060614" stopOpacity="0" />
          </radialGradient>

          {/* Biome nebula */}
          <radialGradient id="nbg-biome" cx="55%" cy="35%" r="45%">
            <stop offset="0%"   stopColor={biomeColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor={biomeColor} stopOpacity="0"    />
          </radialGradient>

          <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Celestial background ─────────────────────────────────────── */}
        {/* Base nebula */}
        <rect width="100%" height="100%" fill="url(#nbg1)" />
        {/* Secondary nebula layer */}
        <rect width="100%" height="100%" fill="url(#nbg2)" />
        {/* Biome accent */}
        <rect width="100%" height="100%" fill="url(#nbg-biome)" />

        {/* Stars */}
        {STARS.map(([cx, cy, r, opacity], i) => (
          <circle
            key={i}
            cx={`${cx}%`}
            cy={`${cy}%`}
            r={r}
            fill="white"
            opacity={opacity}
            filter="url(#starGlow)"
          />
        ))}

        {/* ── Offset group so nodes are padded from SVG edge ──────────── */}
        <g transform={`translate(${pad}, ${pad})`}>
          {/* Edges (drawn below nodes) */}
          {layout.edges.map(edge => {
            const from = nodeById.get(edge.fromId);
            const to   = nodeById.get(edge.toId);
            if (!from || !to) return null;
            return (
              <RoadmapEdge
                key={`${edge.fromId}-${edge.toId}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                color={biomeColor}
                opacity={0.4}
              />
            );
          })}

          {/* Nodes */}
          {layout.nodes.map(node => (
            <RoadmapNode
              key={node.id}
              id={node.id}
              label={node.label}
              icon={node.icon}
              state={node.state}
              mastery={node.mastery}
              radius={nodeRadius}
              cx={node.x}
              cy={node.y}
              biomeColor={biomeColor}
              onClick={() => onNodeClick(node.id)}
            />
          ))}
        </g>
      </svg>

      {/* Tooltip CSS via <style> embedded in the component */}
      <style>{`
        .node-group .node-tooltip { opacity: 0; transition: opacity 0.15s; }
        .node-group:hover .node-tooltip { opacity: 1; }
      `}</style>
    </div>
  );
}
