'use client';

import { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface TriangleQuestion {
  opposite: number;
  adjacent: number;
  hypotenuse: number;
  ask: 'sin' | 'cos' | 'tan';
}

interface TriangleRatioGameProps {
  config: {
    questions: TriangleQuestion[];
  };
  onComplete: (score: number) => void;
}

/* ------------------------------------------------------------------ */
/* Default content                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_QUESTIONS: TriangleQuestion[] = [
  { opposite: 3, adjacent: 4, hypotenuse: 5, ask: 'sin' },
  { opposite: 3, adjacent: 4, hypotenuse: 5, ask: 'cos' },
  { opposite: 3, adjacent: 4, hypotenuse: 5, ask: 'tan' },
  { opposite: 5, adjacent: 12, hypotenuse: 13, ask: 'sin' },
  { opposite: 5, adjacent: 12, hypotenuse: 13, ask: 'cos' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function fraction(numerator: number, denominator: number): string {
  const g = gcd(numerator, denominator);
  return `${numerator / g}/${denominator / g}`;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getCorrectRatio(q: TriangleQuestion): { numerator: number; denominator: number } {
  if (q.ask === 'sin') return { numerator: q.opposite, denominator: q.hypotenuse };
  if (q.ask === 'cos') return { numerator: q.adjacent, denominator: q.hypotenuse };
  return { numerator: q.opposite, denominator: q.adjacent };
}

function getExplanation(q: TriangleQuestion): string {
  const { numerator, denominator } = getCorrectRatio(q);
  const labels: Record<'sin' | 'cos' | 'tan', string> = {
    sin: 'sin = opposite / hypotenuse',
    cos: 'cos = adjacent / hypotenuse',
    tan: 'tan = opposite / adjacent',
  };
  return `${labels[q.ask]} = ${fraction(numerator, denominator)}`;
}

function generateOptions(q: TriangleQuestion): string[] {
  const correct = getCorrectRatio(q);
  const correctStr = fraction(correct.numerator, correct.denominator);

  const pool = new Set<string>();
  const sides = [q.opposite, q.adjacent, q.hypotenuse];
  for (const n of sides) {
    for (const d of sides) {
      if (n !== d) pool.add(fraction(n, d));
    }
  }
  pool.delete(correctStr);

  const distractors = shuffle([...pool]).slice(0, 3);
  return shuffle([correctStr, ...distractors]);
}

/* ------------------------------------------------------------------ */
/* Right Triangle SVG                                                   */
/* ------------------------------------------------------------------ */

function RightTriangleSVG({
  opposite,
  adjacent,
  hypotenuse,
}: {
  opposite: number;
  adjacent: number;
  hypotenuse: number;
}) {
  // Fixed layout: right angle bottom-left, angle θ at bottom-right
  const W = 220;
  const H = 160;
  const pad = 28;

  const A = { x: pad, y: H - pad };         // bottom-left (right angle)
  const B = { x: W - pad, y: H - pad };     // bottom-right (angle θ)
  const C = { x: pad, y: pad };             // top-left

  const midAC = { x: (A.x + C.x) / 2 - 18, y: (A.y + C.y) / 2 };
  const midAB = { x: (A.x + B.x) / 2, y: A.y + 14 };
  const midBC = { x: (B.x + C.x) / 2 + 10, y: (B.y + C.y) / 2 };

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: 'visible' }}
      aria-label={`Right triangle: opposite=${opposite}, adjacent=${adjacent}, hypotenuse=${hypotenuse}`}
    >
      {/* Triangle fill */}
      <polygon
        points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
        fill="rgba(107,75,255,0.08)"
        stroke="var(--violet)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Right angle mark */}
      <polyline
        points={`${A.x + 10},${A.y} ${A.x + 10},${A.y - 10} ${A.x},${A.y - 10}`}
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="1.5"
      />

      {/* θ label at B */}
      <text x={B.x - 18} y={B.y - 8} fontSize="13" fill="var(--gold)" fontFamily="JetBrains Mono, monospace" fontStyle="italic">
        θ
      </text>

      {/* Side labels */}
      <text x={midAC.x} y={midAC.y} fontSize="12" fill="var(--hot)" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
        {opposite}
      </text>
      <text x={midAB.x} y={midAB.y} fontSize="12" fill="var(--cyan)" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
        {adjacent}
      </text>
      <text x={midBC.x} y={midBC.y} fontSize="12" fill="var(--green)" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
        {hypotenuse}
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Legend                                                               */
/* ------------------------------------------------------------------ */

function Legend() {
  return (
    <div className="flex gap-4 justify-center text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      <span style={{ color: 'var(--hot)' }}>■ opposite</span>
      <span style={{ color: 'var(--cyan)' }}>■ adjacent</span>
      <span style={{ color: 'var(--green)' }}>■ hypotenuse</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                       */
/* ------------------------------------------------------------------ */

export default function TriangleRatioGame({ config, onComplete }: TriangleRatioGameProps) {
  const questions = config.questions.length > 0 ? config.questions : DEFAULT_QUESTIONS;
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showNext, setShowNext] = useState(false);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const correctRatio = fraction(getCorrectRatio(q).numerator, getCorrectRatio(q).denominator);

  useEffect(() => {
    setOptions(generateOptions(q));
    setSelected(null);
    setFeedback(null);
    setShowNext(false);
  }, [index]);

  const handleOption = (val: string) => {
    if (feedback === 'correct' || done) return;
    setSelected(val);
    if (val === correctRatio) {
      setFeedback('correct');
      setCorrectCount(n => n + 1);
      setShowNext(true);
    } else {
      setFeedback('wrong');
      setTimeout(() => setShowNext(true), 800);
    }
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      const score = Math.round((correctCount / total) * 100);
      setDone(true);
      onComplete(score);
    } else {
      setIndex(i => i + 1);
    }
  };

  const btnStyle = (val: string): React.CSSProperties => {
    const isSelected = selected === val;
    if (feedback === 'correct' && isSelected) {
      return { background: '#0d3b23', border: '2px solid var(--green)', color: 'var(--green)' };
    }
    if (feedback !== null && val === correctRatio) {
      return { background: '#0d3b23', border: '2px solid var(--green)', color: 'var(--green)' };
    }
    if (feedback === 'wrong' && isSelected) {
      return { background: '#3b0d0d', border: '2px solid var(--hot)', color: 'var(--hot)' };
    }
    return { background: 'var(--bg-elev-1)', border: '1px solid var(--line)', color: 'var(--ink-1)' };
  };

  return (
    <div
      className="flex flex-col gap-5 w-full max-w-lg mx-auto"
      style={{ color: 'var(--ink-1)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-base font-bold"
            style={{ fontFamily: "'Bowlby One', 'Orbitron', sans-serif", color: 'var(--violet-bright)' }}
          >
            Triangle Ratios
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            Select the correct trig ratio
          </p>
        </div>
        <div
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{
            background: 'var(--bg-elev-2)',
            color: 'var(--gold)',
            border: '1px solid var(--gold-deep)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {index + 1} / {total}
        </div>
      </div>

      {/* Triangle */}
      <div
        className="flex flex-col items-center gap-2 rounded-xl py-4"
        style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)' }}
      >
        <RightTriangleSVG opposite={q.opposite} adjacent={q.adjacent} hypotenuse={q.hypotenuse} />
        <Legend />
      </div>

      {/* Question */}
      <div
        className="text-center py-3 rounded-xl"
        style={{ background: 'var(--bg-elev-2)', border: '1px solid var(--line)' }}
      >
        <p
          className="text-xl font-bold"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--violet-bright)' }}
        >
          What is{' '}
          <span style={{ color: 'var(--gold)' }}>
            {q.ask} θ
          </span>
          {' '}?
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map(val => (
          <button
            key={val}
            onClick={() => handleOption(val)}
            disabled={feedback === 'correct' || done}
            className="rounded-xl py-3 text-lg font-bold transition-all"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              cursor: feedback === 'correct' || done ? 'default' : 'pointer',
              ...btnStyle(val),
            }}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {feedback && (
        <div
          className="text-center py-3 rounded-xl text-sm font-semibold"
          style={{
            background: feedback === 'correct' ? '#0d3b23' : '#3b0d0d',
            border: `1px solid ${feedback === 'correct' ? 'var(--green)' : 'var(--hot)'}`,
            color: feedback === 'correct' ? 'var(--green)' : 'var(--hot)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {feedback === 'correct' ? '✓ Correct! ' : '✗ Wrong — '}
          {getExplanation(q)}
        </div>
      )}

      {/* Next */}
      {showNext && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-80"
          style={{
            background: 'var(--violet)',
            color: '#fff',
            fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
            boxShadow: '0 4px 0 var(--violet-deep)',
          }}
        >
          {index + 1 >= total ? 'Finish' : 'Next →'}
        </button>
      )}

      {/* Done */}
      {done && (
        <div
          className="text-center py-4 rounded-xl"
          style={{
            background: '#0d3b23',
            border: '1px solid var(--green)',
            color: 'var(--green)',
            fontFamily: "'Bowlby One', 'Orbitron', sans-serif",
            fontSize: '1.1rem',
          }}
        >
          Complete! Score: {Math.round((correctCount / total) * 100)}
        </div>
      )}
    </div>
  );
}
