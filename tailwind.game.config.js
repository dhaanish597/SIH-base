// tailwind.game.config.js
// Gamified Learning Platform — Tailwind CSS Extension
// Reference: Clash Royale, Duolingo, Habitica, Hearthstone
//
// USAGE in tailwind.config.js:
//   const gameConfig = require('./tailwind.game.config');
//   module.exports = { ...gameConfig, content: [...] }
// OR merge into your existing config's theme.extend

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {

      // ─── FONTS ────────────────────────────────────────────────────────────
      fontFamily: {
        display: ['Fredoka One', 'Nunito', 'cursive'],   // headings, card titles
        body:    ['Nunito', 'DM Sans', 'sans-serif'],    // body text
        hud:     ['Oswald', 'Barlow Condensed', 'sans-serif'], // timer, score, HP
        mono:    ['JetBrains Mono', 'monospace'],
      },

      // ─── GAME COLOR PALETTE ───────────────────────────────────────────────
      colors: {
        // --- Backgrounds (dark arena theme) ---
        arena:   '#0D0D1A',   // deepest bg — main arena/page bg
        card:    '#1A1A2E',   // card surfaces
        panel:   '#16213E',   // sidebar, panel bg
        surface: '#0F172A',   // slightly lighter than arena

        // --- Game semantic colors ---
        correct:   { DEFAULT: '#58CC02', dark: '#46A302', shadow: '#3A8501' },
        active:    { DEFAULT: '#1CB0F6', dark: '#0099E0', shadow: '#007AB8' },
        wrong:     { DEFAULT: '#FF4B4B', dark: '#E63C3C' },
        xp:        { DEFAULT: '#FFC800', dark: '#E6B400' },
        streak:    { DEFAULT: '#FF9600', dark: '#E68700' },
        elixir:    { DEFAULT: '#D946EF', dark: '#9333EA' },

        // --- Rarity tiers (Clash Royale / Hearthstone) ---
        common:    '#6B7280',
        rare:      '#3B82F6',
        epic:      '#A855F7',
        legendary: '#FFD700',

        // --- RPG class colors (Habitica) ---
        warrior: '#EF4444',
        wizard:  '#6366F1',
        healer:  '#22C55E',
        rogue:   '#F59E0B',

        // --- Quest / mission ---
        quest:   '#4ADE80',
      },

      // ─── BORDER RADIUS ────────────────────────────────────────────────────
      borderRadius: {
        card:   '14px',
        badge:  '20px',
        pill:   '100px',
        avatar: '50%',
      },

      // ─── BOX SHADOWS (game-style hard drop shadows) ───────────────────────
      boxShadow: {
        // Duolingo-style hard shadow on buttons
        'btn-correct': '0 4px 0 #3A8501',
        'btn-active':  '0 4px 0 #007AB8',
        'btn-wrong':   '0 4px 0 #991B1B',
        'btn-xp':      '0 4px 0 #B45309',
        'card-idle':   '0 4px 0 #1A1A3E',
        'card-hover':  '0 6px 0 #1A1A3E, 0 0 20px rgba(124,58,237,0.25)',
        // Glow effects (rarity)
        'legendary':   '0 0 24px rgba(255,215,0,0.5)',
        'epic':        '0 0 16px rgba(168,85,247,0.5)',
        'rare':        '0 0 12px rgba(59,130,246,0.4)',
        'xp-glow':     '0 0 16px rgba(255,200,0,0.45)',
        'elixir-glow': '0 0 12px rgba(217,70,239,0.5)',
        'quest-glow':  '0 0 12px rgba(74,222,128,0.35)',
        // HUD
        'hud':         '0 2px 12px rgba(0,0,0,0.6)',
      },

      // ─── BACKGROUND IMAGES / GRADIENTS ────────────────────────────────────
      backgroundImage: {
        'xp-bar':      'linear-gradient(90deg, #7C3AED, #A78BFA)',
        'hp-bar':      'linear-gradient(90deg, #EF4444, #F87171)',
        'mp-bar':      'linear-gradient(90deg, #3B82F6, #93C5FD)',
        'streak-grad': 'linear-gradient(135deg, #FF6B00, #FF9500)',
        'elixir-gem':  'linear-gradient(180deg, #D946EF, #9333EA)',
        'card-rare':   'linear-gradient(160deg, #1E3A5F 0%, #0D1B2A 100%)',
        'card-epic':   'linear-gradient(160deg, #2E1065 0%, #1A0A2E 100%)',
        'card-legendary':'linear-gradient(160deg, #451A03 0%, #1C0A00 100%)',
        'arena-bg':    'radial-gradient(ellipse at top, #1a1a3e 0%, #0d0d1a 60%)',
        'correct-flash':'linear-gradient(135deg, rgba(88,204,2,0.15), transparent)',
        'wrong-flash': 'linear-gradient(135deg, rgba(255,75,75,0.15), transparent)',
      },

      // ─── KEYFRAME ANIMATIONS ──────────────────────────────────────────────
      keyframes: {
        // Duolingo correct answer
        correctFlash: {
          '0%':   { backgroundColor: 'rgba(88,204,2,0)' },
          '30%':  { backgroundColor: 'rgba(88,204,2,0.25)' },
          '100%': { backgroundColor: 'rgba(88,204,2,0)' },
        },
        // Wrong answer shake
        wrongShake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-8px)' },
          '40%':     { transform: 'translateX(8px)' },
          '60%':     { transform: 'translateX(-5px)' },
          '80%':     { transform: 'translateX(5px)' },
        },
        // XP popup float
        xpPopup: {
          '0%':   { opacity: '1', transform: 'translateY(0) scale(1)' },
          '60%':  { opacity: '1', transform: 'translateY(-40px) scale(1.2)' },
          '100%': { opacity: '0', transform: 'translateY(-70px) scale(0.8)' },
        },
        // Level up celebration
        levelUp: {
          '0%':   { transform: 'scale(0.5)', opacity: '0' },
          '60%':  { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        // Card deal (Clash Royale)
        cardDeal: {
          '0%':   { transform: 'translateY(40px) rotate(-5deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(0deg)',     opacity: '1' },
        },
        // Streak bounce
        streakBounce: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.3)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        // Node pulse (Duolingo active lesson)
        nodePulse: {
          '0%,100%': { boxShadow: '0 4px 0 #007AB8' },
          '50%':     { boxShadow: '0 4px 0 #007AB8, 0 0 20px rgba(28,176,246,0.4)' },
        },
        // Elixir fill (Clash Royale)
        elixirFill: {
          '0%':   { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        // Legendary card glow
        legendaryPulse: {
          '0%,100%': { boxShadow: '0 0 16px rgba(255,215,0,0.3)' },
          '50%':     { boxShadow: '0 0 32px rgba(255,215,0,0.7)' },
        },
      },

      animation: {
        'correct-flash':   'correctFlash 0.4s ease',
        'wrong-shake':     'wrongShake 0.4s ease',
        'xp-popup':        'xpPopup 0.8s ease forwards',
        'level-up':        'levelUp 0.6s cubic-bezier(0.175,0.885,0.32,1.275)',
        'card-deal':       'cardDeal 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
        'streak-bounce':   'streakBounce 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
        'node-pulse':      'nodePulse 1.5s ease-in-out infinite',
        'elixir-fill':     'elixirFill 0.3s ease forwards',
        'legendary-pulse': 'legendaryPulse 2s ease-in-out infinite',
      },

      // ─── Z-INDEX ───────────────────────────────────────────────────────────
      zIndex: {
        hud:    '100',
        modal:  '200',
        tooltip:'300',
        levelup:'400',
      },
    },
  },

  plugins: [
    // Optional: add this plugin for game-specific utilities
    function({ addUtilities }) {
      addUtilities({
        // Hard-press button (Duolingo style) — shrinks on active
        '.btn-press': {
          transition: 'transform 0.1s, box-shadow 0.1s',
          '&:active': { transform: 'translateY(3px)', boxShadow: '0 1px 0 currentColor' },
        },
        // Rarity card border glow
        '.border-legendary-glow': { border: '1.5px solid #FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.4)' },
        '.border-epic-glow':      { border: '1.5px solid #A855F7', boxShadow: '0 0 14px rgba(168,85,247,0.4)' },
        '.border-rare-glow':      { border: '1.5px solid #3B82F6', boxShadow: '0 0 10px rgba(59,130,246,0.3)' },
        // XP bar gradient fill
        '.xp-bar-fill': { background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: '100px' },
        // Pixel-crisp rendering (Habitica pixel art)
        '.pixel-art':   { imageRendering: 'pixelated', imageRendering: 'crisp-edges' },
      })
    }
  ],
};
