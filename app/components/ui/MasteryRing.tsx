interface MasteryRingProps {
  mastery: number;        // 0–1
  size?: number;          // default 48
  strokeWidth?: number;   // default 4
  className?: string;
}

function getMasteryColor(mastery: number): string {
  if (mastery < 0.4) return '#EF4444';
  if (mastery < 0.6) return '#F59E0B';
  if (mastery < 0.8) return '#18D6FF';
  return '#10B981';
}

export default function MasteryRing({
  mastery,
  size = 48,
  strokeWidth = 4,
  className = '',
}: MasteryRingProps) {
  const clamped = Math.min(1, Math.max(0, mastery));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const color = getMasteryColor(clamped);
  const pct = Math.round(clamped * 100);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label={`Mastery ${pct}%`}
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Fill arc — starts at top (−90°) */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Centre label */}
      <text
        x={cx}
        y={cy}
        dominantBaseline="central"
        textAnchor="middle"
        fill={color}
        fontSize={size * 0.22}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
      >
        {pct}%
      </text>
    </svg>
  );
}
