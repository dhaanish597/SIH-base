/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './index.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      fontFamily: {
        sans:    ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Bowlby One"', '"Fredoka One"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body:    ['Nunito', 'sans-serif'],
        hud:     ['Oswald', '"Bebas Neue"', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        'game': ['64px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        '4xl':   '2rem',
        card:    '14px',
        badge:   '20px',
        pill:    '100px',
        avatar:  '50%',
      },
      colors: {
        // Arena backgrounds
        arena:   '#0D0D1A',
        card:    '#1A1A2E',
        panel:   '#16213E',
        surface: '#0F172A',

        // Legacy bg aliases
        bg: {
          base:     '#0A0A14',
          surface:  '#12121F',
          elevated: '#1A1A2E',
          overlay:  '#16213E',
        },

        // Game semantic colours
        correct:   { DEFAULT: '#58CC02', dark: '#46A302', shadow: '#3A8501' },
        active:    { DEFAULT: '#1CB0F6', dark: '#0099E0', shadow: '#007AB8' },
        wrong:     { DEFAULT: '#FF4B4B', dark: '#E63C3C' },
        xp:        { DEFAULT: '#FFC800', dark: '#E6B400' },
        streak:    { DEFAULT: '#FF9600', dark: '#E68700' },
        elixir:    { DEFAULT: '#D946EF', dark: '#9333EA' },
        quest:     '#4ADE80',

        // Rarity tiers
        common:    '#6B7280',
        rare:      '#3B82F6',
        epic:      '#A855F7',
        legendary: '#FFD700',

        // RPG classes
        warrior: '#EF4444',
        wizard:  '#6366F1',
        healer:  '#22C55E',
        rogue:   '#F59E0B',

        // Brand & legacy
        brand: {
          primary:    '#7C3AED',
          primaryGlow:'#A855F7',
          secondary:  '#06B6D4',
          secondaryGlow:'#22D3EE',
        },
        accent: {
          gold:  '#F59E0B',
          green: '#10B981',
          red:   '#EF4444',
          pink:  '#EC4899',
        },
        text: {
          primary:   '#F1F5F9',
          secondary: '#94A3B8',
          muted:     '#475569',
        },
        border: {
          DEFAULT: 'rgba(124, 58, 237, 0.2)',
          active:  'rgba(124, 58, 237, 0.6)',
        },
      },
      boxShadow: {
        // Duolingo-style hard game shadows
        'btn-correct':  '0 4px 0 #3A8501',
        'btn-active':   '0 4px 0 #007AB8',
        'btn-wrong':    '0 4px 0 #991B1B',
        'btn-xp':       '0 4px 0 #B45309',
        'card-idle':    '0 4px 0 #1A1A3E',
        'card-hover':   '0 6px 0 #1A1A3E, 0 0 20px rgba(124,58,237,0.25)',
        // Rarity glows
        legendary:      '0 0 24px rgba(255,215,0,0.5)',
        epic:           '0 0 16px rgba(168,85,247,0.5)',
        rare:           '0 0 12px rgba(59,130,246,0.4)',
        'xp-glow':      '0 0 16px rgba(255,200,0,0.45)',
        'elixir-glow':  '0 0 12px rgba(217,70,239,0.5)',
        'quest-glow':   '0 0 12px rgba(74,222,128,0.35)',
        hud:            '0 2px 12px rgba(0,0,0,0.6)',
        // Legacy
        'glow-primary':  '0 0 20px rgba(124, 58, 237, 0.4)',
        'glow-secondary':'0 0 20px rgba(6, 182, 212, 0.4)',
        'glow-gold':     '0 0 20px rgba(245, 158, 11, 0.5)',
        'glow-sm':       '0 0 10px rgba(124, 58, 237, 0.15)',
        'inner-glow':    'inset 0 1px 0 rgba(255,255,255,0.05)',
        card:            '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'xp-bar':        'linear-gradient(90deg, #7C3AED, #A78BFA)',
        'hp-bar':        'linear-gradient(90deg, #EF4444, #F87171)',
        'mp-bar':        'linear-gradient(90deg, #3B82F6, #93C5FD)',
        'streak-grad':   'linear-gradient(135deg, #FF6B00, #FF9500)',
        'elixir-gem':    'linear-gradient(180deg, #D946EF, #9333EA)',
        'card-rare':     'linear-gradient(160deg, #1E3A5F 0%, #0D1B2A 100%)',
        'card-epic':     'linear-gradient(160deg, #2E1065 0%, #1A0A2E 100%)',
        'card-legendary':'linear-gradient(160deg, #451A03 0%, #1C0A00 100%)',
        'arena-bg':      'radial-gradient(ellipse at top, #1a1a3e 0%, #0d0d1a 60%)',
        'correct-flash': 'linear-gradient(135deg, rgba(88,204,2,0.15), transparent)',
        'wrong-flash':   'linear-gradient(135deg, rgba(255,75,75,0.15), transparent)',
        'gradient-radial':'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      },
      zIndex: {
        hud:     '100',
        modal:   '200',
        tooltip: '300',
        levelup: '400',
      },
      keyframes: {
        // Game keyframes
        correctFlash: {
          '0%':   { backgroundColor: 'rgba(88,204,2,0)' },
          '30%':  { backgroundColor: 'rgba(88,204,2,0.25)' },
          '100%': { backgroundColor: 'rgba(88,204,2,0)' },
        },
        wrongShake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-8px)' },
          '40%':     { transform: 'translateX(8px)' },
          '60%':     { transform: 'translateX(-5px)' },
          '80%':     { transform: 'translateX(5px)' },
        },
        xpPopup: {
          '0%':   { opacity: '1', transform: 'translateY(0) scale(1)' },
          '60%':  { opacity: '1', transform: 'translateY(-40px) scale(1.2)' },
          '100%': { opacity: '0', transform: 'translateY(-70px) scale(0.8)' },
        },
        levelUp: {
          '0%':   { transform: 'scale(0.5)', opacity: '0' },
          '60%':  { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        cardDeal: {
          '0%':   { transform: 'translateY(40px) rotate(-5deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(0deg)',     opacity: '1' },
        },
        streakBounce: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.3)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        nodePulse: {
          '0%,100%': { boxShadow: '0 4px 0 #007AB8' },
          '50%':     { boxShadow: '0 4px 0 #007AB8, 0 0 20px rgba(28,176,246,0.4)' },
        },
        elixirFill: {
          '0%':   { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        legendaryPulse: {
          '0%,100%': { boxShadow: '0 0 16px rgba(255,215,0,0.3)' },
          '50%':     { boxShadow: '0 0 32px rgba(255,215,0,0.7)' },
        },
        // Legacy keyframes
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.6)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        progress: {
          '0%': { width: '0%' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // Game animations
        'correct-flash':   'correctFlash 0.4s ease',
        'wrong-shake':     'wrongShake 0.4s ease',
        'xp-popup':        'xpPopup 0.8s ease forwards',
        'level-up':        'levelUp 0.6s cubic-bezier(0.175,0.885,0.32,1.275)',
        'card-deal':       'cardDeal 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
        'streak-bounce':   'streakBounce 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
        'node-pulse':      'nodePulse 1.5s ease-in-out infinite',
        'elixir-fill':     'elixirFill 0.3s ease forwards',
        'legendary-pulse': 'legendaryPulse 2s ease-in-out infinite',
        // Legacy animations
        'fade-in':         'fadeIn 0.2s ease-out',
        'fade-in-up':      'fadeInUp 0.3s ease-out',
        'slide-up':        'slideUp 0.3s ease-out',
        'slide-down':      'slideDown 0.3s ease-out',
        'slide-in-right':  'slideInRight 0.3s ease-out',
        'scale-in':        'scaleIn 0.2s ease-out',
        'pulse-slow':      'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':         'shimmer 2s linear infinite',
        'float':           'float 6s ease-in-out infinite',
        'glow':            'glow 2s ease-in-out infinite alternate',
        'bounce-subtle':   'bounceSubtle 2s ease-in-out infinite',
        'progress':        'progress 1s ease-out forwards',
        'count-up':        'countUp 0.6s ease-out',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.btn-press': {
          transition: 'transform 0.1s, box-shadow 0.1s',
          '&:active': { transform: 'translateY(3px)', boxShadow: '0 1px 0 currentColor' },
        },
        '.border-legendary-glow': { border: '1.5px solid #FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.4)' },
        '.border-epic-glow':      { border: '1.5px solid #A855F7', boxShadow: '0 0 14px rgba(168,85,247,0.4)' },
        '.border-rare-glow':      { border: '1.5px solid #3B82F6', boxShadow: '0 0 10px rgba(59,130,246,0.3)' },
        '.xp-bar-fill':           { background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: '100px' },
        '.pixel-art':             { imageRendering: 'pixelated' },
      });
    },
  ],
};
