'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { grade?: number; onExit: () => void };

type GameResult = {
  won: boolean; score: number; stars: number;
  xp: number; coins: number;
  questionsAttempted: number; questionsCorrect: number; durationSec: number;
};

// ── Question bank ────────────────────────────────────────────────────────────

type Question =
  | { kind: 'mcq'; text: string; choices: string[]; answer: number; explanation: string }
  | { kind: 'fill'; prompt: string; answer: string; hint: string }
  | { kind: 'sort'; words: string[]; sentence: string };   // arrange words to form sentence

const VOCAB_QUESTIONS: Question[] = [
  { kind: 'mcq', text: 'Choose the correct synonym for "benevolent":', choices: ['Cruel', 'Kind', 'Lazy', 'Loud'], answer: 1, explanation: '"Benevolent" means kind and generous.' },
  { kind: 'mcq', text: 'What is the antonym of "ancient"?', choices: ['Old', 'Modern', 'Historic', 'Aged'], answer: 1, explanation: 'Ancient = very old. Antonym = modern.' },
  { kind: 'mcq', text: 'Choose the correct form: "Neither the students nor the teacher ___ ready."', choices: ['were', 'was', 'are', 'have been'], answer: 1, explanation: 'When "neither/nor" pairs singular + singular, the verb agrees with the closer subject (teacher = singular → was).' },
  { kind: 'mcq', text: 'Identify the part of speech: "She runs quickly."', choices: ['Noun', 'Adjective', 'Adverb', 'Verb'], answer: 2, explanation: '"Quickly" modifies the verb "runs" — so it is an adverb.' },
  { kind: 'mcq', text: 'What literary device is used? "The wind whispered through the trees."', choices: ['Simile', 'Metaphor', 'Personification', 'Alliteration'], answer: 2, explanation: 'Giving the wind a human action (whispering) = personification.' },
  { kind: 'mcq', text: '"Ephemeral" most nearly means:', choices: ['Permanent', 'Short-lived', 'Gigantic', 'Painful'], answer: 1, explanation: '"Ephemeral" means lasting for a very short time.' },
  { kind: 'mcq', text: 'Choose the correctly punctuated sentence:', choices: ["Its a beautiful day.", "It's a beautiful day.", "Its' a beautiful day.", "It is' a beautiful day."], answer: 1, explanation: '"It\'s" = "it is" — apostrophe replaces the missing letter.' },
  { kind: 'fill', prompt: 'The cat sat ___ the mat. (preposition of position)', answer: 'on', hint: '3 letters, position on top of a surface' },
  { kind: 'fill', prompt: 'She is ___ than her sister. (comparative of "tall")', answer: 'taller', hint: 'add -er to the adjective' },
  { kind: 'fill', prompt: 'They have ___ to the market. (past participle of "go")', answer: 'gone', hint: 'irregular past participle' },
  { kind: 'sort', words: ['quickly', 'ran', 'the', 'dog', 'very'], sentence: 'the dog ran very quickly' },
  { kind: 'sort', words: ['book', 'I', 'reading', 'am', 'a'], sentence: 'I am reading a book' },
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickQuestions(grade: number, count = 8): Question[] {
  const shuffled = [...VOCAB_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function WordForgeGame({ grade = 9, onExit }: Props) {
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const [result, setResult] = useState<GameResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Game state
  const [questions] = useState(() => pickQuestions(grade));
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [phase, setPhase] = useState<'question' | 'feedback' | 'done'>('question');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [fillInput, setFillInput] = useState('');
  const [sortOrder, setSortOrder] = useState<string[]>([]);
  const [sortPool, setSortPool] = useState<string[]>([]);

  const current = questions[qIdx];
  const total = questions.length;

  useEffect(() => {
    fetch('/api/games/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ gameType: 'WORD_FORGE', mode: 'SOLO', gradeLevel: grade }),
    }).then((r) => r.ok ? r.json() : null).then((d) => { if (d?.sessionId) sessionIdRef.current = d.sessionId; }).catch(() => {});
  }, [grade]);

  // Init sort pool when a sort question appears
  useEffect(() => {
    if (current?.kind === 'sort') {
      setSortPool([...current.words].sort(() => Math.random() - 0.5));
      setSortOrder([]);
    } else {
      setFillInput('');
      setSelected(null);
    }
  }, [qIdx]);

  const submitMCQ = (idx: number) => {
    if (phase !== 'question') return;
    setSelected(idx);
    const q = current as Extract<Question, { kind: 'mcq' }>;
    const ok = idx === q.answer;
    if (ok) { setScore((s) => s + 15); setCorrect((c) => c + 1); }
    setFeedback({ ok, msg: ok ? `✓ Correct! ${q.explanation}` : `✗ ${q.choices[q.answer]} was right. ${q.explanation}` });
    setPhase('feedback');
  };

  const submitFill = () => {
    if (phase !== 'question') return;
    const q = current as Extract<Question, { kind: 'fill' }>;
    const ok = fillInput.trim().toLowerCase() === q.answer.toLowerCase();
    if (ok) { setScore((s) => s + 20); setCorrect((c) => c + 1); }
    setFeedback({ ok, msg: ok ? `✓ Correct!` : `✗ The answer was "${q.answer}". ${q.hint}` });
    setPhase('feedback');
  };

  const addWord = (w: string) => {
    setSortOrder((o) => [...o, w]);
    setSortPool((p) => { const i = p.indexOf(w); return [...p.slice(0, i), ...p.slice(i + 1)]; });
  };
  const removeWord = (i: number) => {
    const w = sortOrder[i];
    setSortPool((p) => [...p, w]);
    setSortOrder((o) => [...o.slice(0, i), ...o.slice(i + 1)]);
  };
  const submitSort = () => {
    if (phase !== 'question') return;
    const q = current as Extract<Question, { kind: 'sort' }>;
    const attempt = sortOrder.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
    const ok = attempt === q.sentence;
    if (ok) { setScore((s) => s + 25); setCorrect((c) => c + 1); }
    setFeedback({ ok, msg: ok ? '✓ Perfect sentence!' : `✗ Correct order: "${q.sentence}"` });
    setPhase('feedback');
  };

  const next = () => {
    setPhase('question');
    setFeedback(null);
    if (qIdx + 1 >= total) {
      finishGame();
    } else {
      setQIdx((i) => i + 1);
    }
  };

  const finishGame = () => {
    const acc = total > 0 ? correct / total : 0;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    const xp = 50 + score + (stars === 3 ? 40 : stars === 2 ? 20 : 0);
    const coins = 10 + stars * 10;
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    setResult({ won: true, score, stars, xp, coins, questionsAttempted: total, questionsCorrect: correct, durationSec });
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

  const progress = ((qIdx + (phase === 'feedback' ? 1 : 0)) / total) * 100;

  if (phase === 'done' && result) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-violet-950 to-indigo-950 min-h-screen">
        <div className="bg-white/10 border border-violet-400/30 rounded-2xl p-6 w-80 text-center space-y-4 text-white">
          <p className="text-4xl">{'⭐'.repeat(result.stars)}</p>
          <h2 className="text-2xl font-bold">Word Forge Complete!</h2>
          <p className="text-violet-200">{result.questionsCorrect}/{result.questionsAttempted} correct</p>
          <div className="flex justify-center gap-6">
            <div><p className="text-2xl font-bold text-amber-400">{result.score}</p><p className="text-xs text-violet-300">Score</p></div>
            <div><p className="text-2xl font-bold text-emerald-400">+{result.xp}</p><p className="text-xs text-violet-300">XP</p></div>
            <div><p className="text-2xl font-bold text-yellow-400">+{result.coins}</p><p className="text-xs text-violet-300">Coins</p></div>
          </div>
          <button onClick={claimReward} disabled={saving || saved}
            className="w-full bg-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
            {saved ? '✓ Rewards claimed!' : saving ? 'Saving…' : 'Claim Rewards'}
          </button>
          <button onClick={onExit} className="w-full text-sm text-violet-300 hover:text-white">Back to games</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 to-indigo-950 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between text-white/80 text-sm">
          <span className="font-medium">Question {Math.min(qIdx + 1, total)} / {total}</span>
          <span className="text-amber-400 font-bold">{score} pts</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full">
          <div className="h-full bg-violet-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 px-4 py-3 space-y-4">
        {current.kind === 'mcq' && (
          <MCQQuestion q={current} selected={selected} phase={phase} onAnswer={submitMCQ} />
        )}
        {current.kind === 'fill' && (
          <FillQuestion q={current} value={fillInput} onChange={setFillInput} phase={phase} onSubmit={submitFill} />
        )}
        {current.kind === 'sort' && (
          <SortQuestion q={current} order={sortOrder} pool={sortPool} phase={phase} onAdd={addWord} onRemove={removeWord} onSubmit={submitSort} />
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-xl p-4 text-sm font-medium ${feedback.ok ? 'bg-emerald-900/50 border border-emerald-400/30 text-emerald-200' : 'bg-rose-900/50 border border-rose-400/30 text-rose-200'}`}>
            {feedback.msg}
          </div>
        )}

        {phase === 'feedback' && (
          <button onClick={next} className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-violet-700">
            {qIdx + 1 >= total ? 'See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function MCQQuestion({ q, selected, phase, onAnswer }: {
  q: Extract<Question, { kind: 'mcq' }>; selected: number | null;
  phase: string; onAnswer: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
        <p className="text-white font-semibold text-base leading-relaxed">{q.text}</p>
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
              className={`w-full text-left border rounded-xl px-4 py-3 text-sm transition ${cls} ${phase === 'question' ? 'hover:bg-violet-800/50 hover:border-violet-400/50' : ''}`}>
              <span className="font-mono text-violet-400 mr-2">{String.fromCharCode(65 + i)}.</span>{c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FillQuestion({ q, value, onChange, phase, onSubmit }: {
  q: Extract<Question, { kind: 'fill' }>; value: string;
  onChange: (v: string) => void; phase: string; onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
        <p className="text-violet-300 text-xs uppercase tracking-wide mb-2">Fill in the blank</p>
        <p className="text-white font-semibold text-base leading-relaxed">{q.prompt}</p>
        <p className="text-violet-300 text-xs mt-2">Hint: {q.hint}</p>
      </div>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        disabled={phase !== 'question'}
        onKeyDown={(e) => e.key === 'Enter' && phase === 'question' && onSubmit()}
        placeholder="Type your answer…"
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
      />
      {phase === 'question' && (
        <button onClick={onSubmit} disabled={!value.trim()}
          className="w-full bg-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-violet-700 disabled:opacity-40">
          Submit
        </button>
      )}
    </div>
  );
}

function SortQuestion({ q, order, pool, phase, onAdd, onRemove, onSubmit }: {
  q: Extract<Question, { kind: 'sort' }>; order: string[]; pool: string[];
  phase: string; onAdd: (w: string) => void; onRemove: (i: number) => void; onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
        <p className="text-violet-300 text-xs uppercase tracking-wide mb-2">Arrange the words</p>
        <p className="text-white/60 text-sm">Tap words to build the correct sentence</p>
      </div>

      {/* Sentence being built */}
      <div className="min-h-14 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-2 items-start">
        {order.length === 0 && <p className="text-white/30 text-sm self-center">Tap words below to add them…</p>}
        {order.map((w, i) => (
          <button key={i} onClick={() => phase === 'question' && onRemove(i)}
            className="bg-violet-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-rose-600 transition">
            {w}
          </button>
        ))}
      </div>

      {/* Word pool */}
      <div className="flex flex-wrap gap-2">
        {pool.map((w, i) => (
          <button key={i} onClick={() => phase === 'question' && onAdd(w)}
            disabled={phase !== 'question'}
            className="bg-white/10 border border-white/20 text-white/90 text-sm px-3 py-1.5 rounded-lg hover:bg-violet-700/50 disabled:opacity-40">
            {w}
          </button>
        ))}
      </div>

      {phase === 'question' && (
        <button onClick={onSubmit} disabled={order.length === 0}
          className="w-full bg-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-violet-700 disabled:opacity-40">
          Check Sentence
        </button>
      )}
    </div>
  );
}
