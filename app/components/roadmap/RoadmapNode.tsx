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

// Ring + fill colours per state
function getStateColors(state: RoadmapNodeProps['state'], biomeColor: string) {
  switch (state) {
    case 'completed':   return { ring: '#2DD46E', fill: '#0a2518', glow: 'rgba(45,212,110,0.5)',  ringWidth: 3.5 };
    case 'in-progress': return { ring: biomeColor, fill: '#0d0f2a', glow: `${biomeColor}88`,       ringWidth: 3.5 };
    case 'available':   return { ring: '#FFC93C', fill: '#1a1200', glow: 'rgba(255,201,60,0.55)', ringWidth: 3.5 };
    case 'locked':      return { ring: '#2D3260', fill: '#0a0a14', glow: 'rgba(45,50,96,0.3)',    ringWidth: 2   };
  }
}

function getMasteryArc(radius: number, mastery: number) {
  const circumference = 2 * Math.PI * (radius - 4);
  const filled = circumference * mastery;
  const gap    = circumference - filled;
  return { dasharray: `${filled} ${gap}`, dashoffset: circumference * 0.25 };
}

function getLabelSize(radius: number) {
  if (radius >= 36) return { iconSize: 20, labelSize: 10, labelOffset: radius + 16 };
  if (radius >= 26) return { iconSize: 15, labelSize: 9,  labelOffset: radius + 13 };
  return                   { iconSize: 12, labelSize: 8,  labelOffset: radius + 12 };
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
  const { ring, fill, glow, ringWidth } = getStateColors(state, biomeColor);
  const { dasharray, dashoffset } = getMasteryArc(radius, mastery);
  const { iconSize, labelSize, labelOffset } = getLabelSize(radius);
  const pct = Math.round(mastery * 100);
  const filterId  = `glow-${id}`;
  const gradId    = `fill-${id}`;
  const tooltipW  = Math.min(Math.max(label.length * 6.5, 70), 170);
  const tooltipX  = cx - tooltipW / 2;
  const tooltipY  = cy - radius - 34;
  const isLocked  = state === 'locked';

  const subLabel =
    isLocked           ? ''
    : state === 'completed'   ? '✓'
    : state === 'available'   ? 'Start'
    : `${pct}%`;

  return (
    <g
      className="node-group"
      style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.45 : 1 }}
      onClick={!isLocked ? onClick : undefined}
      aria-label={label}
      role="button"
      tabIndex={!isLocked ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isLocked && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <defs>
        <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Radial fill gradient — darker centre, lighter edge */}
        <radialGradient id={gradId} cx="35%" cy="30%" r="70%">
          <stop offset="0%"   stopColor={fill} stopOpacity="1" />
          <stop offset="100%" stopColor="#000010" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* ── Outer glow halo ────────────────────────────────────────────── */}
      {!isLocked && (
        <circle
          cx={cx}
          cy={cy}
          r={radius + 10}
          fill={glow}
          opacity={0.40}
          filter={`url(#${filterId})`}
        />
      )}

      {/* ── Outer ring ─────────────────────────────────────────────────── */}
      <circle
        cx={cx}
        cy={cy}
        r={radius + 3}
        fill="none"
        stroke={ring}
        strokeWidth={ringWidth}
        opacity={isLocked ? 0.4 : 0.85}
      />

      {/* ── Main circle with gradient fill ─────────────────────────────── */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={`url(#${gradId})`}
        stroke={ring}
        strokeWidth={1.5}
        opacity={0.95}
      />

      {/* ── Inner shine highlight ───────────────────────────────────────── */}
      {!isLocked && (
        <ellipse
          cx={cx - radius * 0.22}
          cy={cy - radius * 0.30}
          rx={radius * 0.35}
          ry={radius * 0.20}
          fill="white"
          opacity={0.12}
        />
      )}

      {/* ── Mastery arc overlay ─────────────────────────────────────────── */}
      {mastery > 0 && !isLocked && (
        <circle
          cx={cx}
          cy={cy}
          r={radius - 4}
          fill="none"
          stroke={ring}
          strokeWidth={3}
          strokeDasharray={dasharray}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={0.6}
        />
      )}

      {/* ── Icon ───────────────────────────────────────────────────────── */}
      <text
        x={cx}
        y={cy - (subLabel ? radius * 0.18 : 0)}
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={iconSize}
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {isLocked ? '🔒' : (icon ?? '')}
      </text>

      {/* ── Sub-label ──────────────────────────────────────────────────── */}
      {subLabel && (
        <text
          x={cx}
          y={cy + radius * 0.42}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={labelSize}
          fill={state === 'completed' ? '#2DD46E' : state === 'available' ? '#FFC93C' : '#B7BEE0'}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="800"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {subLabel}
        </text>
      )}

      {/* ── Node name below the circle ─────────────────────────────────── */}
      <text
        x={cx}
        y={cy + labelOffset}
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={labelSize}
        fill={isLocked ? '#6F77A6' : '#E2E8FF'}
        fontFamily="'Nunito', 'Oswald', sans-serif"
        fontWeight="700"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {label.length > 20 ? label.slice(0, 18) + '…' : label}
      </text>

      {/* ── Hover tooltip ──────────────────────────────────────────────── */}
      <g className="node-tooltip" style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s' }}>
        <rect
          x={tooltipX}
          y={tooltipY}
          width={tooltipW}
          height={24}
          rx={6}
          fill="#1a1f4e"
          stroke={ring}
          strokeWidth={1}
          opacity={0.95}
        />
        <text
          x={cx}
          y={tooltipY + 12}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={9}
          fill="#F5F7FF"
          fontFamily="'Nunito', sans-serif"
          fontWeight="700"
          style={{ userSelect: 'none' }}
        >
          {label}
        </text>
      </g>
    </g>
  );
}
