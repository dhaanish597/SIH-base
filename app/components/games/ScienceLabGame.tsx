'use client';

import { useEffect, useRef, useState } from 'react';
import { Beaker, Lock, CheckCircle, XCircle, Clock } from 'lucide-react';

type Props = { grade?: number; onExit: () => void };

type Puzzle =
  | { kind: 'balance'; question: string; choices: string[]; answer: number; explanation: string }
  | { kind: 'label'; image: string; options: string[]; slots: { label: string; correct: string }[] }
  | { kind: 'match'; pairs: { left: string; right: string }[] };

type GameResult = {
  stars: number; score: number; xp: number; coins: number;
  questionsAttempted: number; questionsCorrect: number; durationSec: number;
};

// ── Puzzle bank ───────────────────────────────────────────────────────────────

const PUZZLES: Puzzle[] = [
  {
    kind: 'balance',
    question: 'Balance: H₂ + O₂ → H₂O',
    choices: ['2H₂ + O₂ → 2H₂O', 'H₂ + O₂ → H₂O₂', 'H₂ + 2O₂ → 2H₂O', '2H₂ + 2O₂ → H₂O'],
    answer: 0,
    explanation: '2H₂ + O₂ → 2H₂O conserves both H (4) and O (2) atoms.',
  },
  {
    kind: 'balance',
    question: 'Balance: Fe + O₂ → Fe₂O₃',
    choices: ['Fe + O₂ → Fe₂O₃', '4Fe + 3O₂ → 2Fe₂O₃', '2Fe + O₂ → Fe₂O₃', 'Fe + 3O₂ → 2Fe₂O₃'],
    answer: 1,
    explanation: '4Fe + 3O₂ → 2Fe₂O₃. Check: Fe: 4=4, O: 6=6.',
  },
  {
    kind: 'balance',
    question: 'Balance: CH₄ + O₂ → CO₂ + H₂O',
    choices: ['CH₄ + O₂ → CO₂ + H₂O', 'CH₄ + 2O₂ → CO₂ + 2H₂O', '2CH₄ + O₂ → 2CO₂ + H₂O', 'CH₄ + 4O₂ → CO₂ + 4H₂O'],
    answer: 1,
    explanation: 'CH₄ + 2O₂ → CO₂ + 2H₂O. C:1=1, H:4=4, O:4=4 ✓',
  },
  {
    kind: 'balance',
    question: 'Balance: N₂ + H₂ → NH₃',
    choices: ['N₂ + H₂ → 2NH₃', 'N₂ + 3H₂ → 2NH₃', '2N₂ + H₂ → NH₃', 'N₂ + 3H₂ → NH₃'],
    answer: 1,
    explanation: 'N₂ + 3H₂ → 2NH₃. N:2=2, H:6=6 ✓',
  },
  {
    kind: 'match',
    pairs: [
      { left: 'Mitochondria', right: 'Powerhouse of the cell' },
      { left: 'Nucleus', right: 'Contains DNA' },
      { left: 'Ribosome', right: 'Protein synthesis' },
      { left: 'Cell wall', right: 'Structural support in plants' },
    ],
  },
  {
    kind: 'match',
    pairs: [
      { left: 'Newton\'s 1st Law', right: 'Inertia' },
      { left: 'Newton\'s 2nd Law', right: 'F = ma' },
      { left: 'Newton\'s 3rd Law', right: 'Action and reaction' },
      { left: 'Ohm\'s Law', right: 'V = IR' },
    ],
  },
  {
    kind: 'balance',
    question: 'What is the chemical formula for table salt?',
    choices: ['NaOH', 'NaCl', 'Na₂O', 'NaHCO₃'],
    answer: 1,
    explanation: 'Table salt is sodium chloride (NaCl).',
  },
  {
    kind: 'balance',
    question: 'Which state of matter has a definite shape and volume?',
    choices: ['Gas', 'Liquid', 'Solid', 'Plasma'],
    answer: 2,
    explanation: 'Solids have both definite shape and definite volume.',
  },
];

export default function ScienceLabGame({ grade = 9, onExit }: Props) {
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [puzzles] = useState(() => [...PUZZLES].sort(() => Math.random() - 0.5).slice(0, 6));
  const [pIdx, setPIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [phase, setPhase] = useState<'question' | 'feedback' | 'done'>('question');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [selectedMCQ, setSelectedMCQ] = useState<number | null>(null);
  const [matchState, setMatchState] = useState<{ selected: string | null; matched: Record<string, string> }>({ selected: null, matched: {} });

  const total = puzzles.length;
  const current = puzzles[pIdx];

  useEffect(() => {
    fetch('/api/games/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ gameType: 'SCIENCE_LAB', mode: 'SOLO', gradeLevel: grade }),
    }).then((r) => r.ok ? r.json() : null).then((d) => { if (d?.sessionId) sessionIdRef.current = d.sessionId; }).catch(() => {});
  }, [grade]);

  useEffect(() => {
    setSelectedMCQ(null);
    setMatchState({ selected: null, matched: {} });
    setFeedback(null);
  }, [pIdx]);

  const submitBalance = (idx: number) => {
    if (phase !== 'question') return;
    setSelectedMCQ(idx);
    const q = current as Extract<Puzzle, { kind: 'balance' }>;
    const ok = idx === q.answer;
    if (ok) { setScore((s) => s + 20); setCorrect((c) => c + 1); }
    setFeedback({ ok, msg: ok ? `✓ Correct! ${q.explanation}` : `✗ ${q.choices[q.answer]} — ${q.explanation}` });
    setPhase('feedback');
  };

  const handleMatchClick = (side: 'left' | 'right', val: string) => {
    if (phase !== 'question') return;
    const q = current as Extract<Puzzle, { kind: 'match' }>;
    const { selected, matched } = matchState;

    if (matched[val]) return; // already matched

    if (!selected) {
      setMatchState({ selected: val, matched });
      return;
    }

    // Try to match: find if selected (left) + val (right) form a valid pair
    const pair = q.pairs.find(
      (p) => (p.left === selected && p.right === val) || (p.right === selected && p.left === val),
    );

    if (pair) {
      const newMatched = { ...matched, [pair.left]: pair.right, [pair.right]: pair.left };
      setMatchState({ selected: null, matched: newMatched });
      if (Object.keys(newMatched).length / 2 === q.pairs.length) {
        // All matched!
        setScore((s) => s + 30);
        setCorrect((c) => c + 1);
        setFeedback({ ok: true, msg: '✓ All pairs matched correctly!' });
        setPhase('feedback');
      }
    } else {
      // Wrong match — deselect
      setMatchState({ selected: val === selected ? null : val, matched });
    }
  };

  const next = () => {
    setPhase('question');
    setFeedback(null);
    if (pIdx + 1 >= total) {
      finishGame();
    } else {
      setPIdx((i) => i + 1);
    }
  };

  const finishGame = () => {
    const acc = total > 0 ? correct / total : 0;
    const stars = acc >= 0.9 ? 3 : acc >= 0.6 ? 2 : 1;
    const xp = 60 + score + (stars === 3 ? 50 : stars === 2 ? 25 : 0);
    const coins = 15 + stars * 10;
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    setResult({ stars, score, xp, coins, questionsAttempted: total, questionsCorrect: correct, durationSec });
    setPhase('done');
  };

  const claimReward = async () => {
    if (!result || saving || saved) return;
    setSaving(true);
    try {
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        await fetch('/api/games/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({
            sessionId, score: result.score,
            questionsAttempted: result.questionsAttempted, questionsCorrect: result.questionsCorrect,
            durationSec: result.durationSec, starsEarned: result.stars, outcome: 'won',
          }),
        });
      }
      setSaved(true);
    } catch { setSaved(true); } finally { setSaving(false); }
  };

  const progress = ((pIdx + (phase === 'feedback' ? 1 : 0)) / total) * 100;

  if (phase === 'done' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-teal-950 flex items-center justify-center p-6">
        <div className="bg-white/10 border border-emerald-400/30 rounded-2xl p-6 w-80 text-center space-y-4 text-white">
          <Beaker className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-bold">Lab Escaped!</h2>
          <p className="text-emerald-200">{'⭐'.repeat(result.stars)} · {result.questionsCorrect}/{result.questionsAttempted} solved</p>
          <div className="flex justify-center gap-5">
            <div><p className="text-2xl font-bold text-amber-400">{result.score}</p><p className="text-xs text-emerald-300">Score</p></div>
            <div><p className="text-2xl font-bold text-emerald-400">+{result.xp}</p><p className="text-xs text-emerald-300">XP</p></div>
            <div><p className="text-2xl font-bold text-yellow-400">+{result.coins}</p><p className="text-xs text-emerald-300">Coins</p></div>
          </div>
          <button onClick={claimReward} disabled={saving || saved}
            className="w-full bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
            {saved ? '✓ Rewards claimed!' : saving ? 'Saving…' : 'Claim Rewards'}
          </button>
          <button onClick={onExit} className="w-full text-sm text-emerald-300 hover:text-white">Back to games</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-teal-950 flex flex-col">
      {/* Progress header */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between text-white/70 text-sm">
          <span className="flex items-center gap-1.5"><Beaker className="w-4 h-4 text-emerald-400" /> Puzzle {Math.min(pIdx + 1, total)} / {total}</span>
          <span className="text-amber-400 font-bold">{score} pts</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full">
          <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Puzzle */}
      <div className="flex-1 px-4 py-3 space-y-4">
        {current.kind === 'balance' && (
          <BalancePuzzle q={current} selected={selectedMCQ} phase={phase} onAnswer={submitBalance} />
        )}
        {current.kind === 'match' && (
          <MatchPuzzle q={current} state={matchState} phase={phase} onClick={handleMatchClick} />
        )}

        {feedback && (
          <div className={`rounded-xl p-4 text-sm font-medium ${feedback.ok ? 'bg-emerald-900/50 border border-emerald-400/30 text-emerald-200' : 'bg-rose-900/50 border border-rose-400/30 text-rose-200'}`}>
            {feedback.msg}
          </div>
        )}

        {phase === 'feedback' && (
          <button onClick={next} className="w-full bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-700">
            {pIdx + 1 >= total ? 'See Results' : 'Next Puzzle →'}
          </button>
        )}
      </div>
    </div>
  );
}

function BalancePuzzle({ q, selected, phase, onAnswer }: {
  q: Extract<Puzzle, { kind: 'balance' }>; selected: number | null;
  phase: string; onAnswer: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
        <p className="text-emerald-300 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
          <Beaker className="w-3.5 h-3.5" /> Chemistry / Science
        </p>
        <p className="text-white font-semibold text-base font-mono">{q.question}</p>
      </div>
      <div className="space-y-2">
        {q.choices.map((c, i) => {
          let cls = 'bg-white/5 border-white/10 text-white/90';
          if (phase === 'feedback') {
            if (i === q.answer) cls = 'bg-emerald-900/60 border-emerald-400/50 text-emerald-200';
            else if (i === selected) cls = 'bg-rose-900/60 border-rose-400/50 text-rose-200';
          }
          return (
            <button key={i} disabled={phase !== 'question'} onClick={() => onAnswer(i)}
              className={`w-full text-left border rounded-xl px-4 py-3 text-sm font-mono transition ${cls} ${phase === 'question' ? 'hover:bg-emerald-800/40 hover:border-emerald-400/50' : ''}`}>
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchPuzzle({ q, state, phase, onClick }: {
  q: Extract<Puzzle, { kind: 'match' }>; state: { selected: string | null; matched: Record<string, string> };
  phase: string; onClick: (side: 'left' | 'right', val: string) => void;
}) {
  const { selected, matched } = state;
  return (
    <div className="space-y-4">
      <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
        <p className="text-emerald-300 text-xs uppercase tracking-wide mb-2">Match the pairs</p>
        <p className="text-white/60 text-sm">Tap a left item then the matching right item</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {q.pairs.map((p, i) => {
            const isMatched = matched[p.left];
            const isSel = selected === p.left;
            return (
              <button key={i} onClick={() => !isMatched && onClick('left', p.left)} disabled={phase !== 'question' || !!isMatched}
                className={`w-full text-left text-xs border rounded-xl px-3 py-2.5 transition font-medium ${
                  isMatched ? 'bg-emerald-900/50 border-emerald-400/40 text-emerald-300' :
                  isSel ? 'bg-emerald-600/50 border-emerald-400 text-white' :
                  'bg-white/5 border-white/10 text-white/90 hover:bg-white/10'
                }`}>
                {isMatched && <CheckCircle className="inline w-3 h-3 mr-1" />}{p.left}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {q.pairs.map((p, i) => {
            const isMatched = matched[p.right];
            const isSel = selected === p.right;
            return (
              <button key={i} onClick={() => !isMatched && onClick('right', p.right)} disabled={phase !== 'question' || !!isMatched}
                className={`w-full text-left text-xs border rounded-xl px-3 py-2.5 transition ${
                  isMatched ? 'bg-emerald-900/50 border-emerald-400/40 text-emerald-300' :
                  isSel ? 'bg-emerald-600/50 border-emerald-400 text-white' :
                  'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}>
                {p.right}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
