/* eslint-disable */
// Quest Academy — PAGES
// Globals: React + atoms/cards/nav components

// ============================================================
// HOME PAGE — Direction A (Arena Dark / Clash-style)
// ============================================================
function HomePage({ player, fireXP }) {
  const handleClick = (e, label='+25 XP') => {
    if (!fireXP) return;
    const r = e.currentTarget.getBoundingClientRect();
    fireXP({ x: r.left + r.width/2 - 30, y: r.top + 10, label });
  };
  return (
    <div className="page-in" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap: 20, padding: 24, maxWidth: 1320, margin:'0 auto' }}>
      <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>

        {/* HERO BANNER */}
        <div className="card" style={{ overflow:'hidden', position:'relative', border:'2px solid var(--violet)' }}>
          <div className="arena-bg scanlines" style={{ padding: '28px 28px 24px', position:'relative', minHeight: 220 }}>
            {/* decorative pixel stars */}
            {[...Array(20)].map((_,i) => (
              <div key={i} style={{
                position:'absolute',
                left: `${(i*53)%100}%`, top: `${(i*37)%100}%`,
                width: 2, height: 2, background: i%3===0?'var(--gold)':'var(--cyan)',
                opacity: 0.5 + (i%5)*0.1,
                animation: `pulseGlow ${1+(i%4)*0.5}s ease-in-out infinite`,
              }} />
            ))}
            <div style={{ display:'flex', gap: 24, alignItems:'center', position:'relative' }}>
              <div style={{ position:'relative' }}>
                <Avatar sprite="knight" tone="violet" size={120} level={player.level} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="f-hud" style={{ fontSize: 11, color:'var(--ink-3)', letterSpacing:'0.2em' }}>WELCOME BACK,</div>
                <div className="f-display" style={{ fontSize: 44, lineHeight: 1, marginTop: 4 }}>{player.name}</div>
                <div className="f-hud" style={{ fontSize: 13, color:'var(--violet-bright)', marginTop: 6 }}>
                  ⚔ Lvl {player.level} · {player.title} · Diamond III
                </div>
                <div style={{ marginTop: 14, display:'flex', alignItems:'center', gap: 10 }}>
                  <XPBar value={player.xp} max={player.xpMax} height={16} color="violet" />
                  <span className="f-hud" style={{ color:'var(--gold)', fontSize: 14, whiteSpace:'nowrap' }}>{player.xp}/{player.xpMax}</span>
                </div>
                <div style={{ display:'flex', gap: 8, marginTop: 14, flexWrap:'wrap' }}>
                  <Pill tone="orange" icon={<Fire size={14} />}>{player.streak} Day Streak</Pill>
                  <Pill tone="gold" icon={<Coin size={14} />}>{player.coins.toLocaleString()} Coins</Pill>
                  <Pill tone="violet" icon="🏆">Rank #3 in School</Pill>
                  <Pill tone="cyan">⚔ 12W · 3L</Pill>
                </div>
              </div>
              {/* CTA cluster */}
              <div style={{ display:'flex', flexDirection:'column', gap: 8, alignSelf:'stretch', justifyContent:'center' }}>
                <button className="btn btn-primary" onClick={(e)=>handleClick(e,'+25 XP')}>▶ Resume Quest</button>
                <button className="btn btn-cyan" onClick={(e)=>handleClick(e,'+10 XP')}>⚡ Quick Battle</button>
              </div>
            </div>
          </div>
        </div>

        {/* DAILY QUESTS strip */}
        <div>
          <SectionTitle icon="⚔️" title="Today's Quests" action={
            <button className="btn btn-ghost btn-sm" onClick={(e)=>handleClick(e,'See all')}>View all →</button>
          }/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap: 12 }}>
            <QuestCard tag="daily" title="Slay 5 Math Mobs" desc="Defeat 5 math problems on any difficulty" reward={50} value={3} max={5} />
            <QuestCard tag="daily" title="Win a Quiz Battle" desc="Beat any opponent in PvP" reward={75} value={0} max={1} />
            <QuestCard tag="daily" title="Train for 15 min" desc="Study any subject" reward={30} value={15} max={15} complete />
            <QuestCard tag="weekly" title="Master Algebra Ch.4" desc="Complete all lessons in chapter 4" reward={500} value={2} max={10} timeLeft="3d 12h" />
          </div>
        </div>

        {/* ASSIGNED + CONTINUE row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
          <div>
            <SectionTitle icon="📜" title="From your Mentor" />
            <div className="card card-pad" style={{ borderLeft:'4px solid var(--gold)' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
                <div className="pframe gold" style={{ width: 36, height: 36 }}>
                  <div style={{ fontSize: 16 }}>🧙</div>
                </div>
                <div>
                  <div className="f-display" style={{ fontSize: 14 }}>Ms. Reyes</div>
                  <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)' }}>Algebra · Period 4</div>
                </div>
              </div>
              <div className="f-display" style={{ fontSize: 18, marginBottom: 4 }}>Quadratic Quests</div>
              <div style={{ fontSize: 13, color:'var(--ink-2)', marginBottom: 10 }}>Solve 8 quadratic equations to unlock the boss fight.</div>
              <div style={{ display:'flex', gap: 6, marginBottom: 12, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--f-hud)', fontSize:9, padding:'2px 6px', border:'1.5px solid var(--s-math)', color:'var(--s-math)', borderRadius: 4 }}>ALGEBRA</span>
                <span style={{ fontFamily:'var(--f-hud)', fontSize:9, padding:'2px 6px', border:'1.5px solid var(--gold)', color:'var(--gold)', borderRadius: 4 }}>+200 XP</span>
                <span style={{ fontFamily:'var(--f-hud)', fontSize:9, padding:'2px 6px', border:'1.5px solid var(--hot)', color:'var(--hot)', borderRadius: 4 }}>DUE FRI</span>
              </div>
              <button className="btn btn-primary btn-block" onClick={(e)=>handleClick(e,'+25 XP')}>Play Now</button>
            </div>
          </div>
          <div>
            <SectionTitle icon="▶️" title="Continue Playing" />
            <div className="card card-pad" style={{ display:'flex', flexDirection:'column', gap: 10 }}>
              {[
                { name:'Number Knights', subj:'math', emoji:'🔢', xp: 340, xpMax: 500, color:'var(--s-math)' },
                { name:'Photon Forge', subj:'science', emoji:'⚗️', xp: 120, xpMax: 400, color:'var(--s-science)' },
                { name:'Word Warriors', subj:'english', emoji:'📖', xp: 80, xpMax: 200, color:'var(--s-english)' },
              ].map(g => (
                <div key={g.name} style={{
                  display:'flex', alignItems:'center', gap: 12,
                  padding: 10, borderRadius: 10,
                  background:'var(--bg-elev-2)',
                  borderLeft: `4px solid ${g.color}`,
                }}>
                  <div style={{ fontSize: 24, width: 40, height: 40, display:'grid', placeItems:'center', background:'#000', borderRadius: 8 }}>{g.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="f-display" style={{ fontSize: 14 }}>{g.name}</div>
                    <XPBar value={g.xp} max={g.xpMax} height={6} color="cyan" />
                  </div>
                  <button className="f-hud" style={{ color:'var(--cyan)', fontSize: 12 }} onClick={(e)=>handleClick(e,'+5 XP')}>CONTINUE →</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SKILL MAP */}
        <div>
          <SectionTitle icon="🧠" title="Your Skill Map" />
          <div className="card card-pad" style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap: 24, alignItems:'center' }}>
            <SkillRadar />
            <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
              {[
                { s:'math', label:'Mathematics', emoji:'🔢', val: 78, color:'var(--s-math)' },
                { s:'science', label:'Science', emoji:'⚗️', val: 65, color:'var(--s-science)' },
                { s:'english', label:'English', emoji:'📖', val: 82, color:'var(--s-english)' },
                { s:'history', label:'History', emoji:'🏛', val: 41, color:'var(--s-history)' },
                { s:'geo', label:'Geography', emoji:'🗺', val: 58, color:'var(--s-geo)' },
                { s:'coding', label:'Coding', emoji:'💻', val: 92, color:'var(--s-coding)' },
              ].map(b => (
                <div key={b.s}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 4 }}>
                    <span className="f-hud" style={{ fontSize: 11, color:'var(--ink-2)' }}>{b.emoji} {b.label}</span>
                    <span className="f-hud" style={{ fontSize: 11, color:'var(--gold)' }}>{b.val}%</span>
                  </div>
                  <div className="xp-bar" style={{ height: 10 }}>
                    <i style={{ width: b.val + '%', background: b.color, boxShadow:`inset 0 -3px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3), 0 0 12px ${b.color}88` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
        {/* MINI LEADERBOARD */}
        <div className="card card-pad">
          <SectionTitle icon="🏆" title="School Ladder" action={
            <span className="f-hud" style={{ fontSize: 10, color:'var(--ink-3)' }}>WEEK 17</span>
          }/>
          <div>
            <LBRow rank={1} name="Aiden K." sprite="wizard" tone="violet" xp={4820} total={5000} badges={42} />
            <LBRow rank={2} name="Maya P." sprite="archer" tone="silver" xp={4310} total={5000} badges={38} />
            <LBRow rank={3} you name={player.name} sprite="knight" tone="violet" xp={player.xp + 2400} total={5000} badges={29} />
            <LBRow rank={4} name="Liam J." sprite="rogue" tone="bronze" xp={2980} total={5000} badges={22} />
            <LBRow rank={5} name="Sara C." sprite="bard" tone="violet" xp={2640} total={5000} badges={19} />
          </div>
          <div className="f-hud" style={{ fontSize: 10, color:'var(--green)', textAlign:'center', marginTop: 6, padding: 8, background:'rgba(45,212,110,0.1)', borderRadius: 8, border:'1.5px solid var(--green)' }}>
            🔥 +500 XP TO PROMOTE TO MASTER LEAGUE
          </div>
        </div>

        {/* DAILY CHEST */}
        <div className="card card-pad" style={{ borderColor:'var(--gold)', textAlign:'center' }}>
          <SectionTitle icon="🎁" title="Daily Chest" />
          <div style={{ position:'relative', height: 100, display:'grid', placeItems:'center', marginBottom: 12 }}>
            <div style={{ fontSize: 64, filter:'drop-shadow(0 0 16px var(--gold))' }} className="pulse-glow">📦</div>
          </div>
          <div className="f-hud" style={{ fontSize: 11, color:'var(--ink-3)', marginBottom: 4 }}>UNLOCKS IN</div>
          <div className="f-display" style={{ fontSize: 24, color:'var(--gold)', marginBottom: 12 }}>02:14:38</div>
          <button className="btn btn-gold btn-block btn-sm" onClick={(e)=>handleClick(e,'+100 XP')}>Open Chest</button>
        </div>

        {/* ACHIEVEMENTS */}
        <div className="card card-pad">
          <SectionTitle icon="🏅" title="Recent Achievements" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 8 }}>
            {[
              { e:'🔥', l:'Hot Streak', c:'var(--orange)' },
              { e:'🎯', l:'Sharp Shot', c:'var(--cyan)' },
              { e:'⚔️', l:'First Blood', c:'var(--hot)' },
              { e:'🧠', l:'Big Brain', c:'var(--violet)' },
              { e:'⚡', l:'Lightning', c:'var(--gold)' },
              { e:'🛡', l:'Defender', c:'var(--green)' },
            ].map((a,i) => (
              <div key={i} style={{
                aspectRatio: '1', display:'grid', placeItems:'center',
                background:'var(--bg-elev-2)', borderRadius: 12,
                border: `2px solid ${a.c}`, position:'relative',
                boxShadow: `0 0 12px -2px ${a.c}88`,
              }}>
                <div style={{ fontSize: 26 }}>{a.e}</div>
                <div className="f-hud" style={{ position:'absolute', bottom: 4, fontSize: 8, color:'var(--ink-3)' }}>{a.l.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillRadar() {
  // hexagonal radar
  const subjects = [
    { l:'MATH', v: 78, c:'var(--s-math)' },
    { l:'SCI', v: 65, c:'var(--s-science)' },
    { l:'ENG', v: 82, c:'var(--s-english)' },
    { l:'HIST', v: 41, c:'var(--s-history)' },
    { l:'GEO', v: 58, c:'var(--s-geo)' },
    { l:'CODE', v: 92, c:'var(--s-coding)' },
  ];
  const cx = 110, cy = 110, R = 88;
  const pts = subjects.map((s,i) => {
    const a = (Math.PI*2 * i / subjects.length) - Math.PI/2;
    const r = R * (s.v/100);
    return { x: cx + Math.cos(a)*r, y: cy + Math.sin(a)*r,
             lx: cx + Math.cos(a)*(R+18), ly: cy + Math.sin(a)*(R+18),
             rx: cx + Math.cos(a)*R, ry: cy + Math.sin(a)*R, ...s };
  });
  return (
    <svg viewBox="0 0 220 220" style={{ width: 220, height: 220 }}>
      {[0.25,0.5,0.75,1].map((k,i)=>(
        <polygon key={i}
          points={Array.from({length:6}, (_,j)=>{
            const a = (Math.PI*2 * j / 6) - Math.PI/2;
            return `${cx+Math.cos(a)*R*k},${cy+Math.sin(a)*R*k}`;
          }).join(' ')}
          fill="none" stroke={i===3?'#444':'#222'} strokeWidth="1" />
      ))}
      {pts.map((p,i)=>(
        <line key={i} x1={cx} y1={cy} x2={p.rx} y2={p.ry} stroke="#222" strokeWidth="1" />
      ))}
      <polygon
        points={pts.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(107,75,255,0.3)" stroke="var(--violet-bright)" strokeWidth="2" />
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={p.c} stroke="#000" strokeWidth="1.5" />
          <text x={p.lx} y={p.ly} fill="var(--ink-2)" fontSize="9"
            fontFamily="Oswald" fontWeight="700" textAnchor="middle" dominantBaseline="middle"
            letterSpacing="0.08em">{p.l}</text>
        </g>
      ))}
    </svg>
  );
}

Object.assign(window, { HomePage, SkillRadar });
