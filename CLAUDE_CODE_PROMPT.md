# CLAUDE CODE PROMPT — QUEST ACADEMY GAMIFIED UI REDESIGN
# Copy everything below this line and paste into Claude Code

---

## CONTEXT & ASSETS (READ FIRST)

Before writing a single line of code, read these files in this exact order:
1. `DESIGN_BRIEF.md` — the complete design bible (colors, fonts, components, rules)
2. `design-tokens.json` — all color values, spacing, animation names
3. `game-components.css` — pre-built CSS classes you must use
4. `tailwind.game.config.js` — merge into `tailwind.config.js` immediately

These files were purpose-built for this project. Do not invent colors or fonts. Use what's in those files.

---

## THE CORE PROBLEM TO FIX

The current UI looks like a **dark SaaS dashboard with game labels pasted on it**. It needs to look like a **real mobile/PC game that happens to teach**. The references are Clash Royale, Duolingo, Hearthstone, Habitica, and Fortnite. Every screen must pass this test: show it to a student and their first reaction should be "this is a game" — not "this is a school app."

Specific current problems to fix:
- Fonts look like office software (monospace/system fonts) — replace with Fredoka One (headings) + Nunito (body) + Oswald (HUD numbers/stats)
- Cards are flat plain rectangles — need glowing colored borders, rarity system, hover animations
- Buttons have no press effect — need Duolingo-style hard drop shadows (`box-shadow: 0 4px 0 #shadow-color`)
- Progress bars are thin flat lines — need gradient fills, glow, and height of at least 10-14px
- Leaderboard looks like a spreadsheet — need gold/silver/bronze row treatments, XP bar per row
- Welcome banner is flat — needs particle effects or animated background, character art area
- The overall vibe is "dark mode website" not "game arena"

---

## STEP 1 — SETUP (do this before anything else)

```bash
# 1. Install required fonts via next/font or add to layout
# 2. Merge tailwind.game.config.js into tailwind.config.js
# 3. Import game-components.css in app/layout.tsx
# 4. Verify CSS variables from game-components.css are loading
```

In `app/layout.tsx` or `pages/_document.tsx`, add Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&family=Oswald:wght@400;600;700&display=swap" rel="stylesheet">
```

Global body style:
```css
body {
  background: #0D0D1A;
  font-family: 'Nunito', sans-serif;
  color: #F0F4FF;
}
```

---

## STEP 2 — NAVIGATION REDESIGN

### Current nav (BROKEN):
`HOME | GAMES | SUBJECTS | RANKS`

### New nav (REQUIRED):
`HOME | GAMES | QUESTS | SUBJECTS | BATTLE | LEADERBOARD | SHOP`

### Navigation component spec:

**Desktop navbar:**
- Background: `rgba(13,13,26,0.95)` with `backdrop-filter: blur(12px)`
- Bottom border: `1px solid rgba(255,255,255,0.06)`
- Logo: Keep "QUEST ACADEMY" but use Fredoka One font, add subtle purple glow on the icon
- Nav links: Nunito font, 14px, font-weight 700, UPPERCASE, letter-spacing 0.08em
- Active link: `color: #7C3AED` with bottom border `2px solid #7C3AED`
- Hover: color transitions to `#A78BFA`
- Right side (user area): Show level badge as a proper RPG badge — purple gradient pill with "LVL 5" in Oswald font, avatar with purple ring border

**New nav items to add with their routes and icons:**
- HOME (`/`) — 🏠 house icon
- GAMES (`/games`) — 🎮 controller icon  
- QUESTS (`/quests`) — ⚔️ sword icon — **ADD THIS PAGE (see Step 6)**
- SUBJECTS (`/subjects`) — 📚 book icon
- BATTLE (`/battle`) — ⚡ bolt icon — **ADD THIS PAGE (see Step 7)**
- LEADERBOARD (`/leaderboard`) — 🏆 trophy icon — **ADD THIS PAGE (see Step 8)**
- SHOP (`/shop`) — 🛒 coin icon — **ADD THIS PAGE (see Step 9)**

**Mobile nav:** Bottom tab bar with icons only, active tab glows purple

---

## STEP 3 — HOME PAGE REDESIGN (`/`)

### 3.1 Welcome Hero Banner

Current: Flat dark rectangle with avatar circle and text
Required: Full-width arena-style banner with depth and energy

```
Design spec:
- Background: radial gradient from #1a1a3e (center) to #0D0D1A (edges) 
  PLUS a subtle animated particle effect (small dots floating slowly)
  OR a diagonal geometric pattern overlay at 5% opacity
- Left side: Player avatar — NOT a plain grey circle
  → 80px circle with PURPLE GRADIENT border (3px, animated rotation)
  → Inside: player initial OR pixel art character sprite
  → Below avatar: RPG class badge (e.g. "⚔️ WARRIOR" in red pill)
- Right side of avatar: 
  → "WELCOME BACK," in Nunito 16px muted
  → Player name in Fredoka One 36px white
  → Level title "LEVEL 5 APPRENTICE" in purple #A78BFA, 14px Oswald uppercase
- XP Bar: Use .xp-bar-container class — height 14px, gradient fill, glowing edge
  → Show "950 / 2500 XP" in Oswald font to the right, gold color
- Stats row (3 pills below XP bar):
  → 🔥 "1 DAY STREAK" — orange gradient pill, hard shadow
  → 🪙 "177 COINS" — gold pill
  → 🏆 "RANK #3 IN SCHOOL" — purple pill
  → Each pill: border-radius 100px, Oswald font, border with matching color glow
  → Hard drop shadow on each pill (Duolingo-style)
```

### 3.2 Today's Quests Card

Current: Plain card with "No active quests." text  
Required:
- Card background: `#1A1A2E` with green quest border (left side `4px solid #4ADE80`)
- Use `.quest-card` CSS class
- If empty: show "🗡️ No active quests — check the QUESTS tab!" with a glowing button linking to `/quests`
- If quests exist: show each as a `.quest-card` mini item with progress bar

### 3.3 Assigned by Teacher Card

Current: Basic card with purple tags  
Required:
- Section title: Fredoka One font with a small teacher icon
- Each assignment = a `.quest-card` with `.quest-tag` badge
- "PLAY NOW" button: full-width, purple gradient, **hard drop shadow `0 4px 0 #4C1D95`**, Oswald font uppercase, border-radius 12px
  - On hover: lifts up 2px (translateY(-2px)), shadow increases
  - On click/active: pushes down (translateY(3px)), shadow shrinks to 1px — Duolingo press effect

### 3.4 Continue Playing Card

Current: Plain list of games  
Required:
- Each game entry = mini game card with:
  - Small colored icon/emoji for the game type
  - Game name in Fredoka One
  - Progress shown as tiny XP bar
  - "CONTINUE →" link in cyan `#1CB0F6` with arrow animation on hover
- Cards have subtle left-border color coding by subject (math=blue, science=green, etc.)

### 3.5 Skill Map Section

Current: Small progress bars in a grid  
Required:
- Section title: "YOUR SKILL MAP" in Fredoka One with brain icon
- Radar/spider chart OR keep bars but make them GAME-STYLE:
  - Each bar: height 12px, gradient fill, label in Oswald uppercase, percentage in gold
  - Bar colors per subject: Math=blue, Science=green, English=cyan, History=amber, Geography=teal, Coding=red
  - Add subject emoji before each label
  - On hover: bar glows, percentage animates counting up
- The circular radar on the left: make it actually glow with subject colors

### 3.6 Leaderboard Section (on home page)

Current: Plain rows, "Demo Student (YOU)" barely visible  
Required: Apply full `.leaderboard` component styles:
- `#1` row: gold background tint, gold rank number, 🥇 medal
- `#2` row: silver tint, 🥈
- `#3` row (YOU): **full purple highlight** `rgba(124,58,237,0.2)`, purple border, name in purple, "YOU" badge
- `#4`, `#5`: subtle dark rows
- XP shown in gold Oswald font
- Add a mini progress bar per row showing XP relative to #1

---

## STEP 4 — GAMES PAGE REDESIGN (`/games`)

Current: Has a good orange hero banner — keep the concept but upgrade execution.

### 4.1 Page Header
- Title "GAME VAULT" in Fredoka One 48px
- Subtitle "Choose your battlefield" in Nunito italic
- Search bar: dark background `#1A1A2E`, cyan focus border, search icon

### 4.2 Filter Pills
Current: Plain rounded buttons  
Required:
- Inactive: `background: #1A1A2E`, `border: 1.5px solid #2D3748`, Oswald font uppercase
- Active/selected: `background: #7C3AED`, `border: 1.5px solid #9C5CF7`, white text, box-shadow glow
- Hover: border changes to purple

### 4.3 Featured Game Hero Card
Current: Orange gradient — this is good, keep it  
Upgrade:
- Add animated sparkle/star particles in the background
- "FEATURED" badge: gold gradient pill, Oswald font
- Rating badge: gold star, gold number
- Game title: Fredoka One 42px, white with subtle text-shadow
- Tags (ALGEBRA, GEOMETRY, etc.): each with distinct color per subject
- Progress bar: make it game-style (gradient, glowing tip)
- "PLAY SOLO" button: purple gradient, hard shadow, Oswald uppercase, border-radius 12px
- "FIND OPPONENT" button: transparent with cyan border `#1CB0F6`, cyan text, border-glow on hover

### 4.4 Game Cards Grid (below featured)
Each card uses `.game-card` CSS class with rarity:
- Apply rarity based on difficulty or popularity:
  - Beginner games: `.common` (grey border)
  - Intermediate: `.rare` (blue glow)  
  - Advanced: `.epic` (purple glow)
  - Top-rated: `.legendary` (gold pulse animation)
- Card structure:
  - Colored gradient art area (top 60%) — use subject color gradient
  - Game icon emoji centered (48px)
  - Game name: Fredoka One
  - Subject tags as small colored pills
  - Player count: "👥 234 playing" in muted text
  - "PLAY" button at bottom

---

## STEP 5 — SUBJECTS PAGE REDESIGN (`/subjects`)

Current: Unknown — redesign from scratch based on this spec:

### Layout:
- Grid of subject cards, 3 per row on desktop
- Each subject = a `.game-card` style card with subject-specific gradient:
  - Math: `linear-gradient(135deg, #1E3A5F, #0D1B2A)` with blue glow
  - Science: `linear-gradient(135deg, #052E16, #0D1B2A)` with green glow
  - English: `linear-gradient(135deg, #1E1B4B, #0D1B2A)` with indigo glow
  - History: `linear-gradient(135deg, #451A03, #1C0A00)` with amber glow
  - Coding: `linear-gradient(135deg, #1A0A2E, #0D0D1A)` with purple glow

### Each subject card contains:
- Large emoji icon (56px)
- Subject name: Fredoka One 20px
- Mastery percentage: Oswald font, gold color
- XP bar showing mastery level
- Chapter count: "12 chapters · 48 lessons"
- Locked chapters show lock icon with "Unlock at Level X"
- "EXPLORE →" button with subject accent color

---

## STEP 6 — NEW PAGE: QUESTS (`/quests`) ⚔️

This page does not exist yet. Create it.

### Layout:
```
Header: "⚔️ ACTIVE QUESTS" in Fredoka One

Tabs: [ DAILY | WEEKLY | SPECIAL | COMPLETED ]

Daily Quests section:
  - 3-4 quest cards using .quest-card CSS class
  - Each has: quest tag (DAILY in blue), title, description, XP reward, progress bar
  - Completed quests: green checkmark overlay, "CLAIMED" badge

Weekly Challenge section:
  - 1 large featured quest card
  - .quest-tag.weekly (purple)
  - Higher XP reward shown prominently in gold
  - Countdown timer showing time remaining

Special/Event Quests:
  - Gold-bordered cards (.legendary style)
  - Limited time badge with countdown
```

### Quest card data (use as placeholder):
```
Daily: "Complete 5 Math problems" — 50 XP — progress 3/5
Daily: "Win a Quiz Battle" — 75 XP — progress 0/1  
Daily: "Study for 15 minutes" — 30 XP — progress 15/15 (COMPLETE)
Weekly: "Master Chapter 4: Algebra" — 500 XP — progress 2/10
Special: "Back to School Challenge" — 1000 XP — ends in 2d 14h
```

---

## STEP 7 — NEW PAGE: BATTLE (`/battle`) ⚡

This page does not exist yet. Create it.

### Layout:
```
Header: "⚡ BATTLE ARENA" in Fredoka One 42px
Subtitle: "Challenge classmates — prove your knowledge"

[FIND OPPONENT] — large glowing cyan button with pulse animation

Matchmaking section:
  - Two player cards facing each other (VS layout)
  - Left: YOUR card — purple border, your avatar, stats
  - Center: "VS" in large bold Oswald, red glow
  - Right: OPPONENT card — grey "???" while searching, or opponent stats when found

Subject selector:
  - Row of subject pills to choose battle subject
  - Active subject glows with subject color

Recent Battle History:
  - List of past battles: opponent name | subject | result (WIN/LOSS) | XP gained/lost
  - WIN rows: green left border
  - LOSS rows: red left border

Leaderboard mini-widget:
  - Top 5 battle win rates
```

---

## STEP 8 — NEW PAGE: LEADERBOARD (`/leaderboard`) 🏆

This page does not exist yet. Create it (expand from the home page widget).

### Layout:
```
Header: "🏆 LEADERBOARD" in Fredoka One

League selector tabs: 
  [ BRONZE | SILVER | GOLD | DIAMOND | MASTER ]
  Active tab shows current player's league, highlighted

Time filter: [ THIS WEEK | THIS MONTH | ALL TIME ]

Top 3 podium (visual):
  - #2 on left (medium height platform, silver)
  - #1 in center (tallest platform, gold, crown icon, glow)
  - #3 on right (shortest platform, bronze)
  - Each shows avatar circle + name + XP

Full leaderboard table:
  Use .leaderboard and .lb-row CSS classes
  - Rows 1-3: gold/silver/bronze treatments
  - Player's own row: always purple highlight (rank-you class)
  - Show: rank | avatar | name | XP | XP progress bar | badge count
  - "YOU" badge on player's row

League promotion/demotion notice:
  - If player in top 10%: "🔥 YOU'RE PROMOTING NEXT WEEK!"  green banner
  - If player in bottom 20%: "⚠️ AT RISK OF DEMOTION" amber banner
```

---

## STEP 9 — NEW PAGE: SHOP (`/shop`) 🛒

This page does not exist yet. Create it.

### Layout:
```
Header: "🛒 SHOP" in Fredoka One
Coin balance shown prominently: "🪙 177 COINS" gold pill top right

Category tabs: [ AVATARS | POWER-UPS | STREAK FREEZE | THEMES ]

Item cards grid (3 per row):
  - Each item = .game-card style
  - Item name: Fredoka One
  - Coin price: gold, Oswald font, 🪙 icon
  - "BUY" button: gold gradient, hard shadow
  - If owned: "OWNED ✓" green badge, no buy button
  - Rare items: .epic or .legendary border glow
  - Item art: emoji or colored abstract art area

Featured deal:
  - Large banner card at top
  - "LIMITED TIME" red badge
  - Countdown timer
  - Discounted price with strikethrough original
```

---

## STEP 10 — GLOBAL MICRO-INTERACTIONS

Apply these to ALL pages:

### Button press effect (Duolingo-style) — apply to ALL buttons:
```css
/* Add to every button in the app */
transition: transform 0.1s, box-shadow 0.1s;
&:hover  { transform: translateY(-2px); }
&:active { transform: translateY(3px); box-shadow: 0 1px 0 [shadow-color]; }
```

### XP Popup:
When student completes anything (quest, answer, daily check-in), show floating "+10 XP" text using `.xp-popup` CSS class that floats upward and fades.

### Correct/Wrong feedback:
On quiz answers:
- Correct: `.animate-correct` class — green flash, XP popup
- Wrong: `.animate-wrong` class — red shake on question card, heart loses animation

### Page transitions:
- Route changes: fade in `opacity 0 → 1` over 200ms
- Cards entering viewport: stagger-in from bottom (translateY(20px) → 0)

### Notification badge:
Bell icon in nav — red dot badge when new quests available

---

## STEP 11 — TYPOGRAPHY ENFORCEMENT

Find and replace ALL occurrences of these fonts:
- Remove: `font-family: monospace` — replace with `font-family: 'Oswald'` for numbers/stats
- Remove: `font-family: system-ui` — replace with `font-family: 'Nunito'`
- Remove: Any `Inter`, `Roboto`, `Arial` references

Apply font rules:
```
Fredoka One → all h1, h2, h3, card titles, section headers, page titles, game names
Nunito → all body text, descriptions, labels, nav links, button text  
Oswald → all numbers (XP, scores, timers, stats, rankings), HUD elements, stat labels
```

---

## STEP 12 — COMPONENT FILE STRUCTURE TO CREATE

Create these files if they don't exist:

```
/components/game/
  GameHUD.tsx          — fixed top bar with HP/timer/score
  XPBar.tsx            — reusable XP progress bar
  GameCard.tsx         — subject/game card with rarity system
  LessonNode.tsx       — skill tree circle node
  StreakBadge.tsx      — orange streak counter
  ElixirBar.tsx        — 10-gem elixir/energy bar
  QuestCard.tsx        — quest/mission card
  AnswerButton.tsx     — quiz answer button with correct/wrong states
  AchievementBadge.tsx — circular achievement badge
  Leaderboard.tsx      — full leaderboard with podium
  XPPopup.tsx          — floating XP animation overlay
  LevelUpModal.tsx     — level up celebration overlay
  StatBar.tsx          — HP/XP/MP bar for character stats

/components/layout/
  GameNav.tsx          — updated navigation with all 7 links
  PageWrapper.tsx      — wraps pages with arena background + fade transition
```

---

## VERIFICATION CHECKLIST

After making changes, verify each item:

- [ ] Background is `#0D0D1A` everywhere — no white or light grey backgrounds
- [ ] Nav has all 7 links: HOME, GAMES, QUESTS, SUBJECTS, BATTLE, LEADERBOARD, SHOP
- [ ] Fonts are Fredoka One / Nunito / Oswald — NOT Inter, Roboto, monospace, or system fonts
- [ ] All buttons have hard drop shadow AND press-down effect on click
- [ ] XP bars are at least 12px tall with gradient fill
- [ ] Leaderboard has gold/silver/bronze row treatments
- [ ] Player's own leaderboard row is purple highlighted
- [ ] Game cards have glowing colored borders (not plain grey borders)
- [ ] At least one animation plays on every user interaction
- [ ] QUESTS page exists at `/quests`
- [ ] BATTLE page exists at `/battle`
- [ ] LEADERBOARD page exists at `/leaderboard`
- [ ] SHOP page exists at `/shop`
- [ ] Streak badge uses orange gradient (not plain text)
- [ ] XP popup animation fires when earning XP

---

## PRIORITY ORDER

If you need to do this in multiple passes, prioritize in this order:

**Pass 1 — Foundation (highest impact):**
1. Setup fonts (Fredoka One, Nunito, Oswald)
2. Fix navigation (add missing pages + restyle)
3. Fix all button styles (hard shadows + press effect)

**Pass 2 — Core pages:**
4. Redesign home page hero banner
5. Fix leaderboard component
6. Fix XP bars everywhere
7. Fix game cards (glowing borders, rarity)

**Pass 3 — New pages:**
8. Create `/quests` page
9. Create `/battle` page
10. Create `/leaderboard` page
11. Create `/shop` page

**Pass 4 — Polish:**
12. Add micro-interactions and animations
13. Add XP popup system
14. Add page transition effects

---

## MODEL & SETTINGS FOR CLAUDE CODE

Use these settings when running Claude Code for this task:

**Model:** `claude-opus-4-5` (highest quality for complex UI work)
**Extended thinking:** ON — this is a multi-file, multi-page redesign that benefits from planning
**Max turns:** Set high (20+) — you want it to complete full passes without stopping

**Recommended Claude Code commands to run in sequence:**

```bash
# Session 1 — Read assets and fix foundation
"Read DESIGN_BRIEF.md, design-tokens.json, game-components.css, and tailwind.game.config.js. 
Then fix the navigation component to include all 7 nav items (HOME, GAMES, QUESTS, SUBJECTS, BATTLE, LEADERBOARD, SHOP) and apply the game styling from the brief. Then fix all fonts across the entire app to use Fredoka One, Nunito, and Oswald."

# Session 2 — Fix existing pages  
"Using the design brief and game-components.css, redesign the home page dashboard. Fix the welcome banner, quest cards, leaderboard rows, and XP bars to match the gamified specs in DESIGN_BRIEF.md."

# Session 3 — Create new pages
"Create these 4 new pages following DESIGN_BRIEF.md specs exactly: /quests, /battle, /leaderboard, /shop. Each page must have the game nav, dark arena background, and all components from game-components.css."

# Session 4 — Polish
"Add the button press animations, XP popup component, correct/wrong answer animations, and page transition effects described in DESIGN_BRIEF.md section 10."
```

---

## WHAT SUCCESS LOOKS LIKE

The final result should look like a screenshot you'd find on the Google Play Store for a mobile game. A student opening this app should feel the same excitement as opening Clash Royale or Duolingo. The UI should feel alive — things glow, buttons push down when clicked, XP floats up when earned, streaks bounce when tapped.

If any screen could be mistaken for a SaaS dashboard, a school portal, or a generic dark-mode website — it needs more work.
