'use client';

// ── RoadmapCanvas ────────────────────────────────────────────────────────────
// SVG wrapper that renders the celestial background, all edges, and all nodes.
// Always fills the full viewport height; scrollable if content is taller.

import type { RoadmapLayout } from '@/app/lib/roadmapLayout';
import RoadmapEdge from './RoadmapEdge';
import RoadmapNode from './RoadmapNode';

interface RoadmapCanvasProps {
  layout: RoadmapLayout;
  nodeRadius: number;
  biomeColor: string;
  onNodeClick: (nodeId: string) => void;
}

// Stars: [cx%, cy%, r, opacity]
const STARS: Array<[number, number, number, number]> = [
  // Bright large stars
  [8,   6,  2.5, 0.95], [22,  3,  2.0, 0.90], [47,  8,  2.8, 0.95],
  [71,  4,  2.2, 0.85], [88,  9,  3.0, 0.98], [95,  18, 2.5, 0.90],
  [15,  25, 2.0, 0.88], [38,  19, 2.4, 0.92], [62,  22, 2.6, 0.85],
  [84,  30, 2.0, 0.90],
  // Medium stars
  [5,   38, 1.5, 0.70], [18,  44, 1.8, 0.65], [33,  35, 1.6, 0.75],
  [55,  40, 1.4, 0.68], [74,  48, 1.7, 0.72], [91,  42, 1.5, 0.80],
  [11,  57, 1.6, 0.68], [28,  62, 1.8, 0.75], [48,  55, 1.4, 0.65],
  [68,  60, 1.7, 0.70], [86,  58, 1.5, 0.78],
  // Small dim stars
  [3,   72, 1.0, 0.50], [14,  78, 1.1, 0.45], [25,  68, 0.9, 0.55],
  [40,  74, 1.2, 0.50], [58,  70, 1.0, 0.48], [73,  76, 1.1, 0.52],
  [89,  72, 0.9, 0.45], [6,   86, 1.2, 0.55], [20,  91, 1.0, 0.48],
  [35,  84, 1.1, 0.50], [52,  88, 0.9, 0.45], [66,  83, 1.2, 0.52],
  [80,  89, 1.0, 0.48], [93,  85, 1.1, 0.55],
  // Tiny twinkle dots
  [10,  15, 0.7, 0.40], [30,  10, 0.8, 0.45], [50,  16, 0.7, 0.38],
  [65,  12, 0.9, 0.42], [78,  18, 0.7, 0.40], [44,  32, 0.8, 0.38],
  [82,  65, 0.7, 0.42], [57,  93, 0.8, 0.40], [7,   96, 0.7, 0.38],
  [97,  54, 0.8, 0.42], [42,  48, 0.7, 0.35], [23,  85, 0.8, 0.40],
  [77,  32, 0.7, 0.38], [60,  5,  0.9, 0.44], [34,  67, 0.7, 0.36],
];

export default function RoadmapCanvas({
  layout,
  nodeRadius,
  biomeColor,
  onNodeClick,
}: RoadmapCanvasProps) {
  const pad = nodeRadius * 2;
  // Content dimensions from layout
  const contentW = layout.width  + pad * 2;
  const contentH = layout.height + pad * 2;

  // SVG must be at least full viewport; scrollable beyond that
  const svgWidth  = Math.max(contentW, 900);
  const svgHeight = Math.max(contentH, 700);

  const nodeById = new Map(layout.nodes.map(n => [n.id, n]));

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 80px)',
        overflowX: 'auto',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
      }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', minWidth: '100%' }}
      >
        {/* ── Defs ──────────────────────────────────────────────────────── */}
        <defs>
          {/* Deep space base — rich dark blue like the reference */}
          <radialGradient id="bg-base" cx="42%" cy="38%" r="72%">
            <stop offset="0%"   stopColor="#0d1b52" />
            <stop offset="35%"  stopColor="#080e30" />
            <stop offset="70%"  stopColor="#050920" />
            <stop offset="100%" stopColor="#020510" />
          </radialGradient>

          {/* Bright blue-white nebula — centre, dominant glow */}
          <radialGradient id="nebula-main" cx="45%" cy="40%" r="52%">
            <stop offset="0%"   stopColor="#5ab4ff" stopOpacity="0.65" />
            <stop offset="20%"  stopColor="#3d8bef" stopOpacity="0.50" />
            <stop offset="45%"  stopColor="#1e4fa8" stopOpacity="0.28" />
            <stop offset="75%"  stopColor="#0a1f6e" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#020510"  stopOpacity="0"   />
          </radialGradient>

          {/* Violet nebula — upper left */}
          <radialGradient id="nebula-violet" cx="20%" cy="20%" r="40%">
            <stop offset="0%"   stopColor="#9f6fff" stopOpacity="0.55" />
            <stop offset="35%"  stopColor="#5c2db8" stopOpacity="0.30" />
            <stop offset="70%"  stopColor="#2d1070" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#020510"  stopOpacity="0"   />
          </radialGradient>

          {/* Second violet cloud — right side */}
          <radialGradient id="nebula-violet2" cx="80%" cy="55%" r="35%">
            <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.40" />
            <stop offset="50%"  stopColor="#4c1d95" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#020510"  stopOpacity="0"   />
          </radialGradient>

          {/* Cyan aurora — bottom edge */}
          <radialGradient id="nebula-cyan" cx="50%" cy="95%" r="55%">
            <stop offset="0%"   stopColor="#06c8e8" stopOpacity="0.35" />
            <stop offset="40%"  stopColor="#0891b2" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#020510"  stopOpacity="0"   />
          </radialGradient>

          {/* Gold warm glow — upper right corner */}
          <radialGradient id="nebula-gold" cx="88%" cy="8%" r="30%">
            <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.32" />
            <stop offset="50%"  stopColor="#b45309" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#020510"  stopOpacity="0"   />
          </radialGradient>

          {/* Teal secondary glow — mid-left */}
          <radialGradient id="nebula-teal" cx="12%" cy="60%" r="32%">
            <stop offset="0%"   stopColor="#0d9488" stopOpacity="0.28" />
            <stop offset="55%"  stopColor="#064e3b" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#020510"  stopOpacity="0"   />
          </radialGradient>

          {/* Biome accent overlay */}
          <radialGradient id="nebula-biome" cx="50%" cy="50%" r="60%">
            <stop offset="0%"   stopColor={biomeColor} stopOpacity="0.14" />
            <stop offset="55%"  stopColor={biomeColor} stopOpacity="0.05" />
            <stop offset="100%" stopColor={biomeColor} stopOpacity="0"    />
          </radialGradient>

          {/* Star glow filter */}
          <filter id="star-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Star spike filter */}
          <filter id="star-spike" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Cloud softening filter */}
          <filter id="cloud-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        {/* ── Sky layers (back to front) ───────────────────────────────── */}
        <rect width="100%" height="100%" fill="url(#bg-base)" />
        <rect width="100%" height="100%" fill="url(#nebula-violet)" />
        <rect width="100%" height="100%" fill="url(#nebula-main)" />
        <rect width="100%" height="100%" fill="url(#nebula-violet2)" />
        <rect width="100%" height="100%" fill="url(#nebula-cyan)" />
        <rect width="100%" height="100%" fill="url(#nebula-gold)" />
        <rect width="100%" height="100%" fill="url(#nebula-teal)" />
        <rect width="100%" height="100%" fill="url(#nebula-biome)" />

        {/* ── Soft cloud blobs for depth ───────────────────────────────── */}
        <ellipse cx="42%" cy="38%" rx="28%" ry="18%" fill="#2d6abf" opacity="0.18" filter="url(#cloud-blur)" />
        <ellipse cx="22%" cy="22%" rx="18%" ry="12%" fill="#6b3fd4" opacity="0.22" filter="url(#cloud-blur)" />
        <ellipse cx="70%" cy="50%" rx="16%" ry="10%" fill="#4c1d95" opacity="0.18" filter="url(#cloud-blur)" />
        <ellipse cx="50%" cy="92%" rx="22%" ry="8%"  fill="#0891b2" opacity="0.20" filter="url(#cloud-blur)" />

        {/* ── Stars ──────────────────────────────────────────────────────── */}
        {STARS.map(([cx, cy, r, opacity], i) => (
          <g key={i}>
            {r >= 2 && (
              <circle cx={`${cx}%`} cy={`${cy}%`} r={r * 3.5} fill="white" opacity={opacity * 0.30} filter="url(#star-glow)" />
            )}
            <circle cx={`${cx}%`} cy={`${cy}%`} r={r} fill="white" opacity={opacity} filter="url(#star-spike)" />
          </g>
        ))}

        {/* ── Cross spikes on 5 brightest stars ──────────────────────────── */}
        {([
          [88, 9, 3.0], [47, 8, 2.8], [8, 6, 2.5], [71, 4, 2.2], [22, 3, 2.0],
        ] as [number,number,number][]).map(([cx, cy, r], i) => (
          <g key={`spike-${i}`} opacity={0.75}>
            <line x1={`${cx}%`} y1={`calc(${cy}% - ${r*7}px)`} x2={`${cx}%`} y2={`calc(${cy}% + ${r*7}px)`} stroke="white" strokeWidth={0.7} opacity={0.6} />
            <line x1={`calc(${cx}% - ${r*7}px)`} y1={`${cy}%`} x2={`calc(${cx}% + ${r*7}px)`} y2={`${cy}%`} stroke="white" strokeWidth={0.7} opacity={0.6} />
          </g>
        ))}

        {/* ── Crescent moon — upper left ──────────────────────────────── */}
        <g opacity="0.85">
          <circle cx="8%" cy="8%" r="28" fill="#e8d99a" />
          <circle cx="11%" cy="7%" r="24" fill="#050920" />
        </g>

        {/* ── Floating planet orbs ────────────────────────────────────── */}
        {/* Large blue planet — upper right */}
        <circle cx="80%" cy="12%" r="26" fill="#1a3d8f" opacity="0.55" />
        <circle cx="80%" cy="12%" r="22" fill="none" stroke="#4a90e2" strokeWidth="2" opacity="0.45" />
        <circle cx="77%" cy="10%" r="8"  fill="#2563eb" opacity="0.30" />

        {/* Small purple planet — left mid */}
        <circle cx="6%"  cy="55%" r="16" fill="#4c1d95" opacity="0.45" />
        <circle cx="6%"  cy="55%" r="13" fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.35" />

        {/* Tiny cyan orb — right bottom */}
        <circle cx="92%" cy="70%" r="10" fill="#0e7490" opacity="0.40" />

        {/* ── Gold constellation lines ──────────────────────────────────── */}
        <g opacity="0.28" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="3 5">
          <line x1="8%" y1="6%" x2="22%" y2="3%" />
          <line x1="22%" y1="3%" x2="47%" y2="8%" />
          <line x1="47%" y1="8%" x2="71%" y2="4%" />
          <line x1="71%" y1="4%" x2="88%" y2="9%" />
        </g>

        {/* ── Winding glowing gold path (decorative trail) ──────────────── */}
        <path
          d={`M ${svgWidth * 0.08} ${svgHeight * 0.88}
              C ${svgWidth * 0.22} ${svgHeight * 0.72},
                ${svgWidth * 0.18} ${svgHeight * 0.55},
                ${svgWidth * 0.42} ${svgHeight * 0.48}
              C ${svgWidth * 0.62} ${svgHeight * 0.42},
                ${svgWidth * 0.52} ${svgHeight * 0.25},
                ${svgWidth * 0.80} ${svgHeight * 0.15}`}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3"
          strokeDasharray="9 6"
          opacity="0.38"
          strokeLinecap="round"
        />
        {/* Second path, offset */}
        <path
          d={`M ${svgWidth * 0.05} ${svgHeight * 0.90}
              C ${svgWidth * 0.20} ${svgHeight * 0.74},
                ${svgWidth * 0.16} ${svgHeight * 0.57},
                ${svgWidth * 0.40} ${svgHeight * 0.50}
              C ${svgWidth * 0.60} ${svgHeight * 0.44},
                ${svgWidth * 0.50} ${svgHeight * 0.27},
                ${svgWidth * 0.78} ${svgHeight * 0.17}`}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1"
          strokeDasharray="4 8"
          opacity="0.20"
          strokeLinecap="round"
        />

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
                x1={from.x} y1={from.y}
                x2={to.x}   y2={to.y}
                color={biomeColor}
                opacity={0.7}
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

      <style>{`
        .node-group .node-tooltip { opacity: 0; transition: opacity 0.15s; }
        .node-group:hover .node-tooltip { opacity: 1; }
      `}</style>
    </div>
  );
}
