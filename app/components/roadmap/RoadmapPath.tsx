interface RoadmapPathProps {
  height: number;
}

/**
 * A vertical SVG connector drawn between two TopicNode cards.
 * The line is horizontally centred in its container and uses a
 * violet-to-cyan gradient with a small dot at each end.
 */
export default function RoadmapPath({ height }: RoadmapPathProps) {
  const w = 20;               // total SVG width
  const cx = w / 2;           // centre x
  const dotR = 3;             // end-dot radius
  const lineY1 = dotR;        // line starts just after top dot
  const lineY2 = height - dotR; // line ends just before bottom dot

  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      aria-hidden="true"
      className="mx-auto block"
    >
      <defs>
        <linearGradient id="roadmap-path-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6B4BFF" />
          <stop offset="100%" stopColor="#18D6FF" />
        </linearGradient>
      </defs>

      {/* Top dot */}
      <circle cx={cx} cy={dotR} r={dotR} fill="url(#roadmap-path-grad)" />

      {/* Vertical line */}
      <line
        x1={cx}
        y1={lineY1}
        x2={cx}
        y2={lineY2}
        stroke="url(#roadmap-path-grad)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="4 4"
      />

      {/* Bottom dot */}
      <circle cx={cx} cy={height - dotR} r={dotR} fill="url(#roadmap-path-grad)" />
    </svg>
  );
}
