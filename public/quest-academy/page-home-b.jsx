/* eslint-disable */
// Quest Academy — Direction B (Edgier neon, sharper, cyan-forward)
// Same content as Home A but a different visual treatment

function HomePageB({ player, fireXP }) {
  const handleClick = (e, label='+25 XP') => {
    if (!fireXP) return;
    const r = e.currentTarget.getBoundingClientRect();
    fireXP({ x: r.left + r.width/2 - 30, y: r.top + 10, label, color:'var(--cyan)' });
  };
  return (
    <div className="page-in" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap: 20, padding: 24, maxWidth: 1320, margin:'0 auto' }}>
      <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>

        {/* HERO — split arena vs energy bar style */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 16 }}>
          <div className="card" style={{ overflow:'hidden', position:'relative', borderColor:'var(--cyan)', boxShadow:'0 0 0 1px var(--cyan), 0 0 30px -10px var(--cyan)' }}>
            <div style={{
              position:'relative', minHeight: 220, padding: '24px 24px',
              background: 'var(--bg-elev-1)',
            }}>
              {/* diagonal stripes */}
              <div style={{
                position:'absolute', inset: 0, opacity: 0.15,
                backgroundImage:'repeating-linear-gradient(135deg, var(--cyan) 0 2px, transparent 2px 24px)',
                maskImage:'linear-gradient(90deg, black, transparent 60%)',
              }} />
              <div style={{ display:'flex', gap: 20, position:'relative', alignItems:'flex-start' }}>
                <Avatar sprite="knight" tone="cyan" size={108} level={player.level} />
                <div style={{ flex: 1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                    <span className="f-hud" style={{ fontSize: 10, color:'var(--cyan)', letterSpacing:'0.2em' }}>● ONLINE</span>
                    <span className="f-hud" style={{ fontSize: 10, color:'var(--ink-3)' }}>· DIAMOND III · #3 SCHOOL</span>
                  </div>
                  <div className="f-display" style={{ fontSize: 36, marginTop: 4, lineHeight: 1 }}>{player.name}</div>
                  <div className="f-hud" style={{ fontSize: 12, color:'var(--ink-2)', marginTop: 6 }}>"{player.title}"</div>

                  {/* angular XP bar with steps */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 4 }}>
                      <span className="f-hud" style={{ fontSize: 10, color:'var(--ink-3)' }}>LVL {player.level} → {player.level+1}</span>
                      <span className="f-hud" style={{ fontSize: 12, color:'var(--cyan)' }}>{player.xp} / {player.xpMax} XP</span>
                    </div>
                    <div style={{ display:'flex', gap: 3, height: 14 }}>
                      {[...Array(20)].map((_,i)=>{
                        const filled = (i+1)/20 <= player.xp/player.xpMax;
                        return <div key={i} style={{
                          flex: 1, background: filled ? 'var(--cyan)' : '#0a0b18',
                          border:'1px solid #000',
                          boxShadow: filled ? `inset 0 -3px 0 var(--cyan-deep), 0 0 6px var(--cyan)` : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                        }} />;
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-cyan" onClick={(e)=>handleClick(e,'+25 XP')}>▶ Resume Quest</button>
                <button className="btn btn-ghost" onClick={(e)=>handleClick(e,'+10 XP')}>⚡ Quick Battle</button>
                <button className="btn btn-ghost">🛡 Defend</button>
              </div>
            </div>
          </div>

          {/* STATS PANEL */}
          <div className="card card-pad" style={{ display:'flex', flexDirection:'column', gap: 14 }}>
            <div className="f-display" style={{ fontSize: 14, color:'var(--ink-3)' }}>STATS</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
              <StatBlock label="Streak" value={player.streak} unit="DAYS" color="var(--orange)" icon={<Fire size={14} />} />
              <StatBlock label="Coins" value={player.coins} unit="GOLD" color="var(--gold)" icon={<Coin size={14} />} />
              <StatBlock label="Gems" value={87} unit="" color="var(--cyan)" icon={<span className="gem" style={{ width:12, height:12 }} />} />
              <StatBlock label="Wins" value={'12-3'} unit="W-L" color="var(--green)" icon="⚔️" />
            </div>
            <div style={{ borderTop:'1.5px solid var(--line)', paddingTop: 10 }}>
              <div className="f-hud" style={{ fontSize: 10, color:'var(--ink-3)', marginBottom: 6 }}>NEXT REWARD AT LVL {player.level+1}</div>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <div style={{ fontSize: 26 }}>🎁</div>
                <div style={{ flex: 1 }}>
                  <div className="f-hud" style={{ fontSize: 11, color:'var(--gold)' }}>+200 COINS · NEW SKIN</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QUESTS row — single feature + small */}
        <div>
          <SectionTitle icon="⚔️" title="Active Quests" action={
            <span className="f-hud" style={{ fontSize: 11, color:'var(--ink-3)' }}>RESETS IN 06:14</span>
          }/>
          <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr 1fr', gap: 12 }}>
            <QuestCard tag="weekly" title="Master Algebra Ch.4" desc="Complete all lessons in chapter 4 and beat the boss" reward={500} value={2} max={10} timeLeft="3d 12h" />
            <QuestCard tag="daily" title="Slay 5 Math Mobs" desc="Defeat 5 problems" reward={50} value={3} max={5} />
            <QuestCard tag="daily" title="Train 15 min" desc="Study any subject" reward={30} value={15} max={15} complete />
          </div>
        </div>

        {/* CONTINUE PLAYING — bigger horizontal cards */}
        <div>
          <SectionTitle icon="▶️" title="Pick up where you left off" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 12 }}>
            {[
              { name:'Number Knights', subj:'math', icon:'🔢', xp: 340, xpMax: 500, players: 8420, rarity:'rare', tags:['ALGEBRA','PVP']},
              { name:'Photon Forge', subj:'science', icon:'⚗️', xp: 120, xpMax: 400, players: 3210, rarity:'epic', tags:['CHEM','LABS'] },
              { name:'Word Warriors', subj:'english', icon:'📖', xp: 80, xpMax: 200, players: 2110, rarity:'common', tags:['VOCAB'] },
            ].map(g => <GameCard key={g.name} {...g} subject={g.subj} />)}
          </div>
        </div>

        {/* SKILL MAP — bar form, no radar (Direction B is more "data-driven HUD") */}
        <div>
          <SectionTitle icon="🧠" title="Skill Mastery" action={
            <span className="f-hud" style={{ fontSize: 11, color:'var(--gold)' }}>OVERALL 69%</span>
          }/>
          <div className="card card-pad">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14 }}>
              {[
                { s:'math', label:'Math', emoji:'🔢', val: 78, color:'var(--s-math)' },
                { s:'science', label:'Science', emoji:'⚗️', val: 65, color:'var(--s-science)' },
                { s:'english', label:'English', emoji:'📖', val: 82, color:'var(--s-english)' },
                { s:'history', label:'History', emoji:'🏛', val: 41, color:'var(--s-history)' },
                { s:'geo', label:'Geo', emoji:'🗺', val: 58, color:'var(--s-geo)' },
                { s:'coding', label:'Code', emoji:'💻', val: 92, color:'var(--s-coding)' },
              ].map(b => (
                <div key={b.s} style={{ background:'var(--bg-elev-2)', borderRadius: 10, padding: 12, borderLeft:`3px solid ${b.color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span className="f-hud" style={{ fontSize: 11 }}>{b.emoji} {b.label}</span>
                    <span className="f-hud" style={{ fontSize: 18, color: b.color }}>{b.val}%</span>
                  </div>
                  <div className="xp-bar" style={{ height: 8, marginTop: 6 }}>
                    <i style={{ width: b.val + '%', background: b.color, boxShadow:`inset 0 -2px 0 rgba(0,0,0,0.3), 0 0 8px ${b.color}99` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
        {/* LIVE BATTLES */}
        <div className="card card-pad" style={{ borderColor:'var(--hot)' }}>
          <SectionTitle icon="🔴" title="Live Battles" action={
            <span className="f-hud" style={{ fontSize: 9, color:'var(--hot)' }}>● 3 ACTIVE</span>
          } />
          <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
            {[
              { a:'Aiden K.', b:'Maya P.', s:'Math', sa: 7, sb: 6 },
              { a:'Liam J.', b:'You?', s:'Science', sa: 0, sb: 0, joinable: true },
              { a:'Sara C.', b:'Noah W.', s:'English', sa: 4, sb: 5 },
            ].map((m,i) => (
              <div key={i} style={{
                background:'var(--bg-elev-2)', borderRadius: 8, padding: 8,
                display:'flex', alignItems:'center', gap: 8,
                border: m.joinable ? '1.5px solid var(--cyan)' : '1.5px solid transparent',
              }}>
                <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)', width: 38 }}>{m.s.toUpperCase()}</div>
                <div className="f-display" style={{ fontSize: 12, flex: 1 }}>{m.a}</div>
                <div className="f-hud" style={{ color:'var(--gold)', fontSize: 14 }}>{m.sa}-{m.sb}</div>
                <div className="f-display" style={{ fontSize: 12, flex: 1, textAlign:'right' }}>{m.b}</div>
                {m.joinable && <button className="btn btn-cyan btn-sm" style={{ fontSize: 9, padding:'4px 8px' }}>JOIN</button>}
              </div>
            ))}
          </div>
        </div>

        {/* MINI LEADERBOARD */}
        <div className="card card-pad">
          <SectionTitle icon="🏆" title="Top of School" />
          <LBRow rank={1} name="Aiden K." sprite="wizard" tone="violet" xp={4820} total={5000} badges={42} />
          <LBRow rank={2} name="Maya P." sprite="archer" tone="silver" xp={4310} total={5000} badges={38} />
          <LBRow rank={3} you name={player.name} sprite="knight" tone="violet" xp={3640} total={5000} badges={29} />
        </div>

        {/* DAILY CHEST */}
        <div className="card card-pad" style={{ borderColor:'var(--gold)', textAlign:'center' }}>
          <SectionTitle icon="🎁" title="Daily Reward" />
          <div style={{ fontSize: 56, filter:'drop-shadow(0 0 16px var(--gold))' }} className="pulse-glow">📦</div>
          <div className="f-hud" style={{ fontSize: 10, color:'var(--ink-3)', marginTop: 4 }}>UNLOCKS IN</div>
          <div className="f-display" style={{ fontSize: 22, color:'var(--gold)' }}>02:14:38</div>
          <button className="btn btn-gold btn-block btn-sm" style={{ marginTop: 10 }} onClick={(e)=>handleClick(e,'+100 XP')}>OPEN CHEST</button>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, unit, color, icon }) {
  return (
    <div style={{ background:'var(--bg-elev-2)', borderRadius: 8, padding: 10, borderTop:`2px solid ${color}` }}>
      <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)', display:'flex', alignItems:'center', gap: 4 }}>
        {icon}{label}
      </div>
      <div className="f-display" style={{ fontSize: 22, color, lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      {unit && <div className="f-hud" style={{ fontSize: 8, color:'var(--ink-3)' }}>{unit}</div>}
    </div>
  );
}

Object.assign(window, { HomePageB, StatBlock });
