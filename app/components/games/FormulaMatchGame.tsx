'use client';

import { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface FormulaMatchGameProps {
  config: {
    pairs: Array<{ formula: string; name: string }>;
  };
  onComplete: (score: number) => void;
}

interface CardState {
  id: number;
  text: string;
  matched: boolean;
}

/* ------------------------------------------------------------------ */
/* Default content                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_PAIRS = [
  { formula: 'a² + b² = c²', name: 'Pythagoras Theorem' },
  { formula: 'sin²θ + cos²θ = 1', name: 'Pythagorean Identity' },
  { formula: 'A = πr²', name: 'Area of Circle' },
  { formula: 'v = u + at', name: 'First Equation of Motion' },
  { formula: 'E = mc²', name: 'Mass-Energy Equivalence' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function FormulaMatchGame({ config, onComplete }: FormulaMatchGameProps) {
  const pairs = config.pairs.length > 0 ? config.pairs : DEFAULT_PAIRS;
  const total = pairs.length;

  const [formulaCards, setFormulaCards] = useState<CardState[]>([]);
  const [nameCards, setNameCards] = useState<CardState[]>([]);
  const [selectedFormula, setSelectedFormula] = useState<number | null>(null);
  const [flashWrong, setFlashWrong] = useState<{ formula: number; name: number } | null>(null);
  const [matched, setMatched] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);

  // Build card arrays on mount
  useEffect(() => {
    setFormulaCards(shuffle(pairs.map((p, i) => ({ id: i, text: p.formula, matched: false }))));
    setNameCards(shuffle(pairs.map((p, i) => ({ id: i, text: p.name, matched: false }))));
  }, []);

  const handleFormulaClick = (id: number) => {
    if (flashWrong) return;
    setSelectedFormula(prev => (prev === id ? null : id));
  };

  const handleNameClick = (nameId: number) => {
    if (flashWrong || selectedFormula === null) return;

    const isCorrect = selectedFormula === nameId;
    setAttempts(a => a + 1);

    if (isCorrect) {
      setCorrect(c => c + 1);
      const newMatched = matched + 1;
      setMatched(newMatched);

      setFormulaCards(cards =>
        cards.map(c => (c.id === selectedFormula ? { ...c, matched: true } : c)),
      );
      setNameCards(cards =>
        cards.map(c => (c.id === nameId ? { ...c, matched: true } : c)),
      );
      setSelectedFormula(null);

      if (newMatched === total) {
        const score = Math.round((newMatched / total) * 100);
        setTimeout(() => {
          setDone(true);
          onComplete(score);
        }, 400);
      }
    } else {
      setFlashWrong({ formula: selectedFormula, name: nameId });
      setTimeout(() => {
        setFlashWrong(null);
        setSelectedFormula(null);
      }, 700);
    }
  };

  const cardBase: React.CSSProperties = {
    background: 'var(--bg-elev-1)',
    border: '1px solid var(--line)',
    borderRadius: '0.75rem',
    padding: '0.6rem 0.8rem',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background 0.15s, border-color 0.15s, opacity 0.2s',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.82rem',
    color: 'var(--ink-1)',
    minHeight: '3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    lineHeight: 1.35,
  };

  const getFormulaStyle = (card: CardState): React.CSSProperties => {
    if (card.matched) {
      return { ...cardBase, background: '#0d3b23', borderColor: 'var(--green)', color: 'var(--green)', cursor: 'default', opacity: 0.7 };
    }
    if (flashWrong && flashWrong.formula === card.id) {
      return { ...cardBase, background: '#3b0d0d', borderColor: 'var(--hot)', color: 'var(--hot)' };
    }
    if (selectedFormula === card.id) {
      return { ...cardBase, background: '#1e1550', borderColor: 'var(--violet)', color: 'var(--violet-bright)', boxShadow: '0 0 0 2px var(--violet)' };
    }
    return cardBase;
  };

  const getNameStyle = (card: CardState): React.CSSProperties => {
    if (card.matched) {
      return { ...cardBase, background: '#0d3b23', borderColor: 'var(--green)', color: 'var(--green)', cursor: 'default', opacity: 0.7 };
    }
    if (flashWrong && flashWrong.name === card.id) {
      return { ...cardBase, background: '#3b0d0d', borderColor: 'var(--hot)', color: 'var(--hot)' };
    }
    if (selectedFormula !== null && !flashWrong) {
      return { ...cardBase, borderColor: 'var(--cyan)', cursor: 'pointer' };
    }
    return { ...cardBase, cursor: selectedFormula === null ? 'default' : 'pointer' };
  };

  return (
    <div
      className="flex flex-col gap-4 w-full max-w-2xl mx-auto"
      style={{ color: 'var(--ink-1)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-base font-bold"
            style={{ fontFamily: "'Bowlby One', 'Orbitron', sans-serif", color: 'var(--violet-bright)' }}
          >
            Formula Match
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            Click a formula, then its matching name
          </p>
        </div>
        <div
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{ background: 'var(--bg-elev-2)', color: 'var(--gold)', border: '1px solid var(--gold-deep)', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {matched} / {total} matched
        </div>
      </div>

      {/* Hint */}
      {selectedFormula !== null && !flashWrong && (
        <p
          className="text-xs text-center py-1 rounded-lg"
          style={{ background: 'var(--bg-elev-2)', color: 'var(--cyan)', border: '1px solid var(--cyan-deep)', fontFamily: 'JetBrains Mono, monospace' }}
        >
          Formula selected — now click the matching name →
        </p>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Formulas */}
        <div className="flex flex-col gap-2">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1 text-center"
            style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Formulas
          </p>
          {formulaCards.map(card => (
            <div
              key={card.id}
              style={getFormulaStyle(card)}
              onClick={() => !card.matched && handleFormulaClick(card.id)}
            >
              {card.text}
            </div>
          ))}
        </div>

        {/* Names */}
        <div className="flex flex-col gap-2">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1 text-center"
            style={{ color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Names
          </p>
          {nameCards.map(card => (
            <div
              key={card.id}
              style={getNameStyle(card)}
              onClick={() => !card.matched && handleNameClick(card.id)}
            >
              {card.text}
            </div>
          ))}
        </div>
      </div>

      {/* Done banner */}
      {done && (
        <div
          className="text-center py-4 rounded-xl mt-2"
          style={{ background: '#0d3b23', border: '1px solid var(--green)', color: 'var(--green)', fontFamily: "'Bowlby One', 'Orbitron', sans-serif", fontSize: '1.1rem' }}
        >
          All matched! Score: {Math.round((correct / total) * 100)}
        </div>
      )}
    </div>
  );
}
