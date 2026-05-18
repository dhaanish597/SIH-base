'use client';

import { useEffect, useRef, useState } from 'react';

type Q = { text: string; choices: string[]; answerIndex: number; explanation: string };

// 24 fallback English questions (grammar + vocabulary + usage)
const FALLBACK: Q[] = [
  { text: 'She __ to school every day.', choices: ['go', 'goes', 'going', 'gone'], answerIndex: 1, explanation: '"Goes" is the third-person singular present tense. She/He/It → goes.' },
  { text: 'Which word means "extremely happy"?', choices: ['Gloomy', 'Elated', 'Tired', 'Anxious'], answerIndex: 1, explanation: '"Elated" means ecstatically happy. Gloomy = sad, Anxious = worried.' },
  { text: 'Choose the correct spelling:', choices: ['Recieve', 'Receive', 'Recive', 'Receve'], answerIndex: 1, explanation: '"Receive" — the rule: i before e, except after c.' },
  { text: 'The opposite of "ancient" is:', choices: ['Historical', 'Old', 'Modern', 'Past'], answerIndex: 2, explanation: '"Modern" means current or contemporary — the opposite of ancient.' },
  { text: '"The book __ on the table." Which verb?', choices: ['are', 'is', 'be', 'were'], answerIndex: 1, explanation: '"The book" is singular, so "is" is correct. Rule: singular subject → singular verb.' },
  { text: 'Which sentence is punctuated correctly?', choices: ["Its a nice day.", "It's a nice day.", "Its' a nice day.", "It,s a nice day."], answerIndex: 1, explanation: '"It\'s" is the contraction of "it is". The apostrophe replaces the omitted letter.' },
  { text: '"Benevolent" means:', choices: ['Cruel', 'Kind and generous', 'Angry', 'Confused'], answerIndex: 1, explanation: 'From Latin bene (well) + volens (wishing). Benevolent = well-wishing, generous.' },
  { text: 'The plural of "child" is:', choices: ['Childs', 'Childes', 'Children', 'Childrens'], answerIndex: 2, explanation: '"Children" is an irregular plural — does not follow the standard "-s" rule.' },
  { text: 'She ran __ than her classmates.', choices: ['more faster', 'most fast', 'faster', 'more fast'], answerIndex: 2, explanation: '"Faster" is the comparative. One-syllable adverbs use "-er", not "more".' },
  { text: 'Which word is a synonym for "brave"?', choices: ['Timid', 'Fearless', 'Reckless', 'Quiet'], answerIndex: 1, explanation: '"Fearless" = without fear. Timid = shy. Reckless = careless, not brave.' },
  { text: '__ either of them know the answer?', choices: ['Do', 'Does', 'Did', 'Have'], answerIndex: 1, explanation: '"Either" is singular, so it takes "does". Compare: "Do they know?" vs "Does either know?"' },
  { text: '"Ambiguous" means:', choices: ['Clear and direct', 'Open to interpretation', 'Wrong', 'Simple'], answerIndex: 1, explanation: '"Ambiguous" = having more than one possible meaning. Opposite of clear or precise.' },
  { text: '"He told __ the truth." Choose the pronoun:', choices: ['they', 'their', 'them', 'those'], answerIndex: 2, explanation: '"Them" is the object pronoun. After a verb, use object pronouns (me/him/her/them).' },
  { text: 'Which word is an antonym of "scarce"?', choices: ['Rare', 'Limited', 'Plentiful', 'Few'], answerIndex: 2, explanation: '"Plentiful" means available in large quantities — the opposite of scarce (rare/limited).' },
  { text: '"Loquacious" means:', choices: ['Quiet and shy', 'Very talkative', 'Wise', 'Secretive'], answerIndex: 1, explanation: 'From Latin loqui (to speak). Loquacious = excessively talkative. Compare: taciturn (quiet).' },
  { text: 'Choose the correctly capitalized sentence:', choices: ["i love india.", "I Love India.", "I love India.", "I Love india."], answerIndex: 2, explanation: '"I" is always capitalized. Proper nouns like "India" are capitalized. Common nouns are not.' },
  { text: '"The team __ playing well." Which verb?', choices: ['are', 'were', 'is', 'have'], answerIndex: 2, explanation: 'In formal English, collective nouns (team, class, jury) take singular verbs: "is".' },
  { text: '"Ephemeral" means:', choices: ['Everlasting', 'Lasting a very short time', 'Spiritual', 'Ancient'], answerIndex: 1, explanation: 'From Greek ephemeros (lasting a day). Ephemeral = short-lived, transient. E.g., morning dew.' },
  { text: 'Which sentence is in passive voice?', choices: ['The dog bit the man.', 'The man was bitten by the dog.', 'The dog ran away.', 'The man called the dog.'], answerIndex: 1, explanation: 'Passive voice: subject receives the action. "The man was bitten" — man is acted upon.' },
  { text: '"Exacerbate" means:', choices: ['To improve', 'To explain', 'To make worse', 'To remove'], answerIndex: 2, explanation: '"Exacerbate" = to make something worse. E.g., "Stress exacerbates health problems."' },
  { text: 'Choose the grammatically correct sentence:', choices: ['Between you and I', 'Between you and me', 'Between I and you', 'Between me and I'], answerIndex: 1, explanation: 'After prepositions (between, with, for), use object pronouns: me/him/her — not I/he/she.' },
  { text: '"Ubiquitous" means:', choices: ['Very rare', 'Found everywhere', 'Very old', 'Complicated'], answerIndex: 1, explanation: '"Ubiquitous" = present everywhere. E.g., "Mobile phones are ubiquitous in modern life."' },
  { text: 'The verb "to run" in present perfect is:', choices: ['ran', 'running', 'have run', 'runs'], answerIndex: 2, explanation: 'Present perfect = have/has + past participle. Run → have run. E.g., "I have run 5 km."' },
  { text: 'Which figure of speech is "time is a thief"?', choices: ['Simile', 'Metaphor', 'Alliteration', 'Hyperbole'], answerIndex: 1, explanation: 'A metaphor directly equates two unlike things. Simile uses "like" or "as". "Time IS a thief" = metaphor.' },
];

export default function WordForgeGame({ grade = 9, onExit }: { grade?: number; onExit: () => void }) {
  const sessionRef  = useRef<string | null>(null);
  const startRef    = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [phase,     setPhase]     = useState<'ready' | 'playing' | 'feedback' | 'done'>('ready');
  const [qIdx,      setQIdx]      = useState(0);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [timer,     setTimer]     = useState(15);
  const [lives,     setLives]     = useState(3);
  const [combo,     setCombo]     = useState(0);
  const [score,     setScore]     = useState(0);
  const [correct,   setCorrect]   = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [floatMsg,  setFloatMsg]  = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/questions?subject=English&grade=${grade}&status=APPROVED&take=20`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then((rows: any[]) => {
          const mapped: Q[] = rows.map((q: any) => ({
            text: q.text,
            choices: Array.isArray(q.choices) ? q.choices : (() => { try { return JSON.parse(q.choices || '[]'); } catch { return []; } })(),
            answerIndex: q.answerIndex ?? 0,
            explanation: q.explanation ?? '',
          })).filter((q: Q) => q.choices.length >= 2);
          return mapped.length >= 8 ? mapped.slice(0, 24) : FALLBACK;
        })
        .catch(() => FALLBACK),
      fetch('/api/games/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ gameType: 'WORD_FORGE', mode: 'SOLO', gradeLevel: grade }),
      }).then(r => r.ok ? r.json() : null).then(d => { if (d?.sessionId) sessionRef.current = d.sessionId; }).catch(() => {}),
    ]).then(([qs]) => {
      if (!cancelled) { setQuestions(qs as Q[]); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [grade]);

  // Stable timeout action via ref — avoids stale closure in interval
  const timeoutRef = useRef<() => void>(() => {});
  timeoutRef.current = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const currentLives = lives;
    const nextLives = currentLives - 1;
    setLives(nextLives);
    setCombo(0);
    setAttempted(a => a + 1);
    setSelected(-1);
    setPhase('feedback');
    showFloat("⏰ Time's up! −1 life");
    setTimeout(() => advance(nextLives, qIdx), 1800);
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(15);
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(intervalRef.current!); timeoutRef.current(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, qIdx]);

  function showFloat(msg: string) {
    setFloatMsg(msg);
    setTimeout(() => setFloatMsg(null), 1300);
  }

  function advance(livesLeft: number, currentQIdx: number) {
    setSelected(null);
    if (livesLeft <= 0) { setPhase('done'); return; }
    const next = currentQIdx + 1;
    if (next >= questions.length) { setPhase('done'); return; }
    setQIdx(next);
    setPhase('playing');
  }

  function choose(idx: number) {
    if (phase !== 'playing') return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const q = questions[qIdx];
    if (!q) return;
    setSelected(idx);
    setAttempted(a => a + 1);
    setPhase('feedback');

    const isCorrect = idx === q.answerIndex;
    let nextLives = lives;

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setCorrect(c => c + 1);
      const mult = Math.min(newCombo, 4);
      const pts  = Math.round(100 * (0.6 + mult * 0.35) * (0.5 + (timer / 15) * 0.5));
      setScore(s => s + pts);
      showFloat(`+${pts} pts${newCombo >= 3 ? ` · 🔥 ×${mult} COMBO!` : ''}`);
    } else {
      setCombo(0);
      nextLives = lives - 1;
      setLives(nextLives);
      showFloat('❌ Wrong! −1 life');
    }
    setTimeout(() => advance(nextLives, qIdx), 1800);
  }

  async function claim() {
    if (saving || saved) return;
    setSaving(true);
    try {
      if (sessionRef.current) {
        const dur  = Math.round((Date.now() - startRef.current) / 1000);
        const acc  = attempted > 0 ? correct / attempted : 0;
        const stars = acc >= 0.85 ? 3 : acc >= 0.6 ? 2 : 1;
        await fetch('/api/games/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ sessionId: sessionRef.current, score, questionsAttempted: attempted, questionsCorrect: correct, durationSec: dur, starsEarned: stars, outcome: 'won' }),
        });
      }
      setSaved(true);
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0E0520', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
      Loading questions…
    </div>
  );

  const q = questions[qIdx];
  const circ   = 2 * Math.PI * 20;
  const offset = circ * (1 - timer / 15);
  const tClr   = timer <= 5 ? 'var(--hot)' : timer <= 9 ? 'var(--gold)' : 'var(--violet-bright)';

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const acc   = attempted > 0 ? correct / attempted : 0;
    const stars = acc >= 0.85 ? 3 : acc >= 0.6 ? 2 : 1;
    return (
      <div style={{ minHeight: '100vh', background: '#0E0520', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>📖</div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 20, color: 'var(--violet-bright)', margin: '0 0 4px' }}>Word Forge Complete</h2>
          <div style={{ fontSize: 28, marginBottom: 18 }}>{Array.from({ length: 3 }, (_, i) => i < stars ? '⭐' : '☆').join('')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {[['Score', score, 'var(--gold)'], ['Correct', correct, 'var(--green)'], ['Best Combo', combo, 'var(--violet-bright)']].map(([l, v, c]) => (
              <div key={String(l)} style={{ background: 'var(--bg-elev-2)', borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: c as string }}>{String(v)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{String(l)}</div>
              </div>
            ))}
          </div>
          <button onClick={claim} disabled={saving || saved}
            style={{ width: '100%', background: saved ? 'var(--green-deep)' : 'var(--gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10, opacity: saving ? 0.7 : 1 }}>
            {saved ? '✅ Rewards Claimed!' : saving ? 'Saving…' : '🎁 Claim Rewards'}
          </button>
          <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer' }}>Back to Game Vault</button>
        </div>
      </div>
    );
  }

  // ── Ready ─────────────────────────────────────────────────────────────────
  if (phase === 'ready') return (
    <div style={{ minHeight: '100vh', background: '#0E0520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 8 }}>📖</div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 28, color: 'var(--ink-1)', margin: '0 0 10px' }}>Word Forge</h1>
      <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 28, maxWidth: 280 }}>
        Answer grammar & vocabulary questions. Stay fast to build your combo multiplier!
      </p>
      <div style={{ display: 'flex', gap: 28, marginBottom: 32 }}>
        {[['⏱️', '15s', 'Per question'], ['❤️', '3 lives', 'Wrong = −1'], ['🔥', '×4 max', 'Combo bonus']].map(([e, v, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>{e}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 600, marginTop: 4 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setPhase('playing')}
        style={{ background: 'var(--violet)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--hd-violet)' }}>
        📖 Start Word Forge
      </button>
    </div>
  );

  // ── Playing / Feedback ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0E0520', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'rgba(0,0,0,0.5)' }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>←</button>
        <span style={{ color: 'var(--ink-1)', fontWeight: 700, fontSize: 14 }}>📖 Word Forge</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: 3 }, (_, i) => <span key={i} style={{ fontSize: 16 }}>{i < lives ? '❤️' : '🩶'}</span>)}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {combo >= 2 && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>🔥 ×{Math.min(combo, 4)}</span>}
          <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{score} pts</span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: 'var(--bg-elev-3)' }}>
        <div style={{ height: '100%', background: 'var(--violet)', transition: 'width 0.4s', width: `${(qIdx / questions.length) * 100}%` }} />
      </div>

      {/* Float message */}
      {floatMsg && (
        <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-elev-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 700, color: floatMsg.includes('❌') || floatMsg.includes('⏰') ? 'var(--hot)' : 'var(--green)', zIndex: 100, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {floatMsg}
        </div>
      )}

      <div style={{ flex: 1, padding: '16px 16px 80px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Question card */}
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--violet-bright)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Q{qIdx + 1}/{questions.length} · English
            </span>
            <div style={{ position: 'relative', width: 44, height: 44 }}>
              <svg viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)', width: 44, height: 44 }}>
                <circle cx="22" cy="22" r="20" stroke="var(--bg-elev-3)" strokeWidth="3" fill="none" />
                <circle cx="22" cy="22" r="20" stroke={tClr} strokeWidth="3" fill="none"
                  strokeDasharray={String(circ)} strokeDashoffset={String(offset)}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
              </svg>
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: tClr, fontFamily: 'monospace' }}>{timer}</span>
            </div>
          </div>
          <p style={{ color: 'var(--ink-1)', fontSize: 16, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>{q?.text}</p>
        </div>

        {/* Choices */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {q?.choices.map((choice: string, i: number) => {
            let bg = 'var(--bg-elev-2)', border = 'var(--line)';
            if (phase === 'feedback' && selected !== null) {
              if (i === q.answerIndex)   { bg = 'rgba(45,212,110,0.15)'; border = 'var(--green)'; }
              else if (i === selected)   { bg = 'rgba(255,90,77,0.15)';  border = 'var(--hot)'; }
            }
            return (
              <button key={i} onClick={() => choose(i)} disabled={phase !== 'playing'}
                style={{ background: bg, border: `2px solid ${border}`, borderRadius: 12, padding: '14px 10px', fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', cursor: phase === 'playing' ? 'pointer' : 'default', transition: 'all 0.2s', textAlign: 'left', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--violet-bright)', fontFamily: 'monospace', marginRight: 6, fontSize: 12 }}>{String.fromCharCode(65 + i)}.</span>
                {choice}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {phase === 'feedback' && q && (
          <div style={{ background: selected === q.answerIndex ? 'rgba(45,212,110,0.08)' : 'rgba(255,90,77,0.08)', border: `1px solid ${selected === q.answerIndex ? 'rgba(45,212,110,0.25)' : 'rgba(255,90,77,0.25)'}`, borderRadius: 12, padding: 14, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            {q.explanation || (selected === q.answerIndex ? '✅ Correct!' : `❌ Answer: ${q.choices[q.answerIndex]}`)}
          </div>
        )}
      </div>
    </div>
  );
}
