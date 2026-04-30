/* eslint-disable */
// Quest Academy — Cards (game card, quest card, leaderboard row, subject tile)

function GameCard({ name, subject, players, rarity = 'common', icon = '🎲', tags = [], xp, xpMax, locked, level }) {
  const subjColor = {
    math: 'var(--s-math)', science: 'var(--s-science)', english: 'var(--s-english)',
    history: 'var(--s-history)', geo: 'var(--s-geo)', coding: 'var(--s-coding)'
  }[subject] || 'var(--violet)';
  const artBg = {
    math: 'linear-gradient(135deg,#0e2a4f 0%, #051226 100%)',
    science: 'linear-gradient(135deg,#0a3b22 0%, #04190f 100%)',
    english: 'linear-gradient(135deg,#0a3a4a 0%, #03161c 100%)',
    history: 'linear-gradient(135deg,#3a2308 0%, #1a0f02 100%)',
    geo: 'linear-gradient(135deg,#0a3a35 0%, #021713 100%)',
    coding: 'linear-gradient(135deg,#3a0e0a 0%, #190502 100%)',
  }[subject] || 'linear-gradient(135deg,#1a1340 0%, #0c0822 100%)';

  return (
    <div className={`card r-${rarity}`} style={{ overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* ART AREA */}
      <div style={{
        position:'relative', height: 110,
        background: artBg,
        borderBottom:'2px solid #000',
        display:'grid', placeItems:'center', overflow:'hidden',
      }}>
        {/* grid bg */}
        <div style={{
          position:'absolute', inset: 0,
          backgroundImage: `linear-gradient(${subjColor}22 1px, transparent 1px), linear-gradient(90deg, ${subjColor}22 1px, transparent 1px)`,
          backgroundSize:'14px 14px',
          maskImage:'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }} />
        <div style={{ fontSize: 56, filter:`drop-shadow(0 4px 0 #000) drop-shadow(0 0 20px ${subjColor})`, position:'relative', zIndex: 2 }}>{icon}</div>
        {/* rarity tag */}
        <div style={{ position:'absolute', top: 8, left: 8 }}>
          <span className="f-hud" style={{
            fontSize: 10, padding:'3px 8px',
            background:'#000', color: rarityColor(rarity),
            border:`1.5px solid ${rarityColor(rarity)}`, borderRadius: 4,
          }}>{rarity.toUpperCase()}</span>
        </div>
        {locked && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', display:'grid', placeItems:'center', fontSize: 32 }}>
            🔒<div className="f-hud" style={{ fontSize: 11, color:'var(--ink-2)', marginTop: 6 }}>Lvl {level}</div>
          </div>
        )}
      </div>

      {/* META */}
      <div style={{ padding: 14, flex: 1, display:'flex', flexDirection:'column', gap: 10 }}>
        <div>
          <div className="f-display" style={{ fontSize: 18, lineHeight: 1.05 }}>{name}</div>
          <div style={{ display:'flex', gap: 6, marginTop: 6, flexWrap:'wrap' }}>
            {tags.map(t => (
              <span key={t} style={{
                fontFamily:'var(--f-hud)', fontSize: 9, fontWeight:700,
                color: subjColor, border: `1.5px solid ${subjColor}`,
                padding:'2px 6px', borderRadius: 4, letterSpacing:'0.06em',
              }}>{t.toUpperCase()}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span className="f-hud" style={{ fontSize: 11, color:'var(--ink-3)' }}>👥 {players} playing</span>
          {xp !== undefined && (
            <span className="f-hud" style={{ fontSize: 11, color:'var(--gold)' }}>{xp}/{xpMax}</span>
          )}
        </div>
        {xp !== undefined && <XPBar value={xp} max={xpMax} height={8} color={rarity==='legend'?'gold':rarity==='epic'?'violet':'cyan'} />}
        <button className="btn btn-primary btn-sm btn-block" disabled={locked}>{locked ? '🔒 Locked' : 'Play'}</button>
      </div>
    </div>
  );
}
function rarityColor(r) {
  return ({ common:'var(--r-common)', rare:'var(--r-rare)', epic:'var(--r-epic)', legend:'var(--r-legend)' })[r] || 'var(--r-common)';
}

// ============================================================
// QUEST CARD
// ============================================================
function QuestCard({ tag = 'daily', title, desc, reward, value, max, complete, claimed, timeLeft }) {
  const tagMap = {
    daily: { color:'var(--cyan)', bg:'#042A36', label:'Daily' },
    weekly: { color:'var(--violet-bright)', bg:'#1A1340', label:'Weekly' },
    special: { color:'var(--gold)', bg:'#2B1F00', label:'Event' },
    boss: { color:'var(--hot)', bg:'#2A0805', label:'Boss' },
  };
  const t = tagMap[tag] || tagMap.daily;
  const pct = Math.min(100, Math.round((value/max)*100));
  return (
    <div className="card card-pad" style={{
      borderLeftWidth: 4, borderLeftColor: complete ? 'var(--green)' : t.color,
      paddingLeft: 16, opacity: claimed ? 0.6 : 1,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 8 }}>
        <div style={{ display:'flex', flexDirection:'column', gap: 6, flex: 1 }}>
          <span className="f-hud" style={{
            display:'inline-block', alignSelf:'flex-start',
            fontSize: 9, color: t.color, background: t.bg,
            border: `1.5px solid ${t.color}`, padding:'2px 8px', borderRadius: 4,
          }}>{t.label}</span>
          <div className="f-display" style={{ fontSize: 16 }}>{title}</div>
          <div style={{ fontSize: 13, color:'var(--ink-2)' }}>{desc}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 4, justifyContent:'flex-end' }}>
            <span style={{ fontSize: 16 }}>⭐</span>
            <span className="f-hud" style={{ color:'var(--gold)', fontSize: 18 }}>+{reward}</span>
          </div>
          <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)' }}>XP</div>
          {timeLeft && (
            <div className="f-hud" style={{ fontSize: 10, color:'var(--hot)', marginTop: 6 }}>⏱ {timeLeft}</div>
          )}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginTop: 8 }}>
        <XPBar value={value} max={max} height={10} color={complete ? 'green' : 'cyan'} />
        <span className="f-hud" style={{ fontSize: 11, color:'var(--ink-2)', minWidth: 44, textAlign:'right' }}>{value}/{max}</span>
      </div>
      {claimed && (
        <div className="f-hud" style={{ marginTop: 10, fontSize: 11, color:'var(--green)' }}>✓ Claimed</div>
      )}
      {complete && !claimed && (
        <button className="btn btn-green btn-sm" style={{ marginTop: 10 }}>Claim {reward} XP</button>
      )}
    </div>
  );
}

// ============================================================
// LEADERBOARD ROW
// ============================================================
function LBRow({ rank, you, sprite, tone, name, xp, total, badges }) {
  const variant = you ? 'you' : rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
  return (
    <div className={`lb-row ${variant}`}>
      <div className="rank">
        {medal ? <span style={{ fontSize: 22 }}>{medal}</span> : `#${rank}`}
      </div>
      <div className="pframe" style={{ width: 40, height: 40 }}>
        <div style={{ position:'relative', width:'70%', height:'70%', display:'grid', placeItems:'end center' }}>
          <Sprite name={sprite} scale={2} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <span className="f-display" style={{ fontSize: 16 }}>{name}</span>
          {you && <span className="f-hud" style={{
            fontSize: 9, padding:'2px 6px', background:'var(--violet)', color:'#fff',
            borderRadius: 4, letterSpacing:'0.1em',
          }}>YOU</span>}
        </div>
        <div style={{ marginTop: 4 }}>
          <XPBar value={xp} max={total} height={6} color={variant==='gold'?'gold':variant==='you'?'violet':'cyan'} />
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div className="f-hud" style={{ color:'var(--gold)', fontSize: 18 }}>{xp.toLocaleString()}</div>
        <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)' }}>XP · {badges} 🏅</div>
      </div>
    </div>
  );
}

// ============================================================
// SUBJECT TILE
// ============================================================
function SubjectTile({ subject, name, icon, mastery, chapters, lessons, locked, levelReq }) {
  const subjColor = {
    math: 'var(--s-math)', science: 'var(--s-science)', english: 'var(--s-english)',
    history: 'var(--s-history)', geo: 'var(--s-geo)', coding: 'var(--s-coding)'
  }[subject];
  const bg = {
    math: 'linear-gradient(135deg,#0e2a4f 0%, #051226 100%)',
    science: 'linear-gradient(135deg,#0a3b22 0%, #04190f 100%)',
    english: 'linear-gradient(135deg,#0a3a4a 0%, #03161c 100%)',
    history: 'linear-gradient(135deg,#3a2308 0%, #1a0f02 100%)',
    geo: 'linear-gradient(135deg,#0a3a35 0%, #021713 100%)',
    coding: 'linear-gradient(135deg,#3a0e0a 0%, #190502 100%)',
  }[subject];
  return (
    <div className="card" style={{ overflow:'hidden', borderColor: locked ? 'var(--line)' : subjColor, position:'relative' }}>
      <div style={{ background: bg, padding: 18, position:'relative', overflow:'hidden' }}>
        <div style={{
          position:'absolute', inset: 0,
          backgroundImage: `linear-gradient(${subjColor}1a 1px, transparent 1px), linear-gradient(90deg, ${subjColor}1a 1px, transparent 1px)`,
          backgroundSize:'14px 14px',
        }} />
        <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize: 44, lineHeight: 1, filter:`drop-shadow(0 3px 0 #000)` }}>{icon}</div>
            <div className="f-display" style={{ fontSize: 22, marginTop: 8 }}>{name}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)' }}>Mastery</div>
            <div className="f-hud" style={{ fontSize: 26, color:'var(--gold)' }}>{mastery}%</div>
          </div>
        </div>
      </div>
      <div style={{ padding: 14, display:'flex', flexDirection:'column', gap: 10 }}>
        <XPBar value={mastery} max={100} height={10} color={subject==='math'?'cyan':'gold'} />
        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--f-hud)', fontSize: 11, color:'var(--ink-3)', letterSpacing:'0.06em' }}>
          <span>{chapters} CHAPTERS</span><span>{lessons} LESSONS</span>
        </div>
        <button className="btn btn-sm btn-block" style={{
          background: locked ? 'var(--bg-elev-2)' : subjColor,
          color: locked ? 'var(--ink-3)' : '#000',
          boxShadow: locked ? 'none' : `0 4px 0 0 #000`,
        }} disabled={locked}>{locked ? `🔒 LVL ${levelReq}` : 'Explore →'}</button>
      </div>
    </div>
  );
}

Object.assign(window, { GameCard, QuestCard, LBRow, SubjectTile });
