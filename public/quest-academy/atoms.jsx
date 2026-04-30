/* eslint-disable */
// Quest Academy — Atoms / shared components
// Globals: React, ReactDOM
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ============================================================
// PIXEL CHARACTER — render a tiny string map into colored cells
// Map legend: ' ' transparent, letters → palette index
// ============================================================
function PixelArt({ map, palette, scale = 4, style }) {
  const rows = map.split('\n').filter(r => r.length > 0);
  const w = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  const cells = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] || ' ';
      if (ch === ' ' || ch === '.') continue;
      const c = palette[ch];
      if (!c) continue;
      cells.push(
        <i key={x + ',' + y} style={{
          position: 'absolute',
          left: x * scale, top: y * scale,
          width: scale, height: scale,
          background: c,
        }} />
      );
    }
  }
  return (
    <div style={{
      position: 'relative',
      width: w * scale, height: h * scale,
      imageRendering: 'pixelated',
      ...style,
    }}>{cells}</div>
  );
}

// ============================================================
// CHARACTERS — a few canned pixel sprites
// ============================================================
const SPRITES = {
  // KNIGHT — purple knight with sword
  knight: {
    map: [
      '   wwwww   ',
      '  wKKKKKw  ',
      '  wKsssKw  ',
      ' wKsffsKw  ',
      ' wKsffsKw  ',
      ' wwsssww   ',
      '  wKKKw    ',
      ' KKKKKKK g ',
      ' KvvvvvK g ',
      ' KvbbbvK g ',
      ' KvbbbvK g ',
      'KKKKKKKKKg ',
      ' bb   bb g ',
      ' bb   bb   ',
      'BBB   BBB  ',
    ].join('\n'),
    palette: { K:'#3A2399', v:'#6B4BFF', b:'#8A6DFF', s:'#F5C9A6', f:'#222', w:'#0a0a14', B:'#222', g:'#C9D2E0' },
  },
  // WIZARD — cyan/violet wizard with pointy hat
  wizard: {
    map: [
      '     v     ',
      '    vvv    ',
      '   vvvvv   ',
      '  vvvvvvv  ',
      '  cccccc   ',
      '  csssc    ',
      '  cffsc    ',
      '   sss     ',
      '  ggvgg    ',
      ' gvvvvvg   ',
      ' gvvvvvg   ',
      '  gvvvg    ',
      '  bb bb    ',
    ].join('\n'),
    palette: { v:'#6B4BFF', c:'#18D6FF', s:'#F5C9A6', f:'#222', g:'#FFC93C', b:'#3A2399' },
  },
  // ARCHER — green hooded
  archer: {
    map: [
      '   ggggg   ',
      '  gggggg   ',
      '  gsssg    ',
      '  gffsg    ',
      '   sss     ',
      '  GGgGG    ',
      ' GgggggG   ',
      ' GgggggG   ',
      '  GgggG    ',
      '  bb bb    ',
    ].join('\n'),
    palette: { g:'#2DD46E', G:'#178541', s:'#F5C9A6', f:'#222', b:'#178541' },
  },
  // ROGUE — red bandit
  rogue: {
    map: [
      '   rrrrr   ',
      '  rrrrrrr  ',
      '  rsssr    ',
      '  rffsr    ',
      '  rrsrr    ',
      '   sss     ',
      '  RRRRR    ',
      ' RrrrrrR   ',
      ' RrrrrrR   ',
      '  RrrrR    ',
      '  bb bb    ',
    ].join('\n'),
    palette: { r:'#FF5A4D', R:'#A8281D', s:'#F5C9A6', f:'#222', b:'#A8281D' },
  },
  // BARD — orange/gold
  bard: {
    map: [
      '    ooo    ',
      '   ooooo   ',
      '   osss    ',
      '   offs    ',
      '    sss    ',
      '  GoooG    ',
      ' GooooooG  ',
      ' GooooooG  ',
      '  GooooG   ',
      '  bb bb    ',
    ].join('\n'),
    palette: { o:'#FF8A2B', G:'#B14E00', s:'#F5C9A6', f:'#222', b:'#B14E00' },
  },
};
function Sprite({ name, scale = 4, style, className }) {
  const s = SPRITES[name] || SPRITES.knight;
  return (
    <div className={className} style={{ display:'inline-block', ...style }}>
      <PixelArt map={s.map} palette={s.palette} scale={scale} />
    </div>
  );
}

// ============================================================
// AVATAR — octagon frame with sprite inside
// ============================================================
function Avatar({ sprite = 'knight', tone = 'violet', size = 96, level }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div className={`pframe ${tone}`} style={{ width: size, height: size }}>
        <div style={{ position:'relative', width:'70%', height:'70%', display:'grid', placeItems:'end center' }}>
          <Sprite name={sprite} scale={Math.max(2, Math.floor(size/28))} />
        </div>
      </div>
      {level !== undefined && (
        <div style={{
          position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
          background: '#000', color: 'var(--gold)',
          fontFamily: 'var(--f-hud)', fontSize: 12, fontWeight: 700,
          padding: '3px 10px',
          border: '2px solid var(--gold)',
          borderRadius: 999,
          letterSpacing: '0.08em',
          boxShadow: '0 2px 0 #000',
        }}>LVL {level}</div>
      )}
    </div>
  );
}

// ============================================================
// XP BAR
// ============================================================
function XPBar({ value, max, color = 'gold', height = 14, showText = false, textRight }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const cls = color === 'gold' ? '' : color;
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 10, width:'100%' }}>
      <div className={`xp-bar ${cls}`} style={{ height, flex:1 }}>
        <i style={{ width: pct + '%' }} />
      </div>
      {(showText || textRight) && (
        <span className="f-hud" style={{ color:'var(--gold)', fontSize: 13, whiteSpace:'nowrap' }}>
          {textRight || `${value} / ${max} XP`}
        </span>
      )}
    </div>
  );
}

// ============================================================
// HP / Elixir / generic stat bar
// ============================================================
function StatBar({ value, max, color = 'green', label, height = 14 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const danger = pct < 25;
  const low = pct < 50;
  return (
    <div>
      {label && (
        <div className="f-hud" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, display:'flex', justifyContent:'space-between' }}>
          <span>{label}</span><span style={{ color:'var(--ink-1)' }}>{value} / {max}</span>
        </div>
      )}
      <div className={`hp-bar ${danger ? 'crit' : low ? 'low' : ''}`} style={{ height }}>
        <i style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

// ============================================================
// COIN / GEM / FIRE pictographs (CSS-drawn)
// ============================================================
function Coin({ size = 18 }) {
  return (
    <span className="coin-spin" style={{
      display: 'inline-block', width: size, height: size,
      background: 'var(--gold)', borderRadius: '50%',
      border: '2px solid #000',
      boxShadow: 'inset -3px -3px 0 var(--gold-deep), inset 2px 2px 0 var(--gold-glow)',
      position: 'relative',
    }}>
      <span style={{
        position:'absolute', inset: 0, display:'grid', placeItems:'center',
        color: '#3a2700', fontFamily:'var(--f-hud)', fontWeight:700, fontSize: size*0.6,
      }}>$</span>
    </span>
  );
}
function Fire({ size = 18 }) {
  return (
    <span className="fire-wiggle" style={{
      display: 'inline-block', fontSize: size, lineHeight: 1,
      filter: 'drop-shadow(0 0 6px #FF8A2B)'
    }}>🔥</span>
  );
}
function Heart({ size = 18 }) {
  return (
    <span className="heart-beat" style={{ display:'inline-block', position:'relative', width: size, height: size }}>
      <span style={{
        position:'absolute', inset:0,
        background: 'var(--pink)',
        clipPath: 'path("M9 16 L1 8 a4 4 0 0 1 8 -4 a4 4 0 0 1 8 4 z")',
        WebkitMaskImage: 'radial-gradient(circle at 30% 30%, white, white)',
      }}>
        <svg viewBox="0 0 18 16" width={size} height={size}>
          <path d="M9 15 L1.5 7.5 A3.5 3.5 0 0 1 9 4 A3.5 3.5 0 0 1 16.5 7.5 z"
            fill="var(--pink)" stroke="#000" strokeWidth="1.5" />
        </svg>
      </span>
    </span>
  );
}

// ============================================================
// PILL with icon
// ============================================================
function Pill({ tone = 'violet', icon, children }) {
  return (
    <span className={`pill pill-${tone}`}>
      {icon}{children}
    </span>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================
function SectionTitle({ icon, title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 14 }}>
      {icon && <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>}
      <h3 className="h3" style={{ flex: 1 }}>{title}</h3>
      {action}
    </div>
  );
}

// ============================================================
// XP POPUP system — fires on demand from any element
// ============================================================
const XPPopupCtx = React.createContext(null);
function XPPopupProvider({ children }) {
  const [items, setItems] = useState([]);
  const fire = useCallback((opts) => {
    const id = Math.random().toString(36).slice(2);
    setItems(it => [...it, { id, x: opts.x, y: opts.y, label: opts.label || '+10 XP', color: opts.color || 'var(--gold)' }]);
    setTimeout(() => setItems(it => it.filter(i => i.id !== id)), 1300);
  }, []);
  return (
    <XPPopupCtx.Provider value={fire}>
      {children}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
        {items.map(i => (
          <div key={i.id} className="xp-popup" style={{ left: i.x, top: i.y, color: i.color }}>{i.label}</div>
        ))}
      </div>
    </XPPopupCtx.Provider>
  );
}
function useXPPopup() { return React.useContext(XPPopupCtx); }

// expose globals
Object.assign(window, {
  PixelArt, Sprite, Avatar, XPBar, StatBar, Coin, Fire, Heart, Pill, SectionTitle,
  XPPopupProvider, useXPPopup, SPRITES,
});
