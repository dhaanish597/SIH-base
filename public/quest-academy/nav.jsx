/* eslint-disable */
// Quest Academy — Nav + Game HUD shell
const { useState: useStateN, useEffect: useEffectN } = React;

function GameNav({ active, onNav, level, xp, xpMax, coins, gems, streak, hp, hpMax, isMobile }) {
  const items = [
    { key:'home', label:'Home', icon:'🏠' },
    { key:'games', label:'Games', icon:'🎮' },
    { key:'quests', label:'Quests', icon:'⚔️' },
    { key:'subjects', label:'Subjects', icon:'📚' },
    { key:'battle', label:'Battle', icon:'⚡' },
    { key:'leaderboard', label:'Ranks', icon:'🏆' },
    { key:'shop', label:'Shop', icon:'🛒' },
  ];
  if (isMobile) {
    return (
      <nav style={{
        position:'sticky', bottom: 0, left: 0, right: 0,
        background:'rgba(7,7,15,0.96)',
        borderTop:'2px solid var(--line)',
        display:'grid', gridTemplateColumns:`repeat(${items.length}, 1fr)`,
        padding:'6px 4px', zIndex: 50,
        backdropFilter:'blur(12px)',
      }}>
        {items.map(it => (
          <button key={it.key} onClick={() => onNav(it.key)} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap: 2,
            padding:'6px 2px',
            color: active === it.key ? 'var(--violet-bright)' : 'var(--ink-3)',
          }}>
            <span style={{ fontSize: 18 }}>{it.icon}</span>
            <span className="f-hud" style={{ fontSize: 9 }}>{it.label}</span>
          </button>
        ))}
      </nav>
    );
  }
  return (
    <header style={{
      position:'sticky', top: 0, zIndex: 50,
      background:'rgba(7,7,15,0.92)',
      borderBottom:'2px solid var(--line)',
      backdropFilter:'blur(12px)',
    }}>
      {/* TOP BAR : logo, nav, hud */}
      <div style={{ display:'flex', alignItems:'center', gap: 24, padding:'12px 24px', maxWidth: 1320, margin:'0 auto' }}>
        {/* LOGO */}
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <div className="icon-shield" style={{ width: 32, height: 36 }} />
          <div>
            <div className="f-display" style={{ fontSize: 18, lineHeight: 1, color:'var(--ink-1)', letterSpacing:'0.04em' }}>QUEST</div>
            <div className="f-hud" style={{ fontSize: 10, color:'var(--gold)', letterSpacing:'0.2em' }}>ACADEMY</div>
          </div>
        </div>

        {/* NAV LINKS */}
        <nav style={{ display:'flex', gap: 4, marginLeft: 12 }}>
          {items.map(it => {
            const isA = active === it.key;
            return (
              <button key={it.key} onClick={() => onNav(it.key)} style={{
                display:'flex', alignItems:'center', gap: 6,
                padding:'8px 14px',
                borderRadius: 10,
                color: isA ? 'var(--ink-1)' : 'var(--ink-3)',
                background: isA ? 'rgba(107,75,255,0.18)' : 'transparent',
                border: isA ? '1.5px solid var(--violet)' : '1.5px solid transparent',
                fontFamily:'var(--f-hud)', fontWeight: 700, fontSize: 12,
                letterSpacing:'0.1em', textTransform:'uppercase',
                transition:'color .15s, background .15s, border-color .15s',
              }}
              onMouseEnter={(e)=>{ if(!isA) e.currentTarget.style.color='var(--ink-1)'; }}
              onMouseLeave={(e)=>{ if(!isA) e.currentTarget.style.color='var(--ink-3)'; }}>
                <span style={{ fontSize: 14 }}>{it.icon}</span>{it.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* HUD */}
        <HudStrip xp={xp} xpMax={xpMax} coins={coins} gems={gems} streak={streak} level={level} />
      </div>
    </header>
  );
}

function HudStrip({ xp, xpMax, coins, gems, streak, level }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
      <Pill tone="orange" icon={<Fire size={14} />}>{streak}</Pill>
      <Pill tone="cyan" icon={<span className="gem" style={{ width:12, height:12 }} />}>{gems}</Pill>
      <Pill tone="gold" icon={<Coin size={14} />}>{coins.toLocaleString()}</Pill>
      <div style={{
        display:'flex', alignItems:'center', gap: 8,
        padding:'5px 10px 5px 5px',
        background:'#000',
        border:'2px solid var(--violet)',
        borderRadius: 999,
        boxShadow:'0 3px 0 var(--violet-deep)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius:'50%',
          background:'var(--violet)', display:'grid', placeItems:'center',
          fontFamily:'var(--f-hud)', fontWeight: 700, color:'#fff',
          border:'2px solid #000', boxShadow:'inset 0 -3px 0 var(--violet-deep)',
        }}>{level}</div>
        <div style={{ width: 110 }}>
          <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)', marginBottom: 2 }}>LVL {level} · {Math.round((xp/xpMax)*100)}%</div>
          <XPBar value={xp} max={xpMax} height={6} color="violet" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GameNav, HudStrip });
