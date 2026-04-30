# GAMIFIED LEARNING PLATFORM — COMPLETE UI/UX REDESIGN PROMPT
# For: Anti-Gravity / Development Team
# Purpose: Full flow, layout specs, and visual direction for redesign

---

## DESIGN PHILOSOPHY & VISUAL IDENTITY

This is NOT a SaaS dashboard. This is a game world that happens to teach things.
Every screen must feel like the student stepped inside a video game.
Students aged 11–18 are the primary users. They are comparing this to Fortnite,
Minecraft, and YouTube — not to Google Classroom.

### Visual Direction: "DARK ARCADE ACADEMY"

**Aesthetic:** Cyberpunk-meets-fantasy RPG. Think Hogwarts if it were built in 2087.
Dark backgrounds. Glowing neons. Particle effects. Achievement popups.
Typography that feels carved or powered. Motion that feels alive.

### Color System (CSS Tokens)

```
--color-bg-base:        #0A0A14   (near-black deep navy — main background)
--color-bg-surface:     #12121F   (slightly lighter — cards, panels)
--color-bg-elevated:    #1A1A2E   (modals, dropdowns)
--color-bg-overlay:     #16213E   (sidebars, nav)

--color-primary:        #7C3AED   (violet — primary brand, XP bars)
--color-primary-glow:   #A855F7   (lighter violet — hover, glow states)
--color-secondary:      #06B6D4   (cyan — secondary actions, tech feel)
--color-secondary-glow: #22D3EE   (lighter cyan — accents)
--color-accent-gold:    #F59E0B   (amber/gold — coins, rewards, streaks)
--color-accent-green:   #10B981   (emerald — correct answers, success)
--color-accent-red:     #EF4444   (red — wrong answers, health loss)
--color-accent-pink:    #EC4899   (pink — badges, special events)

--color-text-primary:   #F1F5F9   (near white — headings, primary text)
--color-text-secondary: #94A3B8   (slate — body text, labels)
--color-text-muted:     #475569   (dark slate — placeholder, disabled)

--color-border:         rgba(124, 58, 237, 0.2)   (subtle purple border)
--color-border-active:  rgba(124, 58, 237, 0.6)   (active/focus border)
--color-glow-primary:   0 0 20px rgba(124, 58, 237, 0.4)
--color-glow-secondary: 0 0 20px rgba(6, 182, 212, 0.4)
--color-glow-gold:      0 0 20px rgba(245, 158, 11, 0.5)
```

### Typography

```
Display / Game Title:   "Orbitron" (Google Fonts) — Level titles, game names, scores
Heading / UI:          "Inter" or "Plus Jakarta Sans" — Dashboards, labels, nav
Body / Reading:        "Inter" — Descriptions, paragraphs
Accent / Stats:        "JetBrains Mono" — Numbers, scores, timers, code
```

Font Size Scale:
```
--text-xs:   12px
--text-sm:   14px
--text-base: 16px
--text-lg:   18px
--text-xl:   20px
--text-2xl:  24px
--text-3xl:  30px
--text-4xl:  36px
--text-5xl:  48px
--text-game: 64px  (for game scores, big moments)
```

### Background Texture

Every main background uses:
- Base: `#0A0A14` solid
- Layer 1: Subtle animated star-field or floating particle dots (CSS/canvas, very low opacity 5–8%)
- Layer 2: Radial gradient bloom from the primary interaction point
  (e.g., center-top violet glow on login, left-side cyan on game pages)
- Layer 3: Subtle grid or circuit pattern overlay at 3% opacity using SVG background

### Component Rules

**Cards:**
- Background: `--color-bg-surface`
- Border: 1px solid `--color-border`
- Border-radius: 16px
- Box-shadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`
- On hover: border brightens to `--color-border-active`, subtle glow appears

**Buttons (Primary):**
- Background: linear-gradient(135deg, #7C3AED, #A855F7)
- Box-shadow: `0 0 16px rgba(124, 58, 237, 0.5)`
- Border-radius: 10px
- Font: Orbitron, 14px, letter-spacing 0.05em
- On hover: scale(1.03), glow intensifies
- On press: scale(0.97)

**Buttons (Secondary):**
- Background: transparent
- Border: 1.5px solid `--color-secondary`
- Color: `--color-secondary`
- Box-shadow: `0 0 12px rgba(6, 182, 212, 0.3)`

**XP / Progress Bars:**
- Track: `rgba(255,255,255,0.08)`
- Fill: linear-gradient(90deg, #7C3AED, #06B6D4)
- Animated shimmer running left to right continuously
- Glow on the fill edge

**Achievement / Toast Popups:**
- Slide in from top-right
- Gold border, dark background
- Icon + title + description
- Auto-dismiss after 3.5s with progress indicator
- "LEVEL UP!" popup: full screen flash moment — once per session max

---

## APPLICATION ENTRY POINT

### SCREEN 0: SPLASH / LOADING SCREEN

**Both mobile and web.**

Layout:
```
[Full screen dark background with animated particles]

                    [CENTER]
          [Platform Logo — glowing, animated]
         "QUEST ACADEMY"  ← Orbitron font, gradient text
      "Learn. Battle. Conquer."  ← subtitle, --text-secondary
                    
              [Loading bar — thin, glowing]
           [Loading message cycling:]
              "Summoning your quest..."
              "Calibrating the dungeon..."
              "Loading your destiny..."
```

Animation: Logo pulses gently. Particles drift upward. Loading bar fills with
violet-to-cyan gradient. Fade to Login screen.

---

### SCREEN 1: LOGIN / ENTRY SCREEN

**The ONLY public-facing screen. No sign-up option here.**

Layout (Web — centered, max-width 440px, vertically centered):
```
[Full bleed background: dark + radial violet bloom top-left]

┌──────────────────────────────────┐
│  [Logo — small, top center]      │
│  QUEST ACADEMY                   │
│  "Your school's game world"      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ SELECT YOUR ROLE           │  │  ← 4 role tabs, pill style
│  │ [Student] [Teacher]        │  │
│  │ [School]  [Admin]          │  │
│  └────────────────────────────┘  │
│                                  │
│  ── STUDENT LOGIN ──             │
│                                  │
│  [School Code field]             │
│  [Student ID field]              │
│  [PIN field — masked]            │
│                                  │
│  [LOGIN BUTTON — full width]     │
│                                  │
│  "Forgot PIN? Ask your teacher"  │  ← text only, no self-serve
│                                  │
│  ─────────────────────────────   │
│  "Don't have an account?         │
│   Contact your school admin."    │
└──────────────────────────────────┘
```

Role Tab Switch behavior:
- Student: School Code + Student ID + PIN
- Teacher: Email + Password
- School Admin: School Code + Admin Email + Password
- Platform Admin: Email + Password + 2FA code field appears

Mobile version: Same layout, full-screen. Keyboard pushes form up.
Add subtle floating particles in background.

**Validation States:**
- Wrong credentials: Card shakes animation + red border on fields + "Invalid credentials" below button
- School code not found: Inline error "School not found. Check your code."
- Account locked: "Too many attempts. Contact your teacher." in red

---

## STUDENT FLOW (Primary User)

---

### SCREEN 2: STUDENT HOME / DASHBOARD

**This is the most important screen. Make it feel like a game hub.**

Layout (Web):
```
┌─────────────────────────────────────────────────────────────────┐
│ TOP NAV BAR (sticky, 64px tall, dark bg + blur backdrop)        │
│ [Logo]  [Home] [Games] [Subjects] [Leaderboard]   [🔔][Avatar] │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ HERO SECTION (full width, 280px tall)                            │
│                                                                  │
│  [Left: Student Avatar — large, animated idle pose]             │
│  [Right:]                                                        │
│   "Welcome back, ARJUN ⚔️"  ← Orbitron, white                  │
│   Level 14 Scholar                                               │
│   [XP Bar: ████████░░ 3,240 / 4,000 XP]  ← animated shimmer   │
│   [🔥 12 Day Streak]  [💰 840 Coins]  [🏆 Rank #3 in school]  │
│                                                                  │
│  [Background: subject-colored gradient + particle burst]        │
└──────────────────────────────────────────────────────────────────┘

3-column grid below hero:

┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ TODAY'S QUESTS   │ │ ASSIGNED BY      │ │ CONTINUE PLAYING     │
│                  │ │ TEACHER          │ │                      │
│ ☐ Win 1 quiz     │ │ [Math Dungeon]   │ │ [Math Dungeon]       │
│   battle         │ │  Ch.3 - Algebra  │ │  Ch.2, Room 4/10    │
│                  │ │  Due: Tomorrow   │ │  [CONTINUE →]        │
│ ☐ Answer 10 math │ │  [PLAY NOW]      │ │                      │
│   problems       │ │                  │ │ [Quiz Battle]        │
│                  │ │ [Science Escape] │ │  Last score: 780pts  │
│ ✅ Log in today  │ │  Chemistry Lab   │ │  [PLAY AGAIN →]      │
│                  │ │  Due: Friday     │ │                      │
│ [Weekly Quest]   │ │  [PLAY NOW]      │ │                      │
│ Complete 3 games │ │                  │ │                      │
│ [████░░░ 2/3]   │ │                  │ │                      │
└──────────────────┘ └──────────────────┘ └──────────────────────┘

SUBJECT MASTERY RADAR (full width section):
┌──────────────────────────────────────────────────────────────────┐
│ YOUR SKILL MAP                               [View Details →]    │
│                                                                  │
│  [Hexagonal radar chart — 6 subjects: Math, Science, English,   │
│   History, Geography, Coding]                                    │
│  Each subject has a colored filled area showing mastery %       │
│  Tooltip on hover shows: "Algebra: 78% mastered"                │
└──────────────────────────────────────────────────────────────────┘

LEADERBOARD PREVIEW (school-only):
┌──────────────────────────────────────────────────────────────────┐
│ 🏆 THIS WEEK'S TOP PLAYERS — YOUR SCHOOL       [Full Board →]   │
│                                                                  │
│ #1  [Avatar] Priya S.       4,820 XP  ████████████             │
│ #2  [Avatar] Rahul M.       4,210 XP  ███████████              │
│ #3  [Avatar] ARJUN (YOU)    3,240 XP  ████████  ← highlighted  │
│ #4  [Avatar] Divya K.       2,980 XP  ███████                  │
│ #5  [Avatar] Kiran T.       2,750 XP  ██████                   │
└──────────────────────────────────────────────────────────────────┘
```

Mobile Layout (single column):
- Hero section compressed: avatar left, stats right, XP bar full width below
- Today's Quests card
- Assigned by Teacher (horizontal scroll cards)
- Continue Playing (horizontal scroll cards)
- Skill Map (smaller, tap to expand)
- Leaderboard preview (5 rows)

Bottom Navigation (mobile, 5 tabs):
```
[🏠 Home] [🎮 Games] [📚 Subjects] [🏆 Ranks] [👤 Profile]
```

---

### SCREEN 3: GAMES HUB

**The game selection screen. Should feel like a PS5 game library.**

Layout:
```
┌────────────────────────────────────────────────────────────────┐
│ GAME VAULT                                    [🔍 Search]      │
│ "Choose your battlefield"                                      │
└────────────────────────────────────────────────────────────────┘

Filter Bar:
[All] [Math] [Science] [English] [History] [Coding]  [Solo] [Multiplayer]

FEATURED GAME (large hero card, 480px wide on web):
┌──────────────────────────────────────────────────────────────┐
│  [Full-bleed illustrated game art — Math Dungeon]            │
│                                                              │
│  MATH DUNGEON              ⭐⭐⭐⭐⭐  4.8              │
│  "Solve equations, defeat monsters"                          │
│  Subjects: Algebra, Geometry, Arithmetic                     │
│  [👤 Solo] [👥 Multiplayer]  Grade 6–12                    │
│                                                              │
│  Your Progress: Chapter 3/10  [████░░░░░]                  │
│  Best Score: 2,840 pts                                       │
│                                                              │
│  [PLAY SOLO]          [FIND OPPONENT]                        │
└──────────────────────────────────────────────────────────────┘

GAME GRID (2 columns on web, 1 on mobile):

┌───────────────────────┐  ┌───────────────────────┐
│ [Game Art]            │  │ [Game Art]            │
│ QUIZ BATTLE           │  │ WORD FORGE            │
│ ⚡ Multiplayer        │  │ 📖 Solo               │
│ All Subjects          │  │ English & Grammar     │
│ 2–30 Players          │  │ Vocab & Writing       │
│ [ENTER LOBBY]         │  │ [PLAY]                │
└───────────────────────┘  └───────────────────────┘

┌───────────────────────┐  ┌───────────────────────┐
│ [Game Art]            │  │ [Game Art]            │
│ SCIENCE LAB ESCAPE    │  │ HISTORY CONQUEST      │
│ 🧪 Solo + Co-op       │  │ 🗺️ Solo + Multiplayer │
│ Chemistry/Bio/Physics │  │ History & Geography   │
│ [PLAY]                │  │ [PLAY]                │
└───────────────────────┘  └───────────────────────┘

LOCKED GAME (example — unlocks at Level 20):
┌───────────────────────┐
│ [Blurred Game Art]    │
│ 🔒 CODE WARS          │
│ Unlocks at Level 20   │
│ You're Level 14       │
│ [███████░░░ 6 more]  │
└───────────────────────┘
```

---

### SCREEN 4: GAME — MATH DUNGEON (In-Game UI)

**Full-screen game. Phaser.js canvas fills the screen.**

```
┌────────────────────────────────────────────────────────────────┐
│ [❤️❤️❤️]  Room 4/10   Chapter 2: Algebra   [⏸ Pause]   Score: 1,240 │
└────────────────────────────────────────────────────────────────┘

                    [PHASER.JS GAME CANVAS]
    
    Dark dungeon corridor — pixelart or illustrated style
    
    [Hero character — left side, animated idle]
    
    [Enemy — right side, health bar above it]
    
    ┌──────────────────────────────────────────┐
    │  ⚔️  SOLVE TO ATTACK                     │
    │                                          │
    │   Simplify:  3x + 7 = 22                 │
    │                                          │
    │   x = [    ]  ← input field             │
    │                                          │
    │   [STRIKE!]  or  [USE HINT 🔮 -50pts]   │
    └──────────────────────────────────────────┘
    
    On CORRECT answer:
    → Hero attacks animation
    → "+120 XP" floats up
    → Enemy health decreases
    → "CORRECT! Nice work" toast
    
    On WRONG answer:
    → Enemy attacks hero animation  
    → Heart lost
    → "Not quite! x = 5. Here's why..." explanation card slides up
    → 3-second explanation, then next question
    
    BOSS ROOM (every 5 rooms):
    → Screen flashes red border
    → "⚠️ BOSS BATTLE" overlay
    → Larger enemy, multi-step problem
    → Epic background music shift (if audio enabled)
```

Pause Menu (overlay):
```
┌──────────────────┐
│     PAUSED       │
│                  │
│ [RESUME]         │
│ [RESTART ROOM]   │
│ [VIEW HINT]      │
│ [EXIT GAME]      │
└──────────────────┘
```

Game Over Screen:
```
[Full screen overlay]
  💀 DUNGEON FAILED
  You reached Room 4
  Score: 1,240 pts
  
  Best answer: Quadratic Equations ✅
  Needs work: Factoring ⚠️
  
  [TRY AGAIN]  [STUDY THIS TOPIC]  [HOME]
```

Victory Screen:
```
[Particles bursting, gold shimmer]
  ⚔️ DUNGEON CLEARED!
  Chapter 2 Complete!
  
  Score: 3,840 pts   ⭐⭐⭐
  XP Earned: +480
  Coins Earned: +120
  
  [New Badge Unlocked: "Algebra Slayer" 🏅]
  
  [NEXT CHAPTER]  [PLAY AGAIN]  [HOME]
```

---

### SCREEN 5: GAME — QUIZ BATTLE (Lobby + In-Game)

**LOBBY SCREEN:**
```
┌────────────────────────────────────────────────────────────────┐
│ ⚡ QUIZ BATTLE                                    [← BACK]     │
│                                                                │
│  [CREATE ROOM]           [JOIN ROOM]                          │
│                                                                │
│  OR                                                            │
│  [QUICK MATCH — Find opponent in my school]                   │
└────────────────────────────────────────────────────────────────┘

WAITING ROOM (after joining/creating):
┌────────────────────────────────────────────────────────────────┐
│ BATTLE ARENA                          Room Code: KX-7841       │
│ Subject: Mathematics  Grade 8  Topic: Fractions               │
│                                                                │
│ PLAYERS (3/10):                                                │
│  ✅ [Avatar] Arjun (YOU) — Ready                              │
│  ✅ [Avatar] Priya — Ready                                    │
│  ⌛ [Avatar] Rahul — Waiting...                               │
│  [Empty slot] ...                                              │
│  [Empty slot] ...                                              │
│                                                                │
│ Share code: KX-7841  [COPY]                                   │
│                                                                │
│ [READY UP ✅]                  [START GAME (host only)]       │
└────────────────────────────────────────────────────────────────┘
```

**IN-GAME (Quiz Battle):**
```
┌────────────────────────────────────────────────────────────────┐
│  Q 4/10    ⏱️ 12s     Arjun: 340  |  Priya: 420  |  Rahul: 280│
└────────────────────────────────────────────────────────────────┘

                        [Timer ring — circular, draining]
                              12 seconds left
                    
            What is the LCM of 12 and 18?
            
    ┌──────────────┐   ┌──────────────┐
    │    A. 36     │   │    B. 72     │
    └──────────────┘   └──────────────┘
    ┌──────────────┐   ┌──────────────┐
    │    C. 24     │   │   D. 216    │
    └──────────────┘   └──────────────┘
    
    [POWER-UPS: 🛡️ Shield x1   ❄️ Freeze x1   2️⃣x Double x0]
    (dimmed if not available)

On answer selected (before reveal):
→ Selected option highlights (your color)
→ See opponents' choices appear as colored dots on options
→ Correct revealed after all answer or timer ends

POWERUP USE:
→ "Arjun used ❄️ FREEZE on Priya!"
→ Priya's timer freezes for 3 seconds, visible on screen
```

**RESULTS SCREEN:**
```
┌────────────────────────────────────────────────────────────────┐
│  🏆 BATTLE RESULTS                                             │
│                                                                │
│  1st 🥇  Priya      8/10  correct  920 pts  (+350 XP)        │
│  2nd 🥈  Arjun (YOU) 7/10  correct  780 pts  (+280 XP)       │
│  3rd 🥉  Rahul      5/10  correct  520 pts  (+180 XP)        │
│                                                                │
│  Your best streak: 4 in a row ⚡                              │
│  Accuracy: 70%  •  Avg response: 6.2s                         │
│                                                                │
│  [REMATCH]          [NEW BATTLE]          [HOME]              │
└────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 6: GAME — SCIENCE LAB ESCAPE

**Entry / Lab Select:**
```
┌────────────────────────────────────────────────────────────────┐
│  🧪 SCIENCE LAB ESCAPE                           [← BACK]     │
│                                                                │
│  CHOOSE YOUR LAB:                                              │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ ⚗️           │  │ 🔬          │  │ ⚡           │        │
│  │ CHEMISTRY    │  │ BIOLOGY     │  │ PHYSICS      │        │
│  │ LAB          │  │ LAB         │  │ LAB          │        │
│  │ ⭐⭐⭐        │  │ ⭐⭐☆        │  │ 🔒 Lvl 12   │        │
│  │ [PLAY]       │  │ [PLAY]      │  │ [LOCKED]     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  [CO-OP MODE — Invite classmate]                              │
└────────────────────────────────────────────────────────────────┘
```

**In-Game (Escape Room):**
```
┌────────────────────────────────────────────────────────────────┐
│  🧪 Chemistry Lab    Puzzle 2/6    ⏱️ 12:34 remaining  [💡 x2]│
└────────────────────────────────────────────────────────────────┘

[Illustrated lab room scene — interactive objects highlighted
 with subtle glow when hoverable]

PUZZLE CARD (slides up from bottom when object clicked):
┌──────────────────────────────────────────────────────────────┐
│ BALANCE THE EQUATION                                         │
│                                                              │
│  _H₂ + _O₂ → _H₂O                                          │
│                                                              │
│  [  2  ] H₂  +  [  1  ] O₂  →  [  2  ] H₂O               │
│  (drag up/down to change coefficients)                       │
│                                                              │
│  [CHECK ANSWER]     [USE HINT 💡 — 1 remaining]            │
└──────────────────────────────────────────────────────────────┘

Progress strip at bottom:
[Puzzle 1 ✅] [Puzzle 2 ⌛] [Puzzle 3 🔒] [Puzzle 4 🔒] [Puzzle 5 🔒] [EXIT 🔒]
```

---

### SCREEN 7: GAME — HISTORY CONQUEST

```
┌────────────────────────────────────────────────────────────────┐
│  🗺️ Ancient India — 200 BCE     Your Territories: 4/18       │
│  Turn 3   [Arjun 🟣]  vs  [AI Governor 🔴]                   │
└────────────────────────────────────────────────────────────────┘

[SVG/Canvas map of India with colored regions]
[Your territories: filled violet]
[Enemy territories: filled red]
[Neutral territories: filled grey]

ATTACK PROMPT (sidebar, when territory selected):
┌──────────────────────────────────────────────────────┐
│ ATTACK: Magadha Empire                               │
│                                                      │
│ What dynasty ruled Magadha during Chandragupta's     │
│ reign?                                               │
│                                                      │
│ ○ Nanda Dynasty                                      │
│ ● Maurya Dynasty     ← selected                     │
│ ○ Gupta Dynasty                                      │
│ ○ Kushan Dynasty                                     │
│                                                      │
│ [ATTACK! ⚔️]                                        │
└──────────────────────────────────────────────────────┘

On correct: Territory turns your color, conquest animation plays
On wrong: AI takes the turn, advances one territory
```

---

### SCREEN 8: WORD FORGE

```
┌────────────────────────────────────────────────────────────────┐
│  📖 WORD FORGE        Grade 9 English   XP: +40 per correct   │
│  [DEFINE IT] [FILL THE FORGE] [GRAMMAR HAMMER] [STORY SPARK]  │
└────────────────────────────────────────────────────────────────┘

MODE: GRAMMAR HAMMER
┌──────────────────────────────────────────────────────────────┐
│  🔨 Spot and fix the error!                    ⏱️ 20s       │
│                                                              │
│  "Neither the students nor the teacher         │
│   were present for the assembly."              │
│                                                              │
│  Tap the error, then type the correction:                    │
│  [were] → [was]                                              │
│                                                              │
│  [HAMMER IT ✅]                                              │
└──────────────────────────────────────────────────────────────┘

FORGE PROGRESS (visual — right sidebar on web, below on mobile):
┌──────────────────────┐
│  ⚒️ YOUR FORGE       │
│                      │
│  [Iron]   ██████    │  ← materials collected
│  [Steel]  ████      │
│  [Gold]   ██        │
│                      │
│  Craft when full:    │
│  [Legendary Sword 🗡️]│
│  [████████░░ 8/10]  │
└──────────────────────┘
```

---

### SCREEN 9: SUBJECTS PAGE

```
┌────────────────────────────────────────────────────────────────┐
│  📚 YOUR SUBJECTS                                              │
└────────────────────────────────────────────────────────────────┘

Subject cards — 3 column grid (2 on tablet, 1 on mobile):

┌─────────────────────────┐
│  ➕ MATHEMATICS         │
│  Grade 9                │
│  Mastery: 74%           │
│  [████████░░]           │
│                         │
│  Strong: Algebra ✅      │
│  Needs work: Geometry ⚠️│
│                         │
│  [PRACTICE] [PLAY GAMES]│
└─────────────────────────┘

Clicking a subject opens Subject Detail:
┌────────────────────────────────────────────────────────────────┐
│ ← MATHEMATICS                                                  │
│                                                                │
│ CHAPTER TREE (visual node map, top to bottom):                │
│                                                                │
│  [Ch.1 Number Systems ✅]                                      │
│           ↓                                                    │
│  [Ch.2 Algebra ✅]                                            │
│           ↓                                                    │
│  [Ch.3 Polynomials — In Progress 68%]                         │
│           ↓                                                    │
│  [Ch.4 Geometry 🔒]                                           │
│           ↓                                                    │
│  [Ch.5 Statistics 🔒]                                         │
│                                                                │
│ Click any chapter → shows topic list + games + mastery scores │
└────────────────────────────────────────────────────────────────┘
```

---

### SCREEN 10: LEADERBOARD

```
┌────────────────────────────────────────────────────────────────┐
│  🏆 LEADERBOARD           [This Week] [All Time] [By Subject] │
│  🏫 Your School Only                                          │
└────────────────────────────────────────────────────────────────┘

[Top 3 on podium display — animated, gold/silver/bronze glow]
     🥈              🥇              🥉
  [Avatar]         [Avatar]        [Avatar]
  Rahul M.         Priya S.       Kiran T.
  4,210 XP         4,820 XP       2,750 XP

[Rest of list — standard rows]

Rank  Player              XP      Games  Streak
  4   Divya K.          2,980    28     🔥 7
  5   Arun P.           2,720    22     🔥 3
  6   Meera S.          2,410    19     🔥 14
...
[YOU — #8]  Arjun (You)   2,240    18   🔥 12   ← sticky highlighted

[YOUR CLASS tab] [YOUR GRADE tab] [WHOLE SCHOOL tab]
```

---

### SCREEN 11: STUDENT PROFILE / AVATAR

```
┌────────────────────────────────────────────────────────────────┐
│  👤 PROFILE                                    [EDIT]         │
│                                                                │
│  [Large animated avatar — center]                             │
│  ARJUN KUMAR                                                   │
│  Level 14 Scholar  •  Grade 9  •  Section B                   │
│  Member since: June 2024                                       │
│                                                                │
│  STATS:                                                        │
│  XP: 3,240     Coins: 840     Games: 47     Badges: 12       │
│  Longest streak: 18 days   Current: 12 days 🔥               │
│                                                                │
│ ─────────────────────────────────────────────────────────── │
│  BADGES (horizontal scroll):                                   │
│  [🏅] [🏅] [🏅] [🏅] [🏅] [🏅] [🔒] [🔒] ...           │
│                                                                │
│ ─────────────────────────────────────────────────────────── │
│  RECENT ACTIVITY:                                              │
│  Math Dungeon — Ch.2 cleared  (+480 XP)  2 hours ago         │
│  Quiz Battle — Won vs Priya   (+280 XP)  Yesterday           │
│  Word Forge — 10 streak       (+200 XP)  Yesterday           │
└────────────────────────────────────────────────────────────────┘
```

**Avatar Shop (from profile):**
```
┌────────────────────────────────────────────────────────────────┐
│  🛒 AVATAR SHOP                   💰 You have: 840 coins      │
│                                                                │
│  [Outfits] [Weapons] [Backgrounds] [Effects] [Emotes]        │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ [Item]   │  │ [Item]   │  │ [Item]   │  │ [OWNED]  │     │
│  │ Knight   │  │ Wizard   │  │ Ninja    │  │ Default  │     │
│  │ Armor    │  │ Robe     │  │ Suit     │  │          │     │
│  │ 500 💰  │  │ 750 💰  │  │ 1200 💰 │  │ EQUIPPED │     │
│  │ [BUY]   │  │ [BUY]   │  │ 🔒 Lvl20 │  │          │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└────────────────────────────────────────────────────────────────┘
```

---

## TEACHER FLOW

---

### SCREEN T1: TEACHER DASHBOARD

```
┌────────────────────────────────────────────────────────────────┐
│ TOP NAV: [Logo] [Dashboard] [My Classes] [Assign] [Reports]   │
│          [Question Bank]                          [👤 Ms. Rao] │
└────────────────────────────────────────────────────────────────┘

HEADER:
"Good morning, Ms. Rao 👋"
"You have 3 classes active today"

4 STAT CARDS (top row):
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📚           │ │ 👥           │ │ 🎮           │ │ ⚠️           │
│ 4 Classes    │ │ 112 Students │ │ 47 Games     │ │ 8 Students   │
│              │ │ Active today:│ │ played today │ │ Inactive 7d  │
│              │ │ 89 (79%)     │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

CLASS OVERVIEW (table with visual indicators):
┌──────────────────────────────────────────────────────────────────┐
│ Class       Students  Avg XP    Engagement  Top Subject  Action  │
│ Grade 9A    28        2,840     ████░  89%   Math        [View]  │
│ Grade 9B    30        2,210     ███░░  74%   Science     [View]  │
│ Grade 10A   27        3,120     █████  96%   English     [View]  │
│ Grade 10B   27        1,980     ██░░░  61%   Math ⚠️     [View]  │
└──────────────────────────────────────────────────────────────────┘

[ASSIGN GAME button — prominent CTA]
[RECENT ACTIVITY feed — right side]
```

---

### SCREEN T2: ASSIGN GAME

**Step-by-step flow (3 steps):**

```
STEP 1: Choose Game
┌────────────────────────────────────────────────────────────────┐
│ ASSIGN A GAME  ●○○                                            │
│                                                                │
│ [Math Dungeon] [Quiz Battle] [Word Forge]                     │
│ [Science Escape] [History Conquest]                           │
│                                                                │
│ [MATH DUNGEON selected — card highlighted]                    │
│  Description: Students fight enemies by solving equations     │
│  Best for: Algebra, Geometry, Arithmetic                      │
└────────────────────────────────────────────────────────────────┘

STEP 2: Configure
┌────────────────────────────────────────────────────────────────┐
│ CONFIGURE ASSIGNMENT  ○●○                                     │
│                                                                │
│ Topic: [Algebra ▼]   Chapter: [Chapter 3 ▼]                  │
│ Difficulty: [Medium ▼]   Grade: [Grade 9 ▼]                  │
│                                                                │
│ Assign to: [Grade 9A ✅] [Grade 9B ☐] [Grade 10A ☐]         │
│                                                                │
│ Due date: [📅 Select date]                                    │
│                                                                │
│ Instructions (optional): [                              ]     │
└────────────────────────────────────────────────────────────────┘

STEP 3: Review & Assign
┌────────────────────────────────────────────────────────────────┐
│ REVIEW  ○○●                                                   │
│                                                                │
│ Game: Math Dungeon                                            │
│ Topic: Algebra → Chapter 3                                    │
│ Classes: Grade 9A (28 students)                               │
│ Due: Friday, May 2, 2025                                      │
│                                                                │
│ [← BACK]              [ASSIGN TO 28 STUDENTS ✅]             │
└────────────────────────────────────────────────────────────────┘
```

---

### SCREEN T3: CLASS DETAIL / STUDENT ANALYTICS

```
┌────────────────────────────────────────────────────────────────┐
│ ← GRADE 9A                                  [EXPORT PDF]      │
│                                                                │
│ SUBJECT PERFORMANCE HEATMAP:                                  │
│         Math   Science  English  History  Geography           │
│ Arjun    78%    82%      91%      65%      70%               │
│ Priya    95%    88%      76%      90%      85%               │
│ Rahul    45%⚠️  67%      58%⚠️   72%      61%               │
│ Divya    88%    91%      82%      77%      80%               │
│ ...                                                            │
│ [Color coded: green=80%+, yellow=60-79%, red=<60%]           │
│                                                                │
│ INDIVIDUAL STUDENT:                                           │
│ Click row → slide in side panel with full topic breakdown     │
└────────────────────────────────────────────────────────────────┘
```

---

### SCREEN T4: QUESTION BANK

```
┌────────────────────────────────────────────────────────────────┐
│ QUESTION BANK                              [+ ADD QUESTION]   │
│                                                                │
│ Filter: [Subject ▼] [Grade ▼] [Topic ▼] [Type ▼] [Search 🔍]│
│                                                                │
│ TABLE:                                                         │
│ #   Question           Subject  Grade  Type   Difficulty  ⚙️  │
│ 1   What is 3x+7=22?   Math     9      MCQ    ★★☆☆☆     [Edit]│
│ 2   Balance H₂+O₂→H₂O Science  8      Drag   ★★★☆☆    [Edit]│
│ ...                                                            │
│                                                                │
│ [Questions you added: 24]  [School bank: 1,840]              │
│ [Pending approval: 3 — shown with orange dot]                 │
└────────────────────────────────────────────────────────────────┘
```

---

## SCHOOL ADMIN FLOW

---

### SCREEN S1: SCHOOL ADMIN DASHBOARD

```
┌────────────────────────────────────────────────────────────────┐
│ NAV: [Overview] [Students] [Teachers] [Reports] [Settings]    │
│                                           🏫 Greenwood School  │
└────────────────────────────────────────────────────────────────┘

SCHOOL STATS (6 cards):
Active Students: 340   Teachers: 18   Classes: 22
Avg XP this week: 2,840   Engagement: 78%   Top Class: Grade 10A

CHARTS:
[Bar chart: XP earned per week — last 8 weeks]
[Pie: Subject distribution of games played]
[Line: Daily active students trend]

QUICK ACTIONS:
[+ Add Student]  [+ Add Teacher]  [Bulk Import CSV]  [View Reports]
```

---

### SCREEN S2: STUDENT MANAGEMENT

```
┌────────────────────────────────────────────────────────────────┐
│ STUDENTS (340)                    [+ Add] [Bulk Import CSV]   │
│                                                                │
│ Search: [🔍]  Filter: [Grade ▼] [Section ▼] [Status ▼]       │
│                                                                │
│ Name          ID        Grade   Section  Last Active  Status  │
│ Arjun Kumar   STU-001   9       A        Today        Active  │
│ Priya Sharma  STU-002   9       A        Today        Active  │
│ Rahul Gupta   STU-003   9       B        3 days ago  ⚠️ Away  │
│ ...                                                            │
│                                                                │
│ Click student → Full profile + reset PIN option               │
└────────────────────────────────────────────────────────────────┘
```

---

## PLATFORM ADMIN FLOW

---

### SCREEN A1: PLATFORM ADMIN DASHBOARD

```
┌────────────────────────────────────────────────────────────────┐
│ NAV: [Platform] [Schools] [Content] [Moderation] [Config]     │
│                                              🔧 Platform Admin  │
└────────────────────────────────────────────────────────────────┘

PLATFORM-WIDE STATS:
Schools: 24 active   Students: 8,420   Teachers: 312
DAU: 3,840   Games played today: 12,480   Questions answered: 94,200

[School health table — all schools, engagement, issues flagged]
[Moderation queue — pending teacher questions]
[System status panel — uptime, errors, active sockets]
```

---

## GLOBAL MICRO-INTERACTIONS & ANIMATIONS

Apply these consistently across ALL screens:

### Page Transitions
- Screen fade-in: 200ms ease-out
- Cards stagger in from bottom: 30ms delay between each
- Never hard-cut between screens

### Achievement Popup (global, any screen)
```
Slide in from top-right over 300ms
┌────────────────────────────────┐
│ 🏅 ACHIEVEMENT UNLOCKED!       │
│ "Algebra Slayer"               │
│ Solved 50 algebra problems     │
│ +200 XP  +50 coins             │
└────────────────────────────────┘
Auto-dismiss after 3.5s, progress bar at bottom
```

### XP Gain Float
- When XP earned: "+480 XP" floats up and fades, yellow text, 1s animation

### Level Up (full screen moment)
- Triggered once per session at most
- Full screen glow burst + "LEVEL UP! Scholar → Expert"
- Particle explosion, avatar grows briefly, sound effect

### Streak Animation
- On login if streak continues: flame emoji grows and bounces + "🔥 13 Day Streak!"

### Correct Answer
- Green flash on answer card + checkmark animation
- "+XP" float
- Sound: satisfying chime (if audio on)

### Wrong Answer
- Red shake animation on question card
- Explanation slides up
- Sound: soft error tone

---

## RESPONSIVE BREAKPOINTS

```
Mobile:   < 768px   (React Native or web mobile)
Tablet:   768–1024px
Desktop:  > 1024px

Mobile-specific:
- Bottom tab navigation (5 icons)
- Single column layouts
- Game canvas: full screen with floating HUD
- Sheets/drawers for secondary content

Desktop-specific:
- Top navigation bar
- Sidebar for teacher/admin dashboards
- Side-by-side panels
- Keyboard shortcuts in games
```

---

## EMPTY STATES & EDGE CASES

### No games assigned yet (student):
```
[Illustrated character looking at empty board]
"No quests yet!"
"Your teacher hasn't assigned any games yet."
"In the meantime, explore the Game Vault →"
[EXPLORE GAMES button]
```

### No students in class (teacher):
```
[Empty classroom illustration]
"Your class is empty"
"Add students via the School Admin portal,
 or share your class code: GR9A-2024"
```

### Offline (mobile):
```
[Banner at top: "You're offline — playing in offline mode"]
Show cached games only, disable multiplayer
"📶 Reconnect to sync your progress"
```

### Game loading:
```
[Game-themed loading screen]
"Entering the dungeon..."
[Animated progress bar]
[Fun loading tip: "Tip: Use hints wisely — they cost XP!"]
```

---

## NAVIGATION MAP (COMPLETE)

```
LOGIN
  ├── STUDENT ──────────────────────────────────────────────────┐
  │     │                                                         │
  │   HOME DASHBOARD                                             │
  │     ├── GAME VAULT (game selection)                          │
  │     │     ├── MATH DUNGEON ──► [In-Game] ──► [Results]      │
  │     │     ├── QUIZ BATTLE  ──► [Lobby] ──► [In-Game] ──► [Results]
  │     │     ├── WORD FORGE   ──► [In-Game] ──► [Results]      │
  │     │     ├── SCIENCE ESCAPE ──► [Lab Select] ──► [In-Game] │
  │     │     └── HISTORY CONQUEST ──► [Map] ──► [In-Game]      │
  │     ├── SUBJECTS                                             │
  │     │     └── SUBJECT DETAIL ──► [Chapter] ──► [Topic]      │
  │     ├── LEADERBOARD                                         │
  │     └── PROFILE ──► [Avatar Shop] ──► [Badges]             │
  │                                                               │
  ├── TEACHER ───────────────────────────────────────────────────┤
  │     │                                                         │
  │   TEACHER DASHBOARD                                          │
  │     ├── MY CLASSES ──► [Class Detail] ──► [Student Profile]  │
  │     ├── ASSIGN GAME (3-step wizard)                          │
  │     ├── QUESTION BANK ──► [Add/Edit Question]               │
  │     └── REPORTS ──► [Export PDF]                            │
  │                                                               │
  ├── SCHOOL ADMIN ──────────────────────────────────────────────┤
  │     │                                                         │
  │   SCHOOL DASHBOARD                                           │
  │     ├── STUDENTS ──► [Add] [Bulk Import] [Student Detail]   │
  │     ├── TEACHERS ──► [Add] [Teacher Detail]                 │
  │     ├── CLASSES ──► [Create] [Class Detail]                 │
  │     ├── REPORTS ──► [School Analytics]                      │
  │     └── SETTINGS ──► [Curriculum Map] [Billing]            │
  │                                                               │
  └── PLATFORM ADMIN ────────────────────────────────────────────┘
        │
      PLATFORM DASHBOARD
        ├── SCHOOLS ──► [School Detail] [Add School]
        ├── CONTENT ──► [Question Bank] [Game Config]
        ├── MODERATION ──► [Review Queue]
        ├── ANALYTICS ──► [Platform Reports]
        └── CONFIG ──► [Feature Flags] [System Settings]
```

---

## IMPLEMENTATION NOTES FOR DEVELOPERS

1. **Start with the Login screen and Student Dashboard.** These set the visual tone.
   Get them pixel-perfect before moving to other screens.

2. **Shared design token file first.** Create tokens.css or tokens.ts with all
   colors, fonts, spacing before writing a single component.

3. **Game canvas is isolated.** Phaser.js runs in its own canvas. The HUD overlay
   (lives, score, timer) is a React/RN layer on top of the canvas.

4. **Reuse game result screens.** All 5 games use the same result screen component —
   only the stats and copy change.

5. **Achievement system is global.** One singleton service handles all achievement
   popups across all screens.

6. **Mobile first.** Build every screen mobile-first. Desktop is an enhancement.

7. **Dark mode only.** This app does not have a light mode. The dark aesthetic
   IS the brand.

8. **No lorem ipsum.** Every screen must use real example data during development
   (student names, real subject names, real questions) to properly evaluate layouts.

9. **Typography first in reviews.** If the type looks wrong, the screen looks wrong.
   Check font, size, weight, letter-spacing on every screen before calling it done.

10. **The star rating system (1-3 stars) on game completion is a core mechanic.**
    Design it to feel rewarding even on 1-star outcomes.
```

---

*End of prompt. Feed this entire document to the development team or AI coding assistant.*
*Reference individual sections when working on specific screens.*
*The visual direction, color system, and navigation map are the three sections to implement first.*
