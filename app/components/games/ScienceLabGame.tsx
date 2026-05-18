'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Reagents ─────────────────────────────────────────────────────────────────
const REAGENTS = [
  { id: 'H2',  sym: 'H₂',  name: 'Hydrogen',  color: '#18D6FF', emoji: '💧' },
  { id: 'O2',  sym: 'O₂',  name: 'Oxygen',    color: '#2DD46E', emoji: '🌿' },
  { id: 'Na',  sym: 'Na',  name: 'Sodium',    color: '#FFC93C', emoji: '⚡' },
  { id: 'Cl',  sym: 'Cl₂', name: 'Chlorine',  color: '#A8FF3E', emoji: '☁️' },
  { id: 'Fe',  sym: 'Fe',  name: 'Iron',      color: '#D08850', emoji: '🔩' },
  { id: 'C',   sym: 'C',   name: 'Carbon',    color: '#888',    emoji: '⬛' },
  { id: 'Ca',  sym: 'Ca',  name: 'Calcium',   color: '#F5F5DC', emoji: '🪨' },
  { id: 'N2',  sym: 'N₂',  name: 'Nitrogen',  color: '#B0C4DE', emoji: '💨' },
  { id: 'H2O', sym: 'H₂O', name: 'Water',     color: '#38BDF8', emoji: '🌊' },
];

// ─── Reaction database ────────────────────────────────────────────────────────
type Reaction = {
  product: string; name: string; equation: string;
  fact: string; emoji: string; color: string; points: number;
};

const REACTIONS: Record<string, Reaction> = {
  'H2+O2':  { product: 'H₂O',    name: 'Water',               equation: '2H₂ + O₂ → 2H₂O',          emoji: '💧', color: '#18D6FF', points: 50,  fact: 'This exothermic reaction releases enormous energy. Liquid hydrogen + oxygen fuel rockets — the exhaust is just water!' },
  'Na+Cl':  { product: 'NaCl',   name: 'Table Salt',           equation: 'Na + Cl₂ → NaCl',           emoji: '🧂', color: '#FFC93C', points: 50,  fact: 'An ionic bond forms between sodium (metal) and chlorine (non-metal). The result is the salt you add to food every day!' },
  'Fe+O2':  { product: 'Fe₂O₃', name: 'Iron Oxide (Rust)',    equation: '4Fe + 3O₂ → 2Fe₂O₃',        emoji: '🔴', color: '#D08850', points: 50,  fact: 'Rust! Iron slowly reacts with oxygen in the presence of moisture. This oxidation is why iron objects turn brown over time.' },
  'C+O2':   { product: 'CO₂',   name: 'Carbon Dioxide',       equation: 'C + O₂ → CO₂',              emoji: '💨', color: '#888',    points: 50,  fact: 'Every time you exhale, you release CO₂! It is also produced when fossil fuels burn and is the primary greenhouse gas.' },
  'H2+Cl':  { product: 'HCl',   name: 'Hydrochloric Acid',    equation: 'H₂ + Cl₂ → 2HCl',           emoji: '⚗️', color: '#A8FF3E', points: 60,  fact: 'Hydrochloric acid is found in your stomach (gastric acid)! It helps digest food by breaking down proteins and killing bacteria.' },
  'Ca+O2':  { product: 'CaO',   name: 'Quicklime',            equation: '2Ca + O₂ → 2CaO',           emoji: '🪨', color: '#F5F5DC', points: 60,  fact: 'Quicklime (calcium oxide) is used in cement, steel, and glass production. Add water to get slaked lime (Ca(OH)₂) used in plaster.' },
  'N2+H2':  { product: 'NH₃',   name: 'Ammonia',              equation: 'N₂ + 3H₂ → 2NH₃',           emoji: '🌱', color: '#2DD46E', points: 70,  fact: 'The Haber-Bosch process makes ammonia from nitrogen and hydrogen. It produces fertilizers that feed roughly half the world population!' },
  'Na+H2O': { product: 'NaOH',  name: 'Sodium Hydroxide + H₂', equation: '2Na + 2H₂O → 2NaOH + H₂↑', emoji: '💥', color: '#FF5A4D', points: 80,  fact: 'Danger! Sodium reacts violently with water, producing flammable hydrogen gas and sodium hydroxide (lye). Used to make soap and paper.' },
};

function getKey(a: string, b: string): string {
  for (const k of [`${a}+${b}`, `${b}+${a}`]) if (REACTIONS[k]) return k;
  return '';
}

const TOTAL = Object.keys(REACTIONS).length;

export default function ScienceLabGame({ grade = 9, onExit }: { grade?: number; onExit: () => void }) {
  const sessionRef = useRef<string | null>(null);
  const startRef   = useRef(Date.now());

  const [slotA,       setSlotA]       = useState<string | null>(null);
  const [slotB,       setSlotB]       = useState<string | null>(null);
  const [reaction,    setReaction]    = useState<Reaction | null>(null);
  const [noRxn,       setNoRxn]       = useState(false);
  const [isNew,       setIsNew]       = useState(false);
  const [animating,   setAnimating]   = useState(false);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [score,       setScore]       = useState(0);
  const [phase,       setPhase]       = useState<'playing' | 'done'>('playing');
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    fetch('/api/games/start', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ gameType: 'SCIENCE_LAB', mode: 'SOLO', gradeLevel: grade }),
    }).then(r => r.ok ? r.json() : null).then(d => { if (d?.sessionId) sessionRef.current = d.sessionId; }).catch(() => {});
  }, [grade]);

  function pick(id: string) {
    if (animating) return;
    if (slotA === id) { setSlotA(null); return; }
    if (slotB === id) { setSlotB(null); return; }
    if (!slotA) { setSlotA(id); return; }
    if (!slotB) { setSlotB(id); return; }
    // replace B
    setSlotB(id);
  }

  function mix() {
    if (!slotA || !slotB || animating) return;
    setAnimating(true);
    setReaction(null);
    setNoRxn(false);
    setIsNew(false);
    setTimeout(() => {
      const key = getKey(slotA, slotB);
      if (key) {
        const rxn = REACTIONS[key];
        const fresh = !discoveries.includes(key);
        setReaction(rxn);
        setIsNew(fresh);
        if (fresh) {
          const newDisc = [...discoveries, key];
          setDiscoveries(newDisc);
          setScore(s => s + rxn.points);
          if (newDisc.length >= TOTAL) setTimeout(() => setPhase('done'), 2000);
        }
      } else {
        setNoRxn(true);
      }
      setAnimating(false);
    }, 700);
  }

  function clear() { setSlotA(null); setSlotB(null); setReaction(null); setNoRxn(false); setIsNew(false); }

  async function finish() {
    if (saving || saved) return;
    setSaving(true);
    try {
      if (sessionRef.current) {
        const dur = Math.round((Date.now() - startRef.current) / 1000);
        const stars = discoveries.length >= 7 ? 3 : discoveries.length >= 4 ? 2 : 1;
        await fetch('/api/games/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ sessionId: sessionRef.current, score, questionsAttempted: discoveries.length, questionsCorrect: discoveries.length, durationSec: dur, starsEarned: stars, outcome: 'won' }),
        });
      }
      setSaved(true);
    } finally { setSaving(false); }
  }

  const rA = REAGENTS.find(r => r.id === slotA);
  const rB = REAGENTS.find(r => r.id === slotB);

  // ── Done screen ───────────────────────────────────────────────────────────
  if (phase === 'done') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #032117, #0a1a14)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, maxWidth: 320, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🏆</div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, color: 'var(--gold)', margin: '0 0 4px' }}>Lab Complete!</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, margin: '0 0 20px' }}>You discovered all {TOTAL} reactions!</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg-elev-2)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{score}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Score</div>
          </div>
          <div style={{ background: 'var(--bg-elev-2)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{discoveries.length}/{TOTAL}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Reactions</div>
          </div>
        </div>
        <button onClick={finish} disabled={saving || saved}
          style={{ width: '100%', background: saved ? 'var(--green-deep)' : 'var(--gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>
          {saved ? '✅ Rewards Claimed!' : saving ? 'Saving…' : '🎁 Claim Rewards'}
        </button>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer' }}>Back to Game Vault</button>
      </div>
    </div>
  );

  // ── Lab screen ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #032117 0%, #071a23 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'rgba(0,0,0,0.4)' }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 18 }}>←</button>
        <span style={{ color: 'var(--ink-1)', fontWeight: 700, fontSize: 14 }}>⚗️ Science Lab</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>{discoveries.length}/{TOTAL} found</span>
          <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>{score} pts</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px 16px 80px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        {/* Instructions */}
        <p style={{ color: 'var(--ink-3)', fontSize: 12, margin: 0 }}>
          Select <strong style={{ color: 'var(--cyan)' }}>Reagent A</strong> then <strong style={{ color: 'var(--gold)' }}>Reagent B</strong>, then press Mix to discover reactions!
        </p>

        {/* Reagent shelf */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {REAGENTS.map(r => {
            const inA = slotA === r.id, inB = slotB === r.id;
            const sel = inA || inB;
            return (
              <button key={r.id} onClick={() => pick(r.id)}
                style={{ background: sel ? `${r.color}22` : 'var(--bg-elev-2)', border: `2px solid ${sel ? r.color : 'var(--line)'}`, borderRadius: 10, padding: '10px 6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative', transition: 'all 0.2s' }}>
                {(inA || inB) && <span style={{ position: 'absolute', top: 3, right: 6, fontSize: 9, fontWeight: 700, color: r.color, background: 'var(--bg-deep)', borderRadius: 4, padding: '1px 4px' }}>{inA ? 'A' : 'B'}</span>}
                <span style={{ fontSize: 22 }}>{r.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color, fontFamily: 'monospace' }}>{r.sym}</span>
                <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{r.name}</span>
              </button>
            );
          })}
        </div>

        {/* Mixing bench */}
        <div style={{ background: 'var(--bg-elev-1)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Mixing Bench</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 14 }}>
            {[{ r: rA, slot: 'A', clr: 'var(--cyan)' }, { r: rB, slot: 'B', clr: 'var(--gold)' }].map(({ r, slot, clr }, i) => (
              <div key={i} style={{ width: 64, height: 64, background: r ? `${r.color}20` : 'var(--bg-elev-2)', border: `2px dashed ${r ? r.color : clr}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                {r ? <>
                  <span style={{ fontSize: 22 }}>{r.emoji}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: r.color, fontWeight: 700 }}>{r.sym}</span>
                </> : <span style={{ fontSize: 18, color: clr, opacity: 0.5, fontWeight: 700 }}>{slot}</span>}
              </div>
            ))}
            <span style={{ fontSize: 22, color: 'var(--ink-3)' }}>→</span>
            <div style={{ width: 64, height: 64, background: reaction ? `${reaction.color}20` : 'var(--bg-elev-2)', border: `2px solid ${reaction ? reaction.color : 'var(--line)'}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {reaction ? <>
                <span style={{ fontSize: 22 }}>{reaction.emoji}</span>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: reaction.color, fontWeight: 700 }}>{reaction.product}</span>
              </> : animating ? <span style={{ fontSize: 22 }}>🔄</span> : <span style={{ fontSize: 18, color: 'var(--ink-dim)', fontWeight: 700 }}>?</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={mix} disabled={!slotA || !slotB || animating}
              style={{ flex: 1, background: slotA && slotB ? 'var(--green)' : 'var(--bg-elev-3)', color: slotA && slotB ? 'var(--bg-deep)' : 'var(--ink-dim)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: slotA && slotB ? 'pointer' : 'default', boxShadow: slotA && slotB ? 'var(--hd-green)' : 'none', transition: 'all 0.2s' }}>
              {animating ? '🔄 Mixing…' : '⚗️ Mix!'}
            </button>
            <button onClick={clear} style={{ background: 'var(--bg-elev-3)', color: 'var(--ink-3)', border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 14, cursor: 'pointer' }}>🗑️</button>
          </div>
        </div>

        {/* Reaction result */}
        {reaction && (
          <div style={{ background: `${reaction.color}12`, border: `1px solid ${reaction.color}40`, borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}>{reaction.emoji}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: reaction.color }}>
                  {reaction.name} {isNew && <span style={{ fontSize: 11, background: 'var(--gold)', color: 'var(--bg-deep)', borderRadius: 6, padding: '2px 8px', marginLeft: 4 }}>✨ NEW +{reaction.points}pts</span>}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--ink-2)', marginTop: 2 }}>{reaction.equation}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, margin: 0 }}>{reaction.fact}</p>
          </div>
        )}

        {noRxn && (
          <div style={{ background: 'rgba(255,90,77,0.06)', border: '1px solid rgba(255,90,77,0.2)', borderRadius: 14, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🚫</div>
            <p style={{ color: 'var(--ink-3)', fontSize: 13, margin: 0 }}>No reaction. These chemicals don't react under normal conditions — try a different combination!</p>
          </div>
        )}

        {/* Discovery journal */}
        {discoveries.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>📚 Discovery Journal ({discoveries.length}/{TOTAL})</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {discoveries.map(key => (
                <span key={key} style={{ background: `${REACTIONS[key].color}18`, border: `1px solid ${REACTIONS[key].color}40`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: REACTIONS[key].color }}>
                  {REACTIONS[key].emoji} {REACTIONS[key].name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Finish button */}
        {discoveries.length >= 3 && (
          <button onClick={() => setPhase('done')}
            style={{ background: 'var(--green)', color: 'var(--bg-deep)', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--hd-green)', marginTop: 4 }}>
            🏆 Complete Lab ({discoveries.length} reactions discovered)
          </button>
        )}
      </div>
    </div>
  );
}
