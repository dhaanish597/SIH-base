'use client';

import { useEffect, useRef, useState } from 'react';
import { Crown, Sword, Shield, Flag } from 'lucide-react';

type Props = { grade?: number; onExit: () => void };

type Question = { text: string; choices: string[]; answer: number; region: string; explanation: string };

type Territory = { id: string; name: string; x: number; y: number; owner: 'player' | 'enemy' | 'neutral' };

type GameResult = {
  stars: number; score: number; xp: number; coins: number;
  questionsAttempted: number; questionsCorrect: number; durationSec: number;
};

// ── History questions ─────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  { text: 'Who was the first Prime Minister of India?', choices: ['Sardar Patel', 'Jawaharlal Nehru', 'Mahatma Gandhi', 'B.R. Ambedkar'], answer: 1, region: 'India', explanation: 'Jawaharlal Nehru served as PM from 1947 to 1964.' },
  { text: 'When did India gain independence?', choices: ['1945', '1947', '1950', '1948'], answer: 1, region: 'India', explanation: 'India became independent on August 15, 1947.' },
  { text: 'Which battle established British supremacy in India?', choices: ['Battle of Panipat', 'Battle of Plassey', 'Battle of Buxar', 'Battle of Waterloo'], answer: 1, region: 'India', explanation: 'Battle of Plassey (1757) was decisive for British control.' },
  { text: 'Who wrote the Indian National Anthem?', choices: ['Bankim Chandra', 'Rabindranath Tagore', 'Subhash Chandra Bose', 'Sarojini Naidu'], answer: 1, region: 'India', explanation: 'Jana Gana Mana was written by Rabindranath Tagore.' },
  { text: 'The French Revolution began in which year?', choices: ['1776', '1789', '1815', '1800'], answer: 1, region: 'Europe', explanation: 'The French Revolution started in 1789 with the storming of the Bastille.' },
  { text: 'Who discovered America in 1492?', choices: ['Vasco da Gama', 'Ferdinand Magellan', 'Christopher Columbus', 'James Cook'], answer: 2, region: 'Americas', explanation: 'Christopher Columbus reached the Americas in 1492.' },
  { text: 'The ancient wonder, the Great Pyramid, is located in:', choices: ['Iraq', 'Greece', 'Egypt', 'Turkey'], answer: 2, region: 'Africa', explanation: 'The Great Pyramid of Giza is in Egypt.' },
  { text: 'The Roman Empire fell in which year?', choices: ['410', '476', '500', '395'], answer: 1, region: 'Europe', explanation: 'The Western Roman Empire fell in 476 CE.' },
  { text: 'Who was the first emperor of China?', choices: ['Confucius', 'Qin Shi Huang', 'Kublai Khan', 'Sun Yat-sen'], answer: 1, region: 'Asia', explanation: 'Qin Shi Huang unified China and became the first emperor in 221 BCE.' },
  { text: 'World War I started in which year?', choices: ['1912', '1914', '1916', '1918'], answer: 1, region: 'Europe', explanation: 'World War I began in 1914 after Archduke Franz Ferdinand\'s assassination.' },
  { text: 'The Mughal Empire was founded by:', choices: ['Akbar', 'Humayun', 'Babur', 'Aurangzeb'], answer: 2, region: 'India', explanation: 'Babur founded the Mughal Empire in 1526 after the First Battle of Panipat.' },
  { text: 'The Berlin Wall fell in:', choices: ['1987', '1989', '1991', '1985'], answer: 1, region: 'Europe', explanation: 'The Berlin Wall fell on November 9, 1989.' },
];

const TERRITORIES: Territory[] = [
  { id: 't1', name: 'North Province', x: 160, y: 60, owner: 'enemy' },
  { id: 't2', name: 'East Coast', x: 290, y: 100, owner: 'enemy' },
  { id: 't3', name: 'West Frontier', x: 60, y: 150, owner: 'neutral' },
  { id: 't4', name: 'Capital', x: 190, y: 155, owner: 'enemy' },
  { id: 't5', name: 'Southern Plains', x: 130, y: 240, owner: 'neutral' },
  { id: 't6', name: 'Mountain Pass', x: 270, y: 200, owner: 'neutral' },
  { id: 't7', name: 'River Valley', x: 200, y: 300, owner: 'neutral' },
  { id: 't8', name: 'Port City', x: 310, y: 280, owner: 'enemy' },
];

export default function HistoryConquestGame({ grade = 9, onExit }: Props) {
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef(Date.now());

  const [territories, setTerritories] = useState<Territory[]>(() =>
    TERRITORIES.map((t) => ({ ...t })),
  );
  const [qBank] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5));
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [phase, setPhase] = useState<'map' | 'battle' | 'feedback' | 'done'>('map');
  const [activeTerritoryId, setActiveTerritoryId] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; territory: string; msg: string } | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/games/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ gameType: 'HISTORY_CONQUEST', mode: 'SOLO', gradeLevel: grade }),
    }).then((r) => r.ok ? r.json() : null).then((d) => { if (d?.sessionId) sessionIdRef.current = d.sessionId; }).catch(() => {});
  }, [grade]);

  const conquerCount = territories.filter((t) => t.owner === 'player').length;
  const totalTerritories = territories.length;

  const attackTerritory = (t: Territory) => {
    if (phase !== 'map' || t.owner === 'player') return;
    setActiveTerritoryId(t.id);
    setSelectedChoice(null);
    setPhase('battle');
  };

  const submitAnswer = (idx: number) => {
    if (phase !== 'battle') return;
    const q = qBank[qIdx % qBank.length];
    setSelectedChoice(idx);
    const ok = idx === q.answer;
    setAttempted((a) => a + 1);
    if (ok) {
      setCorrect((c) => c + 1);
      setScore((s) => s + 20 + (conquerCount * 2));
      setTerritories((ts) => ts.map((t) => t.id === activeTerritoryId ? { ...t, owner: 'player' } : t));
    }
    setFeedback({
      ok,
      territory: territories.find((t) => t.id === activeTerritoryId)?.name ?? '',
      msg: ok
        ? `✓ Territory conquered! ${q.explanation}`
        : `✗ The answer was "${q.choices[q.answer]}". ${q.explanation}`,
    });
    setQIdx((i) => i + 1);
    setPhase('feedback');
  };

  const nextPhase = () => {
    setFeedback(null);
    setActiveTerritoryId(null);
    const newConquerCount = territories.filter((t) => t.owner === 'player').length;
    if (newConquerCount === totalTerritories) {
      finishGame();
    } else {
      setPhase('map');
    }
  };

  const finishGame = () => {
    const acc = attempted > 0 ? correct / attempted : 0;
    const stars = acc >= 0.8 ? 3 : acc >= 0.6 ? 2 : 1;
    const xp = 70 + score + (stars === 3 ? 60 : stars === 2 ? 30 : 0);
    const coins = 20 + stars * 15;
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    setResult({ stars, score, xp, coins, questionsAttempted: attempted, questionsCorrect: correct, durationSec });
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

  if (phase === 'done' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-blue-950 flex items-center justify-center p-6">
        <div className="bg-white/10 border border-indigo-400/30 rounded-2xl p-6 w-80 text-center space-y-4 text-white">
          <Crown className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-bold">History Conquered!</h2>
          <p className="text-indigo-200">{'⭐'.repeat(result.stars)} · {result.questionsCorrect}/{result.questionsAttempted} correct</p>
          <div className="flex justify-center gap-5">
            <div><p className="text-2xl font-bold text-amber-400">{result.score}</p><p className="text-xs text-indigo-300">Score</p></div>
            <div><p className="text-2xl font-bold text-emerald-400">+{result.xp}</p><p className="text-xs text-indigo-300">XP</p></div>
            <div><p className="text-2xl font-bold text-yellow-400">+{result.coins}</p><p className="text-xs text-indigo-300">Coins</p></div>
          </div>
          <button onClick={claimReward} disabled={saving || saved}
            className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saved ? '✓ Rewards claimed!' : saving ? 'Saving…' : 'Claim Rewards'}
          </button>
          <button onClick={onExit} className="w-full text-sm text-indigo-300 hover:text-white">Back to games</button>
        </div>
      </div>
    );
  }

  const q = qBank[qIdx % qBank.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-blue-950 flex flex-col">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <Flag className="w-4 h-4 text-indigo-400" />
          <span>Territories: <span className="font-bold text-indigo-300">{conquerCount}/{totalTerritories}</span></span>
        </div>
        <div className="text-amber-400 font-bold text-sm">{score} pts</div>
        <div className="text-white/60 text-sm">
          ✓ {correct}/{attempted}
        </div>
      </div>

      {/* Territory progress bar */}
      <div className="px-4 py-2">
        <div className="h-1.5 bg-white/10 rounded-full">
          <div className="h-full bg-indigo-400 rounded-full transition-all duration-700"
            style={{ width: `${(conquerCount / totalTerritories) * 100}%` }} />
        </div>
      </div>

      {/* Map */}
      {(phase === 'map' || phase === 'feedback') && (
        <div className="flex-1 flex flex-col">
          {phase === 'feedback' && feedback && (
            <div className={`mx-4 mt-2 rounded-xl p-3 text-sm font-medium ${feedback.ok ? 'bg-emerald-900/50 border border-emerald-400/30 text-emerald-200' : 'bg-rose-900/50 border border-rose-400/30 text-rose-200'}`}>
              {feedback.ok ? `🏳️ ${feedback.territory} captured!` : `⚔️ Failed to take ${feedback.territory}.`}
              <p className="text-xs mt-1 opacity-80">{feedback.msg}</p>
              <button onClick={nextPhase}
                className="mt-2 bg-indigo-600 text-white text-xs rounded-lg px-4 py-1.5 font-semibold hover:bg-indigo-700">
                Continue
              </button>
            </div>
          )}

          <div className="flex-1 relative mx-4 my-3">
            {/* SVG map */}
            <div className="relative w-full" style={{ paddingBottom: '75%' }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 380 290">
                {/* Background land */}
                <rect width="380" height="290" fill="#1e3a5f" rx="12" />
                <ellipse cx="190" cy="145" rx="160" ry="110" fill="#2d4a2d" opacity="0.4" />

                {/* Connections */}
                {[['t1','t2'],['t1','t4'],['t2','t4'],['t2','t6'],['t3','t4'],['t3','t5'],['t4','t5'],['t4','t6'],['t5','t7'],['t6','t7'],['t6','t8'],['t7','t8']].map(([a, b]) => {
                  const ta = territories.find((t) => t.id === a);
                  const tb = territories.find((t) => t.id === b);
                  if (!ta || !tb) return null;
                  return <line key={`${a}-${b}`} x1={ta.x} y1={ta.y} x2={tb.x} y2={tb.y} stroke="#ffffff20" strokeWidth="1.5" />;
                })}

                {/* Territory nodes */}
                {territories.map((t) => {
                  const color = t.owner === 'player' ? '#4ade80' : t.owner === 'enemy' ? '#f87171' : '#94a3b8';
                  const textColor = t.owner === 'player' ? '#14532d' : t.owner === 'enemy' ? '#7f1d1d' : '#334155';
                  const isActive = activeTerritoryId === t.id;
                  return (
                    <g key={t.id} onClick={() => attackTerritory(t)} style={{ cursor: t.owner !== 'player' ? 'pointer' : 'default' }}>
                      <circle cx={t.x} cy={t.y} r={isActive ? 22 : 18} fill={color} opacity={0.9}
                        stroke={isActive ? '#ffffff' : '#ffffff30'} strokeWidth={isActive ? 3 : 1} />
                      <text x={t.x} y={t.y + 1} textAnchor="middle" dominantBaseline="middle"
                        fontSize="9" fill={textColor} fontWeight="bold" fontFamily="monospace">
                        {t.owner === 'player' ? '🏴' : t.owner === 'enemy' ? '⚔️' : '·'}
                      </text>
                      <text x={t.x} y={t.y + 28} textAnchor="middle" fontSize="7" fill="#94a3b8" fontFamily="sans-serif">
                        {t.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {phase === 'map' && (
              <p className="text-center text-indigo-300 text-xs mt-2">
                Tap a <span className="text-rose-400 font-medium">red (enemy)</span> or <span className="text-gray-400 font-medium">grey (neutral)</span> territory to attack it
              </p>
            )}
          </div>

          {conquerCount === totalTerritories && phase === 'map' && (
            <div className="px-4 pb-4">
              <button onClick={finishGame} className="w-full bg-amber-500 text-white rounded-xl py-3 font-bold text-sm hover:bg-amber-600">
                🏆 Complete Conquest!
              </button>
            </div>
          )}
        </div>
      )}

      {/* Battle screen */}
      {phase === 'battle' && q && (
        <div className="flex-1 px-4 py-3 space-y-4">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-medium">
            <Sword className="w-4 h-4" />
            Attacking: {territories.find((t) => t.id === activeTerritoryId)?.name}
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4">
            <p className="text-indigo-300 text-xs uppercase tracking-wide mb-2">{q.region} · History</p>
            <p className="text-white font-semibold text-base leading-relaxed">{q.text}</p>
          </div>
          <div className="space-y-2">
            {q.choices.map((c, i) => (
              <button key={i} disabled={selectedChoice !== null} onClick={() => submitAnswer(i)}
                className={`w-full text-left border rounded-xl px-4 py-3 text-sm transition ${
                  selectedChoice !== null
                    ? i === q.answer ? 'bg-emerald-900/60 border-emerald-400/50 text-emerald-200'
                      : i === selectedChoice ? 'bg-rose-900/60 border-rose-400/50 text-rose-200'
                      : 'bg-white/5 border-white/10 text-white/50'
                    : 'bg-white/5 border-white/10 text-white/90 hover:bg-indigo-800/50 hover:border-indigo-400/50'
                }`}>
                <span className="font-mono text-indigo-400 mr-2">{String.fromCharCode(65 + i)}.</span>{c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
