'use client';

import { useEffect, useRef, useState } from 'react';

type Question = { text: string; choices: string[]; answer: number; explanation: string };
type Chapter  = {
  id: number; title: string; year: string; region: string; regionColor: string;
  emoji: string; narrative: string; clue: string; questions: Question[];
};

const CHAPTERS: Chapter[] = [
  {
    id: 0, title: 'The Sepoy Mutiny', year: '1857', region: 'North India', regionColor: '#FF5A4D', emoji: '⚔️',
    narrative: 'On May 10, 1857, Indian soldiers (sepoys) of the British East India Company rose up in revolt at Meerut. The immediate trigger was the introduction of new Enfield rifle cartridges rumoured to be greased with the fat of cows and pigs — offensive to both Hindus and Muslims. The rebellion quickly spread across north India, shaking British rule.',
    clue: 'The sepoys refused to bite the new Enfield cartridges because of what they were allegedly coated with — touching the deepest religious sentiments of both communities.',
    questions: [
      { text: 'What was the immediate trigger of the 1857 revolt?', choices: ['New taxation laws', 'Greased cartridges offensive to Hindus and Muslims', 'British occupation of Bengal', 'Exile of Bahadur Shah Zafar'], answer: 1, explanation: 'The Enfield cartridge rumour — greased with cow and pig fat — outraged Hindu and Muslim sepoys. This religious insult was the spark that ignited the revolt.' },
      { text: 'Where did the 1857 revolt begin?', choices: ['Delhi', 'Lucknow', 'Meerut', 'Calcutta'], answer: 2, explanation: 'The revolt began at Meerut on May 10, 1857, when sepoys refused to use the cartridges, were arrested, and then released by fellow soldiers who killed their officers.' },
      { text: 'Who was the last Mughal Emperor at the time?', choices: ['Akbar II', 'Bahadur Shah Zafar', 'Shah Alam II', 'Aurangzeb'], answer: 1, explanation: 'Bahadur Shah Zafar II was the last Mughal emperor. Though elderly and reluctant, the sepoys declared him the leader of the uprising.' },
    ],
  },
  {
    id: 1, title: 'The Salt March', year: '1930', region: 'West India', regionColor: '#FFC93C', emoji: '🧂',
    narrative: 'On March 12, 1930, Mahatma Gandhi led 78 followers from Sabarmati Ashram, Ahmedabad, toward the coastal village of Dandi, Gujarat. Over 24 days and 241 miles, thousands joined. On April 6, Gandhi picked up a handful of salt from the sea — defying British salt laws and igniting mass civil disobedience across India.',
    clue: 'The Salt Act gave Britain a monopoly over salt production and taxed it heavily. By making salt from seawater, Gandhi broke both the law and the monopoly simultaneously.',
    questions: [
      { text: 'How long was the Dandi Salt March?', choices: ['100 miles', '388 miles', '241 miles', '50 km'], answer: 2, explanation: 'The march covered 241 miles (388 km) from Sabarmati Ashram to the coastal village of Dandi over 24 days.' },
      { text: 'What did Gandhi do at Dandi to defy British law?', choices: ['Burned tax records', 'Picked up salt from the seashore', 'Hoisted the Indian flag', 'Refused to pay taxes'], answer: 1, explanation: 'Gandhi picked up a lump of natural salt at Dandi beach, symbolically breaking the Salt Act which taxed and monopolised salt production.' },
      { text: 'Where did Gandhi begin the Salt March?', choices: ['Mumbai', 'Delhi', 'Sabarmati Ashram, Ahmedabad', 'Dandi beach'], answer: 2, explanation: 'The march began at Sabarmati Ashram in Ahmedabad on March 12, 1930, with 78 chosen followers.' },
    ],
  },
  {
    id: 2, title: 'Quit India Movement', year: '1942', region: 'Central India', regionColor: '#6B4BFF', emoji: '✊',
    narrative: 'On August 8, 1942, the Indian National Congress passed the Quit India Resolution at Gowalia Tank Maidan, Bombay. Gandhi delivered his "Do or Die" speech urging Indians to act as free citizens. The British immediately arrested Gandhi and all Congress leaders. Millions rose spontaneously — students, workers, and farmers — in the largest uprising since 1857.',
    clue: 'Gandhi\'s rallying cry "Karenge ya Marenge" — Do or Die — challenged every Indian to either win freedom or die in its pursuit. Over 100,000 people were imprisoned.',
    questions: [
      { text: "What was Gandhi's famous call to action in the Quit India speech?", choices: ['Non-cooperation', '"Do or Die"', '"Swaraj is my birthright"', '"Give me blood"'], answer: 1, explanation: 'Gandhi\'s slogan was "Karenge ya Marenge" — Do or Die. He urged every Indian to fight for independence or sacrifice their life.' },
      { text: 'When was the Quit India Movement launched?', choices: ['August 8, 1942', 'January 26, 1930', 'September 2, 1939', 'March 23, 1931'], answer: 0, explanation: 'The Quit India Resolution was passed on August 8, 1942, at Gowalia Tank Maidan in Bombay.' },
      { text: 'What did the British do immediately after the speech?', choices: ['Called elections', 'Arrested Gandhi and all Congress leaders', 'Agreed to negotiate', 'Increased Indian rights'], answer: 1, explanation: 'The British arrested Gandhi, Nehru, and virtually the entire Congress leadership within hours of the speech. Over 100,000 Indians were eventually imprisoned.' },
    ],
  },
  {
    id: 3, title: 'Independence and Partition', year: '1947', region: 'Punjab/Bengal', regionColor: '#FF8A2B', emoji: '🕊️',
    narrative: "As independence neared, the demand for a separate Muslim homeland intensified. Muhammad Ali Jinnah's Muslim League and Lord Mountbatten's plan led to the partition of Punjab and Bengal. On August 14-15, 1947, Pakistan and India became independent nations — but at the cost of one of history's bloodiest mass migrations of over 15 million people.",
    clue: 'The Radcliffe Line, drawn by British lawyer Cyril Radcliffe who had never visited India, divided Punjab and Bengal in just five weeks — with devastating consequences.',
    questions: [
      { text: 'Who drew the partition boundary lines?', choices: ['Lord Mountbatten', 'Jawaharlal Nehru', 'Cyril Radcliffe', 'Muhammad Ali Jinnah'], answer: 2, explanation: 'Sir Cyril Radcliffe, a British lawyer who had never visited India, drew the Radcliffe Line dividing Punjab and Bengal. He completed this monumental task in just 5 weeks.' },
      { text: 'Which provinces were divided by partition?', choices: ['UP and Bihar', 'Punjab and Bengal', 'Madras and Bombay', 'Assam and Orissa'], answer: 1, explanation: 'Partition divided Punjab (between India and West Pakistan) and Bengal (between India and East Pakistan, now Bangladesh).' },
      { text: 'When did India become independent?', choices: ['August 14, 1947', 'August 15, 1947', 'January 26, 1950', 'June 3, 1947'], answer: 1, explanation: "India became independent at midnight on August 14-15, 1947. Pakistan's independence day is August 14; India's is August 15." },
    ],
  },
  {
    id: 4, title: 'Birth of the Republic', year: '1950', region: 'All India', regionColor: '#2DD46E', emoji: '🇮🇳',
    narrative: 'After independence, India faced the enormous task of writing its own constitution. Dr. B.R. Ambedkar chaired the Drafting Committee. The Constitution was adopted on November 26, 1949, and came into force on January 26, 1950 — making India a sovereign democratic republic. January 26 was chosen to honour the Purna Swaraj (complete independence) declaration of 1930.',
    clue: 'January 26, 1950 — Republic Day — was chosen to commemorate January 26, 1930, when the INC declared Purna Swaraj from British rule.',
    questions: [
      { text: "Who chaired India's Constitution Drafting Committee?", choices: ['Jawaharlal Nehru', 'Sardar Patel', 'Dr. B.R. Ambedkar', 'Rajendra Prasad'], answer: 2, explanation: 'Dr. B.R. Ambedkar chaired the Drafting Committee and is called the "Father of the Indian Constitution." Rajendra Prasad presided over the Constituent Assembly.' },
      { text: 'When did the Constitution come into effect?', choices: ['August 15, 1947', 'November 26, 1949', 'January 26, 1950', 'January 26, 1930'], answer: 2, explanation: 'The Constitution was adopted November 26, 1949, but came into effect on January 26, 1950, marking the birth of the Republic of India.' },
      { text: 'Why was January 26 chosen as Republic Day?', choices: ["Gandhi's birthday", 'The Dandi March began', 'Purna Swaraj declared on Jan 26, 1930', 'The British left on this day'], answer: 2, explanation: 'January 26, 1930 was when the INC passed the Purna Swaraj (complete independence) resolution. This historic day was chosen to give the Republic a meaningful founding date.' },
    ],
  },
];

const MAP_NODES = [
  { id: 0, x: 42, y: 20, r: 10 },
  { id: 1, x: 20, y: 50, r: 10 },
  { id: 2, x: 50, y: 50, r: 10 },
  { id: 3, x: 72, y: 38, r: 10 },
  { id: 4, x: 50, y: 80, r: 10 },
];

export default function HistoryConquestGame({ grade = 9, onExit }: { grade?: number; onExit: () => void }) {
  const sessionRef = useRef<string | null>(null);
  const startRef   = useRef(Date.now());

  const [chapter,   setChapter]   = useState(0);
  const [qIdx,      setQIdx]      = useState(0);
  const [phase,     setPhase]     = useState<'story' | 'clue' | 'question' | 'feedback' | 'done'>('story');
  const [selected,  setSelected]  = useState<number | null>(null);
  const [conquered, setConquered] = useState<number[]>([]);
  const [score,     setScore]     = useState(0);
  const [correct,   setCorrect]   = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    fetch('/api/games/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ gameType: 'HISTORY_CONQUEST', mode: 'SOLO', gradeLevel: grade }),
    }).then(r => r.ok ? r.json() : null).then(d => { if (d?.sessionId) sessionRef.current = d.sessionId; }).catch(() => {});
  }, [grade]);

  const ch = CHAPTERS[chapter];
  const q  = ch?.questions[qIdx];

  function choose(idx: number) {
    if (phase !== 'question' || !q) return;
    setSelected(idx);
    setAttempted(a => a + 1);
    if (idx === q.answer) { setCorrect(c => c + 1); setScore(s => s + 150); }
    setPhase('feedback');
  }

  function nextQ() {
    setSelected(null);
    const isLastQ = qIdx + 1 >= ch.questions.length;
    if (isLastQ) {
      setConquered(c => [...c, chapter]);
      if (chapter + 1 >= CHAPTERS.length) { setPhase('done'); }
      else { setChapter(c => c + 1); setQIdx(0); setPhase('story'); }
    } else {
      setQIdx(i => i + 1);
      setPhase('question');
    }
  }

  async function claim() {
    if (saving || saved) return;
    setSaving(true);
    try {
      if (sessionRef.current) {
        const dur = Math.round((Date.now() - startRef.current) / 1000);
        const acc = attempted > 0 ? correct / attempted : 0;
        await fetch('/api/games/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ sessionId: sessionRef.current, score, questionsAttempted: attempted, questionsCorrect: correct, durationSec: dur, starsEarned: acc >= 0.85 ? 3 : acc >= 0.6 ? 2 : 1, outcome: 'won' }),
        });
      }
      setSaved(true);
    } finally { setSaving(false); }
  }

  // ── Mini map ──────────────────────────────────────────────────────────────
  function MiniMap() {
    return (
      <div style={{ width: 130, height: 120, flexShrink: 0, background: 'var(--bg-elev-2)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <polygon points="30,5 70,5 82,22 85,42 75,62 62,82 50,94 38,82 25,62 15,42 18,22" fill="var(--bg-elev-3)" stroke="var(--line)" strokeWidth="1" />
          {MAP_NODES.map(n => {
            const c = CHAPTERS[n.id];
            const done = conquered.includes(n.id);
            const active = chapter === n.id;
            return (
              <g key={n.id}>
                {active && <circle cx={n.x} cy={n.y} r={n.r + 4} fill="none" stroke={c.regionColor} strokeWidth="1" opacity="0.4" />}
                <circle cx={n.x} cy={n.y} r={n.r} fill={done ? c.regionColor : 'var(--bg-elev-3)'} stroke={c.regionColor} strokeWidth="1.5" style={{ transition: 'fill 0.6s' }} />
                {done && <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">✓</text>}
                {!done && active && <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="9" fill={c.regionColor}>●</text>}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === 'done') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a20, #1a1000)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🇮🇳</div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 20, color: 'var(--gold)', margin: '0 0 4px' }}>India Conquered!</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, margin: '0 0 20px' }}>You mastered all 5 chapters of Indian history</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {[['Score', score, 'var(--gold)'], ['Correct', `${correct}/${attempted}`, 'var(--green)'], ['Regions', conquered.length, 'var(--cyan)']].map(([l, v, c]) => (
            <div key={String(l)} style={{ background: 'var(--bg-elev-2)', borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c as string }}>{String(v)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{String(l)}</div>
            </div>
          ))}
        </div>
        <button onClick={claim} disabled={saving || saved}
          style={{ width: '100%', background: saved ? 'var(--green-deep)' : 'var(--gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
          {saved ? '✅ Rewards Claimed!' : saving ? 'Saving…' : '🎁 Claim Rewards'}
        </button>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer' }}>Back to Game Vault</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0a20, #1a1000)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'rgba(0,0,0,0.5)' }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 18 }}>←</button>
        <span style={{ color: 'var(--ink-1)', fontWeight: 700, fontSize: 14 }}>🗺️ History Conquest</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Ch {chapter + 1}/5</span>
          <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{score} pts</span>
        </div>
      </div>
      <div style={{ height: 3, background: 'var(--bg-elev-3)' }}>
        <div style={{ height: '100%', background: ch.regionColor, transition: 'width 0.5s', width: `${((chapter * 3 + qIdx) / 15) * 100}%` }} />
      </div>

      <div style={{ flex: 1, padding: '16px 16px 80px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        {/* Chapter header + map */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ background: ch.regionColor, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>{ch.year}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{ch.region}</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', margin: 0 }}>{ch.emoji} {ch.title}</h2>
          </div>
          <MiniMap />
        </div>

        {/* Story */}
        {phase === 'story' && (
          <>
            <div style={{ background: 'var(--bg-elev-1)', border: `1px solid ${ch.regionColor}40`, borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 11, color: ch.regionColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>📜 THE STORY</p>
              <p style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{ch.narrative}</p>
            </div>
            <button onClick={() => setPhase('clue')} style={{ background: ch.regionColor, color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 0 0 rgba(0,0,0,0.3)` }}>
              🔍 Reveal the Key Clue →
            </button>
          </>
        )}

        {/* Clue */}
        {phase === 'clue' && (
          <>
            <div style={{ background: `${ch.regionColor}12`, border: `1px solid ${ch.regionColor}40`, borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 11, color: ch.regionColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>🔍 KEY CLUE</p>
              <p style={{ color: 'var(--ink-1)', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>"{ch.clue}"</p>
            </div>
            <button onClick={() => setPhase('question')} style={{ background: ch.regionColor, color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 0 0 rgba(0,0,0,0.3)` }}>
              ⚡ Answer to Conquer This Region →
            </button>
          </>
        )}

        {/* Question */}
        {(phase === 'question' || phase === 'feedback') && q && (
          <>
            <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 11, color: ch.regionColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
                🎯 DEDUCTION — Q{qIdx + 1}/{ch.questions.length}
              </p>
              <p style={{ color: 'var(--ink-1)', fontSize: 15, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>{q.text}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.choices.map((choice, i) => {
                let bg = 'var(--bg-elev-2)', border = 'var(--line)', color = 'var(--ink-1)';
                if (phase === 'feedback') {
                  if (i === q.answer)     { bg = 'rgba(45,212,110,0.15)'; border = 'var(--green)'; color = 'var(--green)'; }
                  else if (i === selected) { bg = 'rgba(255,90,77,0.15)';  border = 'var(--hot)';   color = 'var(--hot)'; }
                }
                return (
                  <button key={i} onClick={() => choose(i)} disabled={phase !== 'question'}
                    style={{ background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: '14px 16px', fontSize: 14, color, cursor: phase === 'question' ? 'pointer' : 'default', transition: 'all 0.2s', textAlign: 'left', fontWeight: 500 }}>
                    <span style={{ fontFamily: 'monospace', color: ch.regionColor, marginRight: 8, fontSize: 12 }}>{String.fromCharCode(65 + i)}.</span>
                    {choice}
                  </button>
                );
              })}
            </div>
            {phase === 'feedback' && (
              <>
                <div style={{ background: selected === q.answer ? 'rgba(45,212,110,0.08)' : 'rgba(255,90,77,0.08)', border: `1px solid ${selected === q.answer ? 'rgba(45,212,110,0.3)' : 'rgba(255,90,77,0.3)'}`, borderRadius: 12, padding: 12, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                  {q.explanation}
                </div>
                <button onClick={nextQ} style={{ background: ch.regionColor, color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 0 0 rgba(0,0,0,0.3)` }}>
                  {qIdx + 1 >= ch.questions.length
                    ? (chapter + 1 >= CHAPTERS.length ? '🏆 Complete Game' : `⚡ Next: ${CHAPTERS[chapter + 1]?.title} →`)
                    : 'Next Question →'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
