'use client';

import { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface Equation {
  left: string;
  right: string;
  answer: number;
  variable: string;
}

interface EquationBalanceGameProps {
  config: {
    equations: Equation[];
  };
  onComplete: (score: number) => void;
}

/* ------------------------------------------------------------------ */
/* Default content                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_EQUATIONS: Equation[] = [
  { left: '2x + 3', right: '11', answer: 4, variable: 'x' },
  { left: '5x - 2', right: '13', answer: 3, variable: 'x' },
  { left: '3x + 7', right: '22', answer: 5, variable: 'x' },
  { left: '4x - 1', right: '15', answer: 4, variable: 'x' },
  { left: 'x/2 + 3', right: '7', answer: 8, variable: 'x' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateOptions(answer: number): number[] {
  const distractors = new Set<number>();
  const offsets = shuffle([1, 2, 3, -1, -2, -3]);
  for (const o of offsets) {
    const candidate = answer + o;
    if (candidate !== answer) distractors.add(candidate);
    if (distractors.size === 3) break;
  }
  return shuffle([answer, ...distractors]);
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function BalanceScale({ leftLabel, rightLabel }: { leftLabel: string; rightLabel: string }) {
  return (
    <div className="flex flex-col items-center gap-1 select-none" aria-hidden>
      {/* Beam */}
      <div className="flex items-end justify-center gap-2">
        {/* Left pan */}
        <div
          className="w-24 rounded-xl flex items-center justify-center py-3 px-2 text-sm font-bold"
          style={{
            background: 'var(--bg-elev-2)',
            border: '1px solid var(--violet)',
            color: 'var(--violet-bright)',
            fontFamily: 'JetBrains Mono, monospace',
            minHeight: '3.5rem',
          }}
        >
          {leftLabel}
        </div>

        {/* Pivot */}
        <div className="flex flex-col items-center">
          <div
            className="w-28 h-1 rounded-full"
            style={{ background: 'var(--ink-2)' }}
          />
          <div
            className="w-1.5 h-6 rounded-full"
            style={{ background: 'var(--ink-2)' }}
          />
          <span className="text-xl leading-none">⚖️</span>
        </div>

        {/* Right pan */}
        <div
          className="w-24 rounded-xl flex items-center justify-center py-3 px-2 text-sm font-bold"
          style={{
            background: 'var(--bg-elev-2)',
            border: '1px solid var(--cyan)',
            color: 'var(--cyan)',
            fontFamily: 'JetBrains Mono, monospace',
            minHeight: '3.5rem',
          }}
        >
          {rightLabel}
        </div>
      </div>
      <div className="flex gap-16 text-xs mt-1" style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
        <span>expression</span>
        <span>value</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                       */
/* ------------------------------------------------------------------ */

export default function EquationBalanceGame({ config, onComplete }: EquationBalanceGameProps) {
  const equations = config.equations.length > 0 ? config.equations : DEFAULT_EQUATIONS;
  const total = equations.length;

  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [showNext, setShowNext] = useState(false);
  const [done, setDone] = useState(false);

  const eq = equations[index];

  useEffect(() => {
    setOptions(generateOptions(eq.answer));
    setSelected(null);
    setFeedback(null);
    setShowNext(false);
  }, [index]);

  const handleOption = (val: number) => {
    if (feedback === 'correct' || done) return;

    setSelected(val);
    if (val === eq.answer) {
      setFeedback('correct');
      setShowNext(true);
      if (selected === null) {
        // first attempt
        setFirstTryCorrect(n => n + 1);
      }
    } else {
      setFeedback('wrong');
      // Show correct answer after short delay but don't advance
      setTimeout(() => {
        setShowNext(true);
      }, 800);
    }
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      const score = Math.round((firstTryCorrect / total) * 100);
      setDone(true);
      onComplete(score);
    } else {
      setIndex(i => i + 1);
    }
  };

  const btnStyle = (val: number): React.CSSProperties => {
    const isSelected = selected === val;
    if (feedback === 'correct' && isSelected) {
      return {
        background: '#0d3b23',
        border: '2px solid var(--green)',
        color: 'var(--green)',
      };
    }
    if (feedback !== null && val === eq.answer) {
      return {
        background: '#0d3b23',
        border: '2px solid var(--green)',
        color: 'var(--green)',
      };
    }
    if (feedback === 'wrong' && isSelected) {
      return {
        background: '#3b0d0d',
        border: '2px solid var(--hot)',
        color: 'var(--hot)',
      };
    }
    return {
      background: 'var(--bg-elev-1)',
      border: '1px solid var(--line)',
      color: 'var(--ink-1)',
    };
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
            Equation Balance
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            Find the value of {eq.variable}
          </p>
        </div>
        <div
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{ background: 'var(--bg-elev-2)', color: 'var(--gold)', border: '1px solid var(--gold-deep)', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {index + 1} / {total}
        </div>
      </div>

      {/* Equation display */}
      <div
        className="rounded-xl px-5 py-4 text-center"
        style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)' }}
      >
        <p
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink-1)' }}
        >
          {eq.left} = {eq.right}
        </p>
        <p className="text-sm" style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          Solve for <span style={{ color: 'var(--violet-bright)', fontWeight: 700 }}>{eq.variable}</span>
        </p>
      </div>

      {/* Balance visual */}
      <BalanceScale leftLabel={eq.left} rightLabel={eq.right} />

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
            {eq.variable} = {val}
          </button>
        ))}
      </div>

      {/* Feedback message */}
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
          {feedback === 'correct'
            ? `Correct! ✓  ${eq.variable} = ${eq.answer}`
            : `Wrong — the answer is ${eq.variable} = ${eq.answer}`}
        </div>
      )}

      {/* Next button */}
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

      {/* Done banner */}
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
          Complete! Score: {Math.round((firstTryCorrect / total) * 100)}
        </div>
      )}
    </div>
  );
}
