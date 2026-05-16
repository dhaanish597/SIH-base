'use client';

// ── RoadmapNode ──────────────────────────────────────────────────────────────
// Single reusable SVG node for all three roadmap levels (subject / chapter / topic).

interface RoadmapNodeProps {
  id: string;
  label: string;
  icon?: string;
  state: 'completed' | 'in-progress' | 'available' | 'locked';
  mastery: number;       // 0–1
  radius: number;        // 38 (subject), 28 (chapter), 24 (topic)
  cx: number;
  cy: number;
  biomeColor: string;
  onClick?: () => void;
}

// State-dependent visual config
const STATE_CONFIG: Record<
  RoadmapNodeProps['state'],
  { border: string; fill: string; opacity: number }
> = {
  completed:   { border: '#2DD46E', fill: '#071510', opacity: 1 },
  'in-progress': { border: '', fill: '#0d1535', opacity: 1 },   // border = biomeColor
  available:   { border: '#18D6FF', fill: '#071520', opacity: 1 },
  locked:      { border: '#2D3260', fill: '#0a0a0a', opacity: 0.5 },
};

function getMasteryArc(radius: number, mastery: number): { dasharray: string; dashoffset: number } {
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * mastery;
  const gap    = circumference - filled;
  return {
    dasharray:  `${filled} ${gap}`,
    dashoffset: circumference * 0.25, // rotate so arc starts at top (−90°)
  };
}

function getLabelSize(radius: number): { iconSize: number; labelSize: number; labelOffset: number } {
  if (radius >= 36) return { iconSize: 18, labelSize: 9,  labelOffset: radius + 14 };
  if (radius >= 26) return { iconSize: 14, labelSize: 8,  labelOffset: radius + 12 };
  return               { iconSize: 12, labelSize: 7,  labelOffset: radius + 11 };
}

export default function RoadmapNode({
  id,
  label,
  icon,
  state,
  mastery,
  radius,
  cx,
  cy,
  biomeColor,
  onClick,
}: RoadmapNodeProps) {
  const cfg = STATE_CONFIG[state];
  const borderColor = state === 'in-progress' ? biomeColor : cfg.border;
  const { dasharray, dashoffset } = getMasteryArc(radius, mastery);
  const { iconSize, labelSize, labelOffset } = getLabelSize(radius);
  const pct = Math.round(mastery * 100);
  const filterId = `glow-${id}`;
  const tooltipWidth = Math.min(Math.max(label.length * 6, 60), 160);
  const tooltipX = cx - tooltipWidth / 2;
  const tooltipY = cy - radius - 32;

  // Sub-label below the icon (mastery % or state text)
  const subLabel =
    state === 'locked'
      ? ''
      : state === 'completed'
      ? '✓'
      : state === 'available'
      ? 'New'
      : `${pct}%`;

  return (
    <g
      className="node-group"
      style={{ cursor: state === 'locked' ? 'not-allowed' : 'pointer', opacity: cfg.opacity }}
      onClick={state !== 'locked' ? onClick : undefined}
      aria-label={label}
      role="button"
      tabIndex={state !== 'locked' ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && state !== 'locked' && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* ── Glow filter ──────────────────────────────────────────────────── */}
      <defs>
        <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Glow backdrop ─────────────────────────────────────────────────── */}
      {state !== 'locked' && (
        <circle
          cx={cx}
          cy={cy}
          r={radius + 6}
          fill={borderColor}
          opacity={0.15}
          filter={`url(#${filterId})`}
        />
      )}

      {/* ── Main circle ───────────────────────────────────────────────────── */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={cfg.fill}
        stroke={borderColor}
        strokeWidth={2.5}
      />

      {/* ── Mastery arc ───────────────────────────────────────────────────── */}
      {mastery > 0 && state !== 'locked' && (
        <circle
          cx={cx}
          cy={cy}
          r={radius - 3}
          fill="none"
          stroke={borderColor}
          strokeWidth={2.5}
          strokeDasharray={dasharray}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={0.7}
        />
      )}

      {/* ── Icon / lock ───────────────────────────────────────────────────── */}
      <text
        x={cx}
        y={cy - (subLabel ? 4 : 0)}
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={iconSize}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {state === 'locked' ? '🔒' : (icon ?? '')}
      </text>

      {/* ── Sub-label (mastery % or state hint) ──────────────────────────── */}
      {subLabel && (
        <text
          x={cx}
          y={cy + iconSize * 0.9}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={labelSize - 1}
          fill={state === 'completed' ? '#2DD46E' : state === 'available' ? '#18D6FF' : '#B7BEE0'}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="700"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {subLabel}
        </text>
      )}

      {/* ── Node label below ──────────────────────────────────────────────── */}
      <text
        x={cx}
        y={cy + labelOffset}
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={labelSize}
        fill="#B7BEE0"
        fontFamily="'Oswald', 'Nunito', sans-serif"
        fontWeight="600"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {label.length > 18 ? label.slice(0, 16) + '…' : label}
      </text>

      {/* ── Hover tooltip ─────────────────────────────────────────────────── */}
      <g className="node-tooltip" style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s' }}>
        <rect
          x={tooltipX}
          y={tooltipY}
          width={tooltipWidth}
          height={22}
          rx={5}
          fill="#1F2342"
          stroke="#2D3260"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={tooltipY + 11}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={8}
          fill="#F5F7FF"
          fontFamily="'Nunito', sans-serif"
          fontWeight="600"
          style={{ userSelect: 'none' }}
        >
          {label}
        </text>
      </g>
    </g>
  );
}
