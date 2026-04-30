# DESIGN_BRIEF.md
# Gamified Learning Platform — Design Bible for Claude Code

> **READ THIS FIRST.** This document is the single source of truth for all UI decisions.
> Every component you build must match these specifications. Do not use generic AI aesthetics.
> Reference the provided asset files: `design-tokens.json`, `game-components.css`, `tailwind.game.config.js`

---

## 1. THE VISION

This is **not a normal learning platform.** It must feel like a **game you happen to learn from** — not a school app with game stickers slapped on it.

Real-world references (study these):
- **Clash Royale** — dark arena UI, card-based mechanics, elixir bar, trophy system
- **Duolingo** — skill tree path, streak counter, XP bars, hearts/lives, leaderboard leagues
- **Habitica** — RPG character system, pixel art, class selection, quest cards
- **Hearthstone** — glowing rarity borders on cards, mana cost badges, card draw animations
- **Fortnite** — battle pass tier track, daily challenges, victory screen

**The test:** Show any screen to a student. Their first thought should be "this is a game," not "this is a school app."

---

## 2. AESTHETIC RULES (NON-NEGOTIABLE)

### What to DO ✅
- **Dark backgrounds always** — `#0D0D1A` (arena), `#1A1A2E` (cards), `#16213E` (panels)
- **Glowing borders** on interactive elements — `1.5px solid #4A9EFF` with box-shadow glow
- **Hard drop shadows** on buttons (Duolingo-style) — `box-shadow: 0 4px 0 #3A8501` not soft blur
- **Fredoka One** font for display/headings, **Nunito** for body, **Oswald** for HUD numbers
- **Gold (#FFC800)** for XP and rewards, **Purple (#7C3AED)** for elixir/mana/primary
- **Green (#58CC02)** for correct/complete, **Red (#FF4B4B)** for wrong/danger
- **Orange (#FF9600)** for streak/fire elements
- Animations on every state change — card deals, XP popups, correct flashes, wrong shakes
- Rarity system on all "collectible" items: Common (grey) → Rare (blue) → Epic (purple) → Legendary (gold glow)

### What NOT to do ❌
- No white or light backgrounds anywhere (even modals use dark overlays)
- No Inter, Roboto, Arial, or system fonts — these feel like office software
- No soft box shadows (like `0 2px 8px rgba(0,0,0,0.1)`) — use hard game-style shadows
- No flat boring buttons with no press effect
- No generic card designs without rarity borders
- No plain progress bars without gradient fills and glow
- No purple-gradient-on-white — that's the most generic AI look possible
- No passive UI — everything should animate, glow, or react

---

## 3. COMPONENT SPECIFICATIONS

### 3.1 Page Layout
```
┌─────────────────────────────────────────────────────┐
│  GAME HUD (fixed top bar)  [HP] [Timer] [Score/XP]  │
├─────────────────────────────────────────────────────┤
│  LEFT SIDEBAR         │  MAIN CONTENT AREA           │
│  - Player avatar      │  (skill tree / cards / quiz) │
│  - RPG stats (HP/XP)  │                              │
│  - Class badge        │                              │
│  - Active quest       │                              │
├───────────────────────┴──────────────────────────────┤
│  BOTTOM NAV: [Home] [Quests] [Deck] [Leaderboard]    │
└─────────────────────────────────────────────────────┘
```
- Main background: `bg-arena` (`#0D0D1A`) with `bg-arena-bg` radial gradient
- All panels: `#16213E` with `border: 0.5px solid rgba(255,255,255,0.06)`
- Top HUD: `position: fixed`, `z-index: 100`, translucent with backdrop-filter

### 3.2 HUD (Heads-Up Display)
Import class: `.game-hud` from `game-components.css`
- Left: Hearts/Lives (❤️ × 5) using `.heart-icon` + `.lives-container`
- Center: countdown timer using `.hud-timer` (yellow, Oswald font, 26px)
  - When < 10s remaining: add `.urgent` class (turns red, shakes)
- Right: score using `.hud-score-value` + `.hud-score-label`
- Show XP bar below HUD row (`.xp-bar-container`)

### 3.3 Skill Tree (main navigation)
Reference: Duolingo's lesson path
- Vertical column of circular nodes, connected by lines
- Use `.lesson-path`, `.lesson-node`, `.path-connector` from CSS
- Node states:
  - `done` — green (#58CC02), checkmark icon, line below also green
  - `active` — blue (#1CB0F6), play icon, pulsing glow animation
  - `locked` — grey, lock icon, disabled cursor
- Each node has a label below it (topic name) and crown icon above if "mastered"
- Clicking `active` node starts the lesson/quiz

### 3.4 Subject Cards (Clash Royale inspired)
Reference: Clash Royale card deck
- Use `.game-card` + rarity class from CSS
- Dark navy gradient background
- Colored glowing border based on rarity:
  - Common: grey border `#6B7280`
  - Rare: blue glow `#3B82F6` + subtle shadow
  - Epic: purple glow `#A855F7` + stronger shadow
  - Legendary: gold glow `#FFD700` + `legendaryPulse` animation
- Purple circle badge (top-right corner) = difficulty level (`.game-card-cost`)
- Card art area = emoji or subject icon (large, centered)
- Card name in Oswald font, uppercase, small letter-spacing
- On hover: `translateY(-4px) scale(1.03)` + stronger shadow
- On click: `cardDeal` animation plays when entering lesson

### 3.5 Quiz Interface
During a quiz/lesson:
1. Question displayed in a "board" panel (`bg-panel`, rounded corners, quest-style green top border)
2. Answer options use `.answer-btn` — selectable, show correct/wrong state
3. Correct answer:
   - Button gets `.correct` class (green border + flash animation)
   - XP popup appears (`+10 XP` floating up and fading)
   - Confetti burst briefly
   - `correctFlash` animation on question area
4. Wrong answer:
   - Button gets `.wrong` class (red border + shake animation)
   - One heart removed (with shake animation on hearts)
   - `wrongShake` on question area
5. Bottom: "Check" button = large, Duolingo-style with hard drop shadow

### 3.6 Leaderboard (Duolingo leagues)
- Weekly reset, show top 10 + player's own rank always visible
- Use `.leaderboard`, `.lb-row`, `.lb-rank` classes
- Top 3 rows have gold/silver/bronze backgrounds
- Player's own row: purple tinted (`rank-you` class), name in purple
- Ranks use `.gold`, `.silver`, `.bronze`, `.other` color classes
- League tiers: Bronze → Silver → Gold → Diamond → Master
  - Show current league badge at top of leaderboard

### 3.7 Streak Counter
- Always visible on dashboard, use `.streak-badge`
- Orange gradient background, fire emoji, Oswald number font
- On hover: number bounces (`streakBounce` animation)
- When streak is 0 or about to break: show "Freeze available" badge

### 3.8 Achievement Badges
- Grid layout, 6 per row max
- Use `.achievement-badge` + color class
- Locked ones greyed out (`.locked`)
- Newly earned badge gets red dot notification (`.badge-new`)
- Tooltip on hover: badge name + how to earn

### 3.9 Quest Cards
- Use `.quest-card` from CSS
- Green glowing top border line
- Daily quests: `.quest-tag.daily` (blue tag)
- Weekly quests: `.quest-tag.weekly` (purple tag)
- Progress bar + fraction text at bottom
- XP reward shown in gold

### 3.10 Player Profile / RPG Character
- Pixel art avatar (use `.pixel-art` utility class for crisp rendering)
- Class badge: Warrior / Wizard / Healer / Rogue with color coding
  - Warrior: red (`#EF4444`)
  - Wizard: indigo (`#6366F1`)
  - Healer: green (`#22C55E`)
  - Rogue: amber (`#F59E0B`)
- Three stat bars below avatar: HP (red), XP (gold), MP (blue) using `.stat-bar-*` classes
- Four RPG stat pills: STR / INT / CON / PER

### 3.11 Elixir / Energy Bar
Reference: Clash Royale elixir bar
- 10 gem shapes, fills left to right over time
- Use `.elixir-bar`, `.elixir-gem.filled`, `.elixir-gem.empty`
- Count shown to right in purple Oswald font
- Each gem fills with `elixirFill` animation
- "Costs" elixir to attempt harder lessons

---

## 4. INTERACTION STATES

| Action          | Visual response                                    |
|-----------------|-----------------------------------------------------|
| Correct answer  | Green flash, XP popup, confetti, heart preserved   |
| Wrong answer    | Red shake, heart removed (with break animation)    |
| Level up        | Full overlay modal, confetti, golden glow          |
| Streak hit      | Streak number bounces, orange pulse                |
| Card hover      | Lift + glow + scale                                |
| Locked node tap | Shake + tooltip "complete previous first"          |
| Quest complete  | Progress bar fills, badge unlocks with pop         |
| Timer < 10s     | Timer turns red, pulses, screen edge vignette red  |

---

## 5. TYPOGRAPHY USAGE

```css
/* Display headings, card names, section titles */
font-family: 'Fredoka One', cursive;

/* Body text, descriptions, labels */
font-family: 'Nunito', sans-serif;

/* HUD numbers, timers, scores, stats */
font-family: 'Oswald', sans-serif;
```

Load via Google Fonts (already in design-tokens.json → `typography.googleFonts`):
```html
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&family=Oswald:wght@400;600;700&display=swap" rel="stylesheet">
```

In Next.js, add to `app/layout.tsx` or `pages/_document.tsx`.

---

## 6. COLOR QUICK REFERENCE

```
#0D0D1A  Arena background (deepest)
#1A1A2E  Card surfaces
#16213E  Panel/sidebar
#0F172A  Page surface

#58CC02  Correct / Complete (Duolingo green)
#1CB0F6  Active / Focus (Duolingo blue)
#FF4B4B  Wrong / Danger
#FFC800  XP / Gold rewards
#FF9600  Streak / Fire
#D946EF  Elixir / Mana (purple-pink)
#7C3AED  Brand primary (purple)
#FFD700  Legendary gold
#A855F7  Epic purple
#3B82F6  Rare blue
#4ADE80  Quest green
```

---

## 7. FILE STRUCTURE RECOMMENDATION

```
/styles
  game-components.css     ← import in layout
  globals.css             ← base resets only

/lib
  design-tokens.json      ← use for JS theme values

tailwind.game.config.js   ← merge into tailwind.config.js

/components/game
  XPBar.tsx
  GameCard.tsx
  LessonPath.tsx
  StreakBadge.tsx
  GameHUD.tsx
  ElixirBar.tsx
  Leaderboard.tsx
  AchievementBadge.tsx
  QuestCard.tsx
  AnswerButton.tsx
  StatBar.tsx
  LevelUpModal.tsx
  XPPopup.tsx
```

---

## 8. HOW TO IMPORT ASSETS IN NEXT.JS

**In `app/layout.tsx`:**
```tsx
import '@/styles/game-components.css'
```

**In `tailwind.config.js`:**
```js
const gameConfig = require('./tailwind.game.config')
module.exports = {
  ...gameConfig,
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
}
```

**For token values in JS/TSX:**
```ts
import tokens from '@/lib/design-tokens.json'
const brandColor = tokens.colors.brand.primary  // '#7C3AED'
```

---

## 9. WHAT "DONE" LOOKS LIKE

A screen is complete when:
1. Background is dark (`#0D0D1A` or similar) — no white or light grey
2. Interactive elements have visible glow or colored borders
3. At least one animation plays on user interaction
4. Typography uses Fredoka One / Nunito / Oswald — never Inter or system font
5. Numbers (XP, score, timer) use Oswald and are visually prominent
6. Color follows the semantic system: green=correct, red=wrong, gold=reward, purple=resource
7. It looks like a screenshot from a mobile game, not a SaaS dashboard

---

*Generated from research of: Clash Royale (Supercell), Duolingo (500M+ users), Habitica (RPG productivity), Hearthstone (Blizzard), Fortnite (Epic Games)*
