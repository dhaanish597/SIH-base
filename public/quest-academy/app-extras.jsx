/* eslint-disable */
// Quest Academy — App shell, mobile views, modals

function LevelUpModal({ open, onClose, level }) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset: 0, background:'rgba(0,0,0,0.85)',
      display:'grid', placeItems:'center', zIndex: 9000,
      animation:'pageIn 0.2s ease',
    }} onClick={onClose}>
      <div onClick={(e)=>e.stopPropagation()} style={{
        background:'var(--bg-elev-1)',
        border:'4px solid var(--gold)',
        borderRadius: 16, padding: 32, maxWidth: 420, textAlign:'center',
        boxShadow:'0 0 60px var(--gold), 0 8px 0 #000',
        position:'relative',
      }}>
        {[...Array(20)].map((_,i)=>(
          <div key={i} style={{
            position:'absolute', left:`${(i*53)%100}%`, top:`${(i*37)%100}%`,
            width: 4, height: 4, background:'var(--gold)', borderRadius:'50%',
            animation:`pulseGlow ${1+(i%4)*0.4}s ease-in-out infinite`,
          }} />
        ))}
        <div className="f-hud" style={{ fontSize: 14, color:'var(--gold)', letterSpacing:'0.3em' }}>★ LEVEL UP ★</div>
        <div className="f-display pulse-glow" style={{ fontSize: 96, color:'var(--gold)', textShadow:'0 4px 0 #000', lineHeight: 1, margin:'10px 0' }}>{level}</div>
        <div className="f-display" style={{ fontSize: 22, color:'var(--ink-1)' }}>You leveled up!</div>
        <div style={{ color:'var(--ink-2)', marginTop: 8 }}>+200 coins · New skin unlocked</div>
        <div style={{ display:'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>LATER</button>
          <button className="btn btn-gold" onClick={onClose} style={{ flex: 1 }}>CLAIM</button>
        </div>
      </div>
    </div>
  );
}

// MOBILE FRAME — mini phone showing the home page
function MobileHome({ player, fireXP }) {
  return (
    <div style={{ background:'var(--bg-arena)', minHeight:'100%', paddingBottom: 80 }} className="arena-bg">
      {/* TOP HUD */}
      <div style={{
        position:'sticky', top: 0, background:'rgba(7,7,15,0.95)', backdropFilter:'blur(8px)',
        padding:'10px 14px', borderBottom:'2px solid var(--line)', zIndex: 10,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <div className="icon-shield" style={{ width: 26, height: 30 }} />
          <div className="f-display" style={{ fontSize: 14 }}>QUEST ACADEMY</div>
          <div style={{ flex: 1 }} />
          <Pill tone="orange" icon={<Fire size={11} />}>{player.streak}</Pill>
          <Pill tone="gold" icon={<Coin size={11} />}>{player.coins}</Pill>
        </div>
      </div>

      <div style={{ padding: 14, display:'flex', flexDirection:'column', gap: 14 }}>
        {/* HERO MINI */}
        <div className="card" style={{ overflow:'hidden', borderColor:'var(--violet)' }}>
          <div className="arena-bg scanlines" style={{ padding: 14, position:'relative' }}>
            <div style={{ display:'flex', gap: 12, alignItems:'center' }}>
              <Avatar sprite="knight" tone="violet" size={64} level={player.level} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)' }}>WELCOME BACK</div>
                <div className="f-display" style={{ fontSize: 20, lineHeight: 1 }}>{player.name}</div>
                <div className="f-hud" style={{ fontSize: 10, color:'var(--violet-bright)', marginTop: 4 }}>LVL {player.level} · DIAMOND III</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="f-hud" style={{ fontSize: 9, color:'var(--gold)', marginBottom: 4 }}>{player.xp} / {player.xpMax} XP</div>
              <XPBar value={player.xp} max={player.xpMax} height={12} color="violet" />
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={(e)=>{
          const r = e.currentTarget.getBoundingClientRect();
          fireXP && fireXP({ x: r.left + r.width/2 - 30, y: r.top, label:'+25 XP' });
        }}>▶ RESUME QUEST</button>

        {/* DAILY QUESTS */}
        <div>
          <div className="f-display" style={{ fontSize: 16, marginBottom: 8 }}>⚔ Today's Quests</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
            <QuestCard tag="daily" title="Slay 5 Math Mobs" desc="Defeat 5 problems" reward={50} value={3} max={5} />
            <QuestCard tag="daily" title="Train 15 min" desc="Study any subject" reward={30} value={15} max={15} complete />
          </div>
        </div>

        {/* MINI LB */}
        <div className="card card-pad">
          <div className="f-display" style={{ fontSize: 16, marginBottom: 10 }}>🏆 School Ladder</div>
          <LBRow rank={1} name="Aiden K." sprite="wizard" xp={4820} total={5000} badges={42} />
          <LBRow rank={3} you name={player.name} sprite="knight" xp={3640} total={5000} badges={29} />
        </div>

        {/* DAILY CHEST */}
        <div className="card card-pad" style={{ borderColor:'var(--gold)', textAlign:'center' }}>
          <div className="f-display" style={{ fontSize: 14 }}>🎁 Daily Chest</div>
          <div style={{ fontSize: 48, filter:'drop-shadow(0 0 10px var(--gold))' }} className="pulse-glow">📦</div>
          <div className="f-display" style={{ fontSize: 18, color:'var(--gold)' }}>02:14:38</div>
        </div>
      </div>
    </div>
  );
}

function MobileQuiz({ fireXP }) {
  const [state, setState] = React.useState('idle'); // idle | correct | wrong
  const [hp, setHp] = React.useState(3);
  const handle = (correct, e) => {
    setState(correct ? 'correct' : 'wrong');
    if (!correct) setHp(h => Math.max(0, h-1));
    if (correct && fireXP) {
      const r = e.currentTarget.getBoundingClientRect();
      fireXP({ x: r.left + r.width/2 - 30, y: r.top, label:'+15 XP', color:'var(--green)' });
    }
    setTimeout(() => setState('idle'), 700);
  };
  return (
    <div style={{ background:'var(--bg-arena)', minHeight:'100%', display:'flex', flexDirection:'column' }} className="arena-bg">
      {/* HUD */}
      <div style={{ padding:'12px 14px', borderBottom:'2px solid var(--line)', display:'flex', alignItems:'center', gap: 10 }}>
        <button style={{ color:'var(--ink-3)', fontSize: 20 }}>✕</button>
        <div style={{ flex: 1 }}>
          <XPBar value={6} max={10} height={10} color="cyan" />
        </div>
        <div style={{ display:'flex', gap: 2 }}>
          {[...Array(3)].map((_,i)=>(
            <span key={i} style={{ fontSize: 16, opacity: i < hp ? 1 : 0.2 }}>❤️</span>
          ))}
        </div>
      </div>

      {/* QUESTION */}
      <div style={{ flex: 1, padding: 18, display:'flex', flexDirection:'column' }}>
        <div className="f-hud" style={{ fontSize: 11, color:'var(--cyan)' }}>QUESTION 6 / 10</div>
        <div className="f-display" style={{ fontSize: 22, marginTop: 12, lineHeight: 1.2 }}>
          Solve for x:
        </div>
        <div className={`card ${state==='wrong'?'shake':''}`} style={{
          marginTop: 16, padding: 28, textAlign:'center',
          borderColor: state==='correct' ? 'var(--green)' : state==='wrong' ? 'var(--hot)' : 'var(--line)',
          background: state==='correct' ? 'rgba(45,212,110,0.15)' : state==='wrong' ? 'rgba(255,90,77,0.15)' : 'var(--bg-elev-1)',
          transition:'all 0.2s',
        }}>
          <div className="f-display" style={{ fontSize: 36 }}>2x + 8 = 20</div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
          {[
            { v: 'x = 4', correct: false },
            { v: 'x = 6', correct: true },
            { v: 'x = 8', correct: false },
            { v: 'x = 12', correct: false },
          ].map((a,i)=>(
            <button key={i} onClick={(e)=>handle(a.correct, e)} className="btn btn-ghost"
              style={{
                padding:'18px 12px', fontSize: 18, fontFamily:'var(--f-display)',
                letterSpacing: 0, textTransform: 'none',
              }}>
              {a.v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LevelUpModal, MobileHome, MobileQuiz });
