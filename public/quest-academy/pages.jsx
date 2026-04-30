/* eslint-disable */
// Quest Academy — remaining pages: Games, Quests, Battle, Leaderboard, Shop, Subjects

// ============================================================
// GAMES PAGE
// ============================================================
function GamesPage({ fireXP }) {
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { k:'all', l:'All' }, { k:'math', l:'Math' }, { k:'science', l:'Science' },
    { k:'english', l:'English' }, { k:'history', l:'History' }, { k:'pvp', l:'PvP' }, { k:'solo', l:'Solo' }
  ];
  const games = [
    { name:'Number Knights', subj:'math', icon:'🔢', xp: 340, xpMax: 500, players: 8420, rarity:'rare', tags:['ALGEBRA','PVP']},
    { name:'Photon Forge', subj:'science', icon:'⚗️', xp: 120, xpMax: 400, players: 3210, rarity:'epic', tags:['CHEM','LABS']},
    { name:'Word Warriors', subj:'english', icon:'📖', xp: 80, xpMax: 200, players: 2110, rarity:'common', tags:['VOCAB']},
    { name:'Time Raiders', subj:'history', icon:'🏛', xp: 0, xpMax: 600, players: 1840, rarity:'legend', tags:['HISTORY','BOSS']},
    { name:'Geo Conquest', subj:'geo', icon:'🗺', xp: 0, xpMax: 400, players: 980, rarity:'rare', tags:['MAPS']},
    { name:'Code Crusaders', subj:'coding', icon:'💻', xp: 230, xpMax: 800, players: 5210, rarity:'epic', tags:['PYTHON','PVP']},
    { name:'Atomic Arena', subj:'science', icon:'⚛️', xp: 0, xpMax: 500, players: 712, rarity:'common', tags:['PHYSICS'], locked: true, level: 12 },
    { name:'Grammar Gladiators', subj:'english', icon:'⚔️', xp: 0, xpMax: 300, players: 1120, rarity:'rare', tags:['GRAMMAR'] },
  ];
  return (
    <div className="page-in" style={{ padding: 24, maxWidth: 1320, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 18 }}>
        <div>
          <h1 className="h1">GAME VAULT</h1>
          <div style={{ color:'var(--ink-2)', marginTop: 6 }}>Choose your battlefield, warrior.</div>
        </div>
        <div style={{ display:'flex', gap: 10 }}>
          <input placeholder="🔍 Search games..." style={{
            background:'var(--bg-elev-1)', border:'2px solid var(--line)',
            color:'var(--ink-1)', padding:'10px 14px', borderRadius: 10,
            fontFamily:'var(--f-body)', fontSize: 14, width: 240,
          }} />
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ display:'flex', gap: 8, marginBottom: 18, flexWrap:'wrap' }}>
        {filters.map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            fontFamily:'var(--f-hud)', fontWeight:700, fontSize: 11, letterSpacing:'0.1em',
            padding:'8px 16px', borderRadius: 999,
            background: filter===f.k ? 'var(--violet)' : 'var(--bg-elev-1)',
            border: filter===f.k ? '1.5px solid var(--violet-bright)' : '1.5px solid var(--line)',
            color: filter===f.k ? '#fff' : 'var(--ink-2)',
            boxShadow: filter===f.k ? '0 3px 0 var(--violet-deep)' : 'none',
            textTransform:'uppercase',
          }}>{f.l}</button>
        ))}
      </div>

      {/* FEATURED */}
      <div className="card r-legend" style={{ overflow:'hidden', marginBottom: 24, position:'relative' }}>
        <div style={{
          padding: 28, display:'grid', gridTemplateColumns:'1.5fr 1fr', gap: 24,
          background:'linear-gradient(135deg, #2a1500 0%, #0e0a02 100%)',
          position:'relative',
        }}>
          {/* sparkles */}
          {[...Array(15)].map((_,i)=>(
            <div key={i} style={{
              position:'absolute', left:`${(i*47)%100}%`, top:`${(i*29)%100}%`,
              width: 3, height: 3, background:'var(--gold)', borderRadius:'50%',
              boxShadow:'0 0 6px var(--gold)',
              animation: `pulseGlow ${1+(i%4)*0.4}s ease-in-out infinite`,
            }} />
          ))}
          <div>
            <div style={{ display:'flex', gap: 8, marginBottom: 12 }}>
              <span className="pill pill-gold">⭐ FEATURED</span>
              <span className="pill pill-hot">HOT</span>
            </div>
            <h1 className="h1" style={{ fontSize: 48 }}>TIME RAIDERS</h1>
            <div style={{ color:'var(--ink-2)', marginTop: 8, fontSize: 16, maxWidth: 460 }}>
              Battle through the eras. Defeat history bosses. Claim the throne of Diamond League.
            </div>
            <div style={{ display:'flex', gap: 6, marginTop: 14, flexWrap:'wrap' }}>
              {['HISTORY','BOSS','LEGENDARY','PVP'].map(t => (
                <span key={t} style={{
                  fontFamily:'var(--f-hud)', fontSize: 10, fontWeight:700,
                  padding:'4px 10px', border:'1.5px solid var(--gold)', color:'var(--gold)',
                  borderRadius: 4,
                }}>{t}</span>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginTop: 18 }}>
              <span className="f-hud" style={{ color:'var(--gold)', fontSize: 16 }}>★★★★★ 4.9</span>
              <span className="f-hud" style={{ color:'var(--ink-3)', fontSize: 12 }}>· 18,420 PLAYING NOW</span>
            </div>
            <div style={{ display:'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary">▶ PLAY SOLO</button>
              <button className="btn btn-cyan">⚔ FIND OPPONENT</button>
            </div>
          </div>
          <div style={{ display:'grid', placeItems:'center' }}>
            <div style={{ fontSize: 160, filter:'drop-shadow(0 8px 0 #000) drop-shadow(0 0 40px var(--gold))' }}>🏛</div>
          </div>
        </div>
      </div>

      <SectionTitle icon="🎮" title="All Games" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14 }}>
        {games.map(g => <GameCard key={g.name} {...g} subject={g.subj} />)}
      </div>
    </div>
  );
}

// ============================================================
// QUESTS PAGE
// ============================================================
function QuestsPage() {
  const [tab, setTab] = React.useState('daily');
  const tabs = [
    { k:'daily', l:'Daily', n: 4 },
    { k:'weekly', l:'Weekly', n: 2 },
    { k:'special', l:'Event', n: 1 },
    { k:'completed', l:'Completed', n: 12 },
  ];
  return (
    <div className="page-in" style={{ padding: 24, maxWidth: 1100, margin:'0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="h1">⚔ ACTIVE QUESTS</h1>
        <div style={{ color:'var(--ink-2)', marginTop: 6 }}>Complete quests, earn XP, claim glory.</div>
      </div>

      <div style={{ display:'flex', gap: 4, marginBottom: 18, borderBottom:'2px solid var(--line)' }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            fontFamily:'var(--f-hud)', fontWeight:700, fontSize: 12, letterSpacing:'0.1em',
            padding:'10px 18px', textTransform:'uppercase',
            color: tab===t.k ? 'var(--cyan)' : 'var(--ink-3)',
            borderBottom: tab===t.k ? '2px solid var(--cyan)' : '2px solid transparent',
            marginBottom: -2,
            display:'flex', alignItems:'center', gap: 6,
          }}>{t.l} <span style={{ background: tab===t.k?'var(--cyan)':'var(--bg-elev-2)', color: tab===t.k?'#000':'var(--ink-3)', borderRadius:999, padding:'1px 8px', fontSize: 10 }}>{t.n}</span></button>
        ))}
      </div>

      {/* EVENT BANNER */}
      <div className="card r-legend" style={{ overflow:'hidden', marginBottom: 24 }}>
        <div style={{ padding: 22, display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 20, alignItems:'center', background:'linear-gradient(135deg,#2a1500,#0e0a02)' }}>
          <div style={{ fontSize: 64, filter:'drop-shadow(0 4px 0 #000)' }}>🏰</div>
          <div>
            <span className="pill pill-gold">⏱ ENDS IN 2D 14H</span>
            <div className="f-display" style={{ fontSize: 26, marginTop: 8 }}>BACK TO SCHOOL CHALLENGE</div>
            <div style={{ color:'var(--ink-2)', marginTop: 4 }}>Complete 30 quests this week. Claim the Legendary Backpack skin.</div>
            <div style={{ marginTop: 10 }}>
              <XPBar value={12} max={30} height={12} color="gold" textRight="12 / 30 quests" showText />
            </div>
          </div>
          <button className="btn btn-gold">VIEW REWARDS</button>
        </div>
      </div>

      <SectionTitle icon="📅" title="Daily Quests" action={<span className="f-hud" style={{ fontSize: 11, color:'var(--ink-3)' }}>RESETS IN 06:14:22</span>} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginBottom: 24 }}>
        <QuestCard tag="daily" title="Slay 5 Math Mobs" desc="Defeat 5 math problems on any difficulty" reward={50} value={3} max={5} />
        <QuestCard tag="daily" title="Win a Quiz Battle" desc="Beat any opponent in PvP" reward={75} value={0} max={1} />
        <QuestCard tag="daily" title="Train for 15 minutes" desc="Study any subject" reward={30} value={15} max={15} complete />
        <QuestCard tag="daily" title="Perfect Round" desc="Get 10/10 on a quiz" reward={100} value={0} max={1} />
      </div>

      <SectionTitle icon="🗓" title="Weekly Challenges" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, marginBottom: 24 }}>
        <QuestCard tag="weekly" title="Master Algebra Ch.4" desc="Complete all lessons in chapter 4" reward={500} value={2} max={10} timeLeft="3d 12h" />
        <QuestCard tag="weekly" title="Win 5 Battles" desc="Beat 5 opponents this week" reward={300} value={2} max={5} timeLeft="3d 12h" />
      </div>

      <SectionTitle icon="👹" title="Boss Hunt" />
      <div className="card card-pad" style={{ borderLeft:'4px solid var(--hot)', display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 18, alignItems:'center' }}>
        <div style={{ fontSize: 64, filter:'drop-shadow(0 0 20px var(--hot))' }}>🐉</div>
        <div>
          <span className="pill pill-hot">BOSS</span>
          <div className="f-display" style={{ fontSize: 22, marginTop: 8 }}>The Quadratic Hydra</div>
          <div style={{ color:'var(--ink-2)', marginTop: 4, fontSize: 13 }}>Solve 25 quadratic equations to slay this beast. Drops Legendary loot.</div>
          <div style={{ marginTop: 10, maxWidth: 400 }}>
            <StatBar value={1200} max={2500} color="hot" label="HYDRA HP" />
          </div>
        </div>
        <button className="btn btn-hot">ATTACK</button>
      </div>
    </div>
  );
}

// ============================================================
// BATTLE PAGE
// ============================================================
function BattlePage() {
  const [searching, setSearching] = React.useState(false);
  return (
    <div className="page-in" style={{ padding: 24, maxWidth: 1200, margin:'0 auto' }}>
      <div style={{ textAlign:'center', marginBottom: 24 }}>
        <h1 className="h1">⚡ BATTLE ARENA</h1>
        <div style={{ color:'var(--ink-2)', marginTop: 6 }}>Challenge classmates. Prove your knowledge.</div>
      </div>

      {/* VS LAYOUT */}
      <div className="card" style={{ overflow:'hidden', marginBottom: 24, borderColor:'var(--hot)' }}>
        <div className="arena-bg" style={{ padding: '32px 40px', position:'relative' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap: 24, alignItems:'center' }}>
            {/* YOU */}
            <BattleSide side="you" sprite="knight" tone="violet" name="You" rank="Diamond III" power={2840} />

            {/* VS */}
            <div style={{ textAlign:'center', position:'relative' }}>
              <div className="f-display" style={{
                fontSize: 80, color:'var(--hot)',
                textShadow:'0 4px 0 #000, 0 0 30px var(--hot)',
                lineHeight: 1,
              }}>VS</div>
              <button onClick={() => setSearching(s => !s)} className={searching ? 'btn btn-hot' : 'btn btn-cyan'} style={{ marginTop: 16, fontSize: 18, padding:'18px 32px' }}>
                {searching ? '✖ CANCEL' : '⚔ FIND OPPONENT'}
              </button>
              {searching && <div className="f-hud pulse-glow" style={{ color:'var(--cyan)', fontSize: 11, marginTop: 8 }}>● SEARCHING ARENA...</div>}
            </div>

            {/* OPPONENT */}
            {searching ? (
              <BattleSide side="opp" searching />
            ) : (
              <BattleSide side="opp" sprite="wizard" tone="cyan" name="Aiden K." rank="Diamond II" power={3120} />
            )}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20 }}>
        {/* SUBJECT SELECT */}
        <div className="card card-pad">
          <SectionTitle icon="📚" title="Battle Subject" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 8 }}>
            {[
              { s:'math', l:'Math', i:'🔢', c:'var(--s-math)', sel:true },
              { s:'science', l:'Science', i:'⚗️', c:'var(--s-science)' },
              { s:'english', l:'English', i:'📖', c:'var(--s-english)' },
              { s:'history', l:'History', i:'🏛', c:'var(--s-history)' },
              { s:'geo', l:'Geo', i:'🗺', c:'var(--s-geo)' },
              { s:'coding', l:'Code', i:'💻', c:'var(--s-coding)' },
            ].map(s => (
              <button key={s.s} style={{
                padding:'14px 8px', borderRadius: 10,
                background: s.sel ? `${s.c}22` : 'var(--bg-elev-2)',
                border: s.sel ? `2px solid ${s.c}` : '2px solid var(--line)',
                color: s.sel ? s.c : 'var(--ink-2)',
                boxShadow: s.sel ? `0 0 12px -2px ${s.c}` : 'none',
                fontFamily:'var(--f-hud)', fontSize: 11, letterSpacing:'0.08em',
              }}>
                <div style={{ fontSize: 24 }}>{s.i}</div>
                <div style={{ marginTop: 4 }}>{s.l.toUpperCase()}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop:'1.5px solid var(--line)' }}>
            <div className="f-hud" style={{ fontSize: 11, color:'var(--ink-3)', marginBottom: 6 }}>BET</div>
            <div style={{ display:'flex', gap: 8 }}>
              {[10, 25, 50, 100].map(v => (
                <button key={v} className={v===25?'btn btn-gold btn-sm':'btn btn-ghost btn-sm'} style={{ flex: 1 }}>
                  <Coin size={14} />{v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT BATTLES */}
        <div className="card card-pad">
          <SectionTitle icon="📜" title="Battle Log" />
          {[
            { opp:'Maya P.', subj:'Math', win:true, xp: 45 },
            { opp:'Liam J.', subj:'Science', win:false, xp: -20 },
            { opp:'Sara C.', subj:'English', win:true, xp: 60 },
            { opp:'Noah W.', subj:'Math', win:true, xp: 35 },
            { opp:'Ivy R.', subj:'Coding', win:false, xp: -15 },
          ].map((b,i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap: 10,
              padding:'10px 4px', borderBottom:'1px solid var(--line)', alignItems:'center',
              borderLeft: `3px solid ${b.win?'var(--green)':'var(--hot)'}`,
              paddingLeft: 12, marginBottom: 4, background:'var(--bg-elev-2)', borderRadius: 6,
            }}>
              <span style={{ fontSize: 18 }}>{b.win?'🏆':'💀'}</span>
              <div>
                <div className="f-display" style={{ fontSize: 13 }}>vs {b.opp}</div>
                <div className="f-hud" style={{ fontSize: 9, color:'var(--ink-3)' }}>{b.subj.toUpperCase()}</div>
              </div>
              <span className="f-hud" style={{ fontSize: 11, color: b.win?'var(--green)':'var(--hot)' }}>{b.win?'WIN':'LOSS'}</span>
              <span className="f-hud" style={{ fontSize: 12, color: b.xp>0?'var(--gold)':'var(--ink-3)' }}>{b.xp>0?'+':''}{b.xp} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function BattleSide({ side, sprite, tone, name, rank, power, searching }) {
  return (
    <div style={{ textAlign: side==='you'?'right':'left', display:'flex', alignItems:'center', gap: 16, justifyContent: side==='you'?'flex-end':'flex-start' }}>
      {side==='you' && (
        <div>
          <div className="f-hud" style={{ fontSize: 11, color:'var(--violet-bright)' }}>YOU</div>
          <div className="f-display" style={{ fontSize: 24 }}>{name}</div>
          <div className="f-hud" style={{ fontSize: 11, color:'var(--ink-3)' }}>{rank}</div>
          <div className="f-hud" style={{ fontSize: 18, color:'var(--gold)', marginTop: 4 }}>⚡ {power}</div>
        </div>
      )}
      {searching ? (
        <div className="pframe" style={{ width: 120, height: 120 }}>
          <div className="f-display pulse-glow" style={{ fontSize: 48, color:'var(--ink-3)' }}>?</div>
        </div>
      ) : (
        <Avatar sprite={sprite} tone={tone} size={120} />
      )}
      {side==='opp' && !searching && (
        <div>
          <div className="f-hud" style={{ fontSize: 11, color:'var(--cyan)' }}>OPPONENT</div>
          <div className="f-display" style={{ fontSize: 24 }}>{name}</div>
          <div className="f-hud" style={{ fontSize: 11, color:'var(--ink-3)' }}>{rank}</div>
          <div className="f-hud" style={{ fontSize: 18, color:'var(--gold)', marginTop: 4 }}>⚡ {power}</div>
        </div>
      )}
      {side==='opp' && searching && (
        <div>
          <div className="f-hud pulse-glow" style={{ fontSize: 11, color:'var(--cyan)' }}>SEARCHING...</div>
          <div className="f-display" style={{ fontSize: 24, color:'var(--ink-3)' }}>?????</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// LEADERBOARD PAGE
// ============================================================
function LeaderboardPage({ player }) {
  const [league, setLeague] = React.useState('diamond');
  const leagues = [
    { k:'bronze', l:'Bronze', c:'var(--bronze)' },
    { k:'silver', l:'Silver', c:'var(--silver)' },
    { k:'gold', l:'Gold', c:'var(--gold)' },
    { k:'diamond', l:'Diamond', c:'var(--cyan)', current:true },
    { k:'master', l:'Master', c:'var(--violet)' },
  ];
  const data = [
    { name:'Aiden K.', sprite:'wizard', xp: 4820, badges: 42 },
    { name:'Maya P.', sprite:'archer', xp: 4310, badges: 38 },
    { name: player.name, sprite:'knight', xp: 3640, badges: 29, you: true },
    { name:'Liam J.', sprite:'rogue', xp: 2980, badges: 22 },
    { name:'Sara C.', sprite:'bard', xp: 2640, badges: 19 },
    { name:'Noah W.', sprite:'wizard', xp: 2410, badges: 17 },
    { name:'Ivy R.', sprite:'archer', xp: 2120, badges: 14 },
    { name:'Kai T.', sprite:'rogue', xp: 1840, badges: 12 },
    { name:'Zoe M.', sprite:'bard', xp: 1620, badges: 10 },
    { name:'Eli P.', sprite:'knight', xp: 1410, badges: 8 },
  ];
  return (
    <div className="page-in" style={{ padding: 24, maxWidth: 1100, margin:'0 auto' }}>
      <h1 className="h1" style={{ marginBottom: 6 }}>🏆 LEADERBOARD</h1>
      <div style={{ color:'var(--ink-2)', marginBottom: 20 }}>Climb the ranks. Promote to Master.</div>

      {/* LEAGUE SELECTOR */}
      <div style={{ display:'flex', gap: 6, marginBottom: 18, flexWrap:'wrap' }}>
        {leagues.map(L => (
          <button key={L.k} onClick={()=>setLeague(L.k)} style={{
            fontFamily:'var(--f-hud)', fontSize: 11, letterSpacing:'0.1em',
            padding:'8px 16px', borderRadius: 8,
            background: league===L.k ? `${L.c}22` : 'var(--bg-elev-1)',
            border: league===L.k ? `2px solid ${L.c}` : '2px solid var(--line)',
            color: league===L.k ? L.c : 'var(--ink-2)',
            boxShadow: league===L.k ? `0 0 12px -2px ${L.c}` : 'none',
            display:'flex', alignItems:'center', gap: 6,
          }}>
            {L.l.toUpperCase()}{L.current && <span style={{ fontSize: 9, color:'var(--gold)' }}>★</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display:'flex', gap: 6 }}>
          {['Week','Month','All'].map((t,i)=>(
            <button key={t} className="btn btn-ghost btn-sm" style={ i===0 ? { borderColor:'var(--cyan)', color:'var(--cyan)' } : {}}>{t}</button>
          ))}
        </div>
      </div>

      {/* PODIUM */}
      <div className="card card-pad" style={{ marginBottom: 18, paddingBottom: 0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12, alignItems:'flex-end', height: 280 }}>
          {/* #2 */}
          <PodiumCol rank={2} name={data[1].name} sprite={data[1].sprite} xp={data[1].xp} height={140} color="var(--silver)" emoji="🥈" />
          {/* #1 */}
          <PodiumCol rank={1} name={data[0].name} sprite={data[0].sprite} xp={data[0].xp} height={200} color="var(--gold)" emoji="🥇" crown />
          {/* #3 */}
          <PodiumCol rank={3} name={data[2].name} sprite={data[2].sprite} xp={data[2].xp} height={100} color="var(--violet-bright)" emoji="🥉" you={data[2].you} />
        </div>
      </div>

      <div className="card card-pad">
        <SectionTitle icon="📜" title={`Diamond III · Top ${data.length}`} action={
          <span className="f-hud" style={{ fontSize: 10, color:'var(--green)' }}>● SEASON 4 · ENDS 5D</span>
        }/>
        {data.map((p,i) => (
          <LBRow key={i} rank={i+1} you={p.you} sprite={p.sprite} name={p.name} xp={p.xp} total={data[0].xp} badges={p.badges} />
        ))}
      </div>

      <div className="f-hud" style={{
        marginTop: 16, fontSize: 12, padding: 14,
        background:'rgba(45,212,110,0.12)', color:'var(--green)',
        border:'2px solid var(--green)', borderRadius: 12, textAlign:'center',
      }}>
        🔥 PROMOTION ZONE · CLIMB 2 RANKS THIS WEEK TO REACH MASTER LEAGUE
      </div>
    </div>
  );
}
function PodiumCol({ rank, name, sprite, xp, height, color, emoji, crown, you }) {
  return (
    <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
      {crown && <div style={{ fontSize: 30, lineHeight: 1, marginBottom: 4 }}>👑</div>}
      <Avatar sprite={sprite} tone={rank===1?'gold':rank===2?'silver':'bronze'} size={64} />
      <div className="f-display" style={{ fontSize: 14, marginTop: 6 }}>{name}</div>
      <div className="f-hud" style={{ fontSize: 13, color }}>{xp.toLocaleString()} XP</div>
      <div style={{
        marginTop: 8, height, width: '100%',
        background: `linear-gradient(180deg, ${color}, ${color}88 50%, transparent 100%)`,
        borderTop: `3px solid ${color}`,
        clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
        position:'relative',
        display:'grid', placeItems:'center',
      }}>
        <div className="f-display" style={{ fontSize: 56, color:'#000', textShadow:`0 0 20px ${color}`, opacity: 0.4 }}>#{rank}</div>
        <div style={{ position:'absolute', top: 8, fontSize: 28 }}>{emoji}</div>
        {you && <div className="f-hud" style={{ position:'absolute', bottom: 8, fontSize: 10, color:'#fff', background:'var(--violet)', padding:'2px 8px', borderRadius: 4 }}>YOU</div>}
      </div>
    </div>
  );
}

// ============================================================
// SHOP PAGE
// ============================================================
function ShopPage({ player }) {
  const [tab, setTab] = React.useState('avatars');
  const tabs = [
    { k:'avatars', l:'Avatars' }, { k:'powerups', l:'Power-Ups' },
    { k:'freeze', l:'Streak Freeze' }, { k:'themes', l:'Themes' }
  ];
  const items = {
    avatars: [
      { name:'Frost Knight', icon:'🛡', price: 500, rarity:'rare' },
      { name:'Shadow Mage', icon:'🧙', price: 1200, rarity:'epic' },
      { name:'Dragon Slayer', icon:'🐲', price: 3000, rarity:'legend' },
      { name:'Galaxy Hood', icon:'🌌', price: 800, rarity:'rare' },
      { name:'Pixel Pirate', icon:'🏴‍☠️', price: 600, rarity:'common', owned: true },
      { name:'Phoenix', icon:'🔥', price: 2500, rarity:'legend' },
    ],
    powerups: [
      { name:'XP Booster x2', icon:'⚡', price: 300, rarity:'common' },
      { name:'Hint Pack', icon:'💡', price: 150, rarity:'common' },
      { name:'Time Slow', icon:'⏱', price: 500, rarity:'rare' },
      { name:'Auto Solver', icon:'🤖', price: 1500, rarity:'epic' },
    ],
    freeze: [
      { name:'1 Day Freeze', icon:'❄️', price: 200, rarity:'common' },
      { name:'3 Day Freeze', icon:'🧊', price: 500, rarity:'rare' },
      { name:'7 Day Freeze', icon:'☃️', price: 1000, rarity:'epic' },
    ],
    themes: [
      { name:'Neon Arena', icon:'🌃', price: 1500, rarity:'epic' },
      { name:'Forest Realm', icon:'🌲', price: 1000, rarity:'rare' },
      { name:'Volcano', icon:'🌋', price: 2000, rarity:'epic' },
    ],
  };
  return (
    <div className="page-in" style={{ padding: 24, maxWidth: 1200, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 18 }}>
        <h1 className="h1">🛒 SHOP</h1>
        <div style={{ display:'flex', gap: 10 }}>
          <Pill tone="gold" icon={<Coin size={14} />}>{player.coins.toLocaleString()}</Pill>
          <Pill tone="cyan" icon={<span className="gem" style={{ width:12, height:12 }} />}>87</Pill>
          <button className="btn btn-cyan btn-sm">+ GET MORE</button>
        </div>
      </div>

      {/* FEATURED DEAL */}
      <div className="card r-legend" style={{ overflow:'hidden', marginBottom: 24 }}>
        <div style={{ padding: 22, display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 20, alignItems:'center', background:'linear-gradient(135deg,#3a0a08,#180403)' }}>
          <div style={{ fontSize: 80, filter:'drop-shadow(0 0 20px var(--gold))' }}>🐲</div>
          <div>
            <span className="pill pill-hot">⏱ ENDS IN 14:32:08</span>
            <div className="f-display" style={{ fontSize: 28, marginTop: 8 }}>DRAGON SLAYER BUNDLE</div>
            <div style={{ color:'var(--ink-2)', marginTop: 4 }}>Avatar + Phoenix wings + 1000 XP boost</div>
            <div style={{ display:'flex', alignItems:'center', gap: 12, marginTop: 12 }}>
              <span className="f-hud" style={{ fontSize: 16, color:'var(--ink-3)', textDecoration:'line-through' }}>4500</span>
              <span className="f-hud" style={{ fontSize: 28, color:'var(--gold)' }}><Coin size={20} /> 2999</span>
              <span className="pill pill-hot">-33%</span>
            </div>
          </div>
          <button className="btn btn-gold">CLAIM DEAL</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            fontFamily:'var(--f-hud)', fontSize: 11, letterSpacing:'0.1em', textTransform:'uppercase',
            padding:'10px 16px', borderRadius: 8,
            background: tab===t.k ? 'var(--violet)' : 'var(--bg-elev-1)',
            border: tab===t.k ? '2px solid var(--violet-bright)' : '2px solid var(--line)',
            color: tab===t.k ? '#fff' : 'var(--ink-2)',
            boxShadow: tab===t.k ? '0 3px 0 var(--violet-deep)' : 'none',
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 14 }}>
        {items[tab].map(it => (
          <div key={it.name} className={`card r-${it.rarity}`} style={{ overflow:'hidden' }}>
            <div style={{
              padding: '24px 12px', textAlign:'center',
              background:'var(--bg-elev-2)', borderBottom:'2px solid #000',
              position:'relative', minHeight: 120, display:'grid', placeItems:'center',
            }}>
              <div style={{ fontSize: 64, filter:`drop-shadow(0 4px 0 #000)` }}>{it.icon}</div>
              {it.owned && <div style={{ position:'absolute', top: 8, right: 8 }} className="pill pill-green">✓ OWNED</div>}
              <div style={{ position:'absolute', top: 8, left: 8 }}>
                <span className="f-hud" style={{ fontSize: 9, color: rarityColor(it.rarity), border:`1.5px solid ${rarityColor(it.rarity)}`, padding:'2px 6px', borderRadius: 4, background:'#000' }}>{it.rarity.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ padding: 14, display:'flex', flexDirection:'column', gap: 10 }}>
              <div className="f-display" style={{ fontSize: 16 }}>{it.name}</div>
              {it.owned ? (
                <button className="btn btn-ghost btn-sm btn-block" disabled>EQUIPPED</button>
              ) : (
                <button className="btn btn-gold btn-sm btn-block">
                  <Coin size={14} /> {it.price}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SUBJECTS PAGE
// ============================================================
function SubjectsPage() {
  const subjects = [
    { subject:'math', name:'Mathematics', icon:'🔢', mastery: 78, chapters: 12, lessons: 48 },
    { subject:'science', name:'Science', icon:'⚗️', mastery: 65, chapters: 10, lessons: 40 },
    { subject:'english', name:'English', icon:'📖', mastery: 82, chapters: 14, lessons: 56 },
    { subject:'history', name:'History', icon:'🏛', mastery: 41, chapters: 8, lessons: 32 },
    { subject:'geo', name:'Geography', icon:'🗺', mastery: 58, chapters: 6, lessons: 24 },
    { subject:'coding', name:'Coding', icon:'💻', mastery: 92, chapters: 10, lessons: 50 },
    { subject:'science', name:'Physics Lab', icon:'⚛️', mastery: 0, chapters: 8, lessons: 32, locked: true, levelReq: 12 },
    { subject:'math', name:'Calculus', icon:'∫', mastery: 0, chapters: 12, lessons: 48, locked: true, levelReq: 15 },
    { subject:'history', name:'World Wars', icon:'⚔️', mastery: 0, chapters: 6, lessons: 24, locked: true, levelReq: 10 },
  ];
  return (
    <div className="page-in" style={{ padding: 24, maxWidth: 1200, margin:'0 auto' }}>
      <h1 className="h1">📚 SUBJECTS</h1>
      <div style={{ color:'var(--ink-2)', marginTop: 6, marginBottom: 24 }}>Master a realm. Earn its crown.</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 16 }}>
        {subjects.map(s => <SubjectTile key={s.name} {...s} />)}
      </div>
    </div>
  );
}

Object.assign(window, { GamesPage, QuestsPage, BattlePage, BattleSide, LeaderboardPage, PodiumCol, ShopPage, SubjectsPage });
