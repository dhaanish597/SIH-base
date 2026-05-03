import MasteryRing from '../ui/MasteryRing';

export interface SubjectNodeProps {
  id: string;
  name: string;
  iconKey: string;
  avgMastery: number;  // 0–1
  onClick: () => void;
}

const ICONS: Record<string, string> = {
  math:      '📐',
  science:   '🔬',
  english:   '📖',
  history:   '🏛️',
  geography: '🌍',
  cs:        '💻',
  default:   '📚',
};

export default function SubjectNode({
  name,
  iconKey,
  avgMastery,
  onClick,
}: SubjectNodeProps) {
  const icon = ICONS[iconKey] ?? ICONS.default;
  const pct  = Math.round(Math.min(1, Math.max(0, avgMastery)) * 100);

  return (
    <button
      onClick={onClick}
      className="
        group relative flex flex-col gap-3 p-4 rounded-xl text-left w-full
        bg-[#161930] border border-[#2D3260]
        hover:border-[#6B4BFF] hover:shadow-[0_0_18px_rgba(107,75,255,0.35)]
        transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4BFF]
      "
    >
      {/* Top row: icon + ring */}
      <div className="flex items-start justify-between w-full">
        {/* Subject icon */}
        <span
          className="text-3xl leading-none select-none"
          aria-hidden="true"
        >
          {icon}
        </span>

        {/* Mastery ring + label */}
        <div className="flex flex-col items-center gap-0.5">
          <MasteryRing mastery={avgMastery} size={56} strokeWidth={5} />
          <span
            className="text-[10px] font-mono text-[#6F77A6]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {pct}% mastery
          </span>
        </div>
      </div>

      {/* Subject name */}
      <span
        className="text-base font-bold text-[#F5F7FF] group-hover:text-[#8A6DFF] transition-colors"
        style={{ fontFamily: "'Bowlby One', 'Orbitron', sans-serif" }}
      >
        {name}
      </span>

      {/* CTA */}
      <span className="
        mt-auto inline-flex items-center gap-1
        text-sm font-semibold text-[#18D6FF]
        group-hover:translate-x-0.5 transition-transform
      ">
        Continue →
      </span>
    </button>
  );
}
