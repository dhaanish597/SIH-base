# Quest Academy — CLAUDE.md

Project context for Claude Code working on this repo.

## Project

**Quest Academy** (codename `SIH-base`) — a school-exclusive gamified learning
platform for grades 6–12, built for Smart India Hackathon. Mid-migration from
Vite + SQLite to Next.js + Postgres + Prisma. Frontend stays React + Vite for
the live student-facing app while the migration completes.

## Stack

- **Frontend:** React 18, TypeScript, Vite, React Router, Tailwind CSS
- **Backend:** Express (Node), Socket.io, Prisma ORM
- **Database:** Local SQLite (legacy) → Supabase Postgres (target)
- **Games:** Phaser.js (HTML canvas) wrapped in React HUDs
- **AI:** Anthropic SDK (chatbot, recommendations, feedback engine)

## Design system — "Dark Arcade Academy"

Source of truth: [`gamified-learning-platform-ui-prompt.md`](./gamified-learning-platform-ui-prompt.md)

The whole app is dark-mode-only. Cyberpunk-meets-fantasy-RPG aesthetic.
Students compare it to Fortnite/Minecraft, not Google Classroom.

**Tokens live in two places (kept in sync):**
- CSS custom properties — [`src/index.css`](src/index.css) under `:root`
- Tailwind theme — [`tailwind.config.js`](tailwind.config.js) `theme.extend`

**Core colors:**
- `--color-bg-base` `#0A0A14` (near-black navy, main bg)
- `--color-primary` `#7C3AED` (violet, brand)
- `--color-secondary` `#06B6D4` (cyan, tech accents)
- `--color-accent-gold` `#F59E0B` (coins, rewards)
- `--color-accent-green` `#10B981` (correct answers)
- `--color-accent-red` `#EF4444` (wrong answers)

**Typography:**
- Display / game titles → **Orbitron** (loaded via Google Fonts in [`index.html`](index.html))
- UI / body → **Inter**
- Numbers / timers / scores → **JetBrains Mono**

**Reusable component classes (in `src/index.css`):**
- `.arcade-bg` — base dark background with grid + violet bloom
- `.arcade-particles` — drifting twinkle field overlay
- `.arcade-card` — surface card matching spec exactly
- `.arcade-btn-primary` / `.arcade-btn-secondary` — buttons per spec
- `.arcade-input` — dark form field
- `.arcade-xp-track` / `.arcade-xp-fill` — animated shimmer XP bar
- `.arcade-chip` (+ `-gold` / `-cyan` / `-red`) — stat chips
- `.role-tab` — pill tabs for the Login screen
- `.arcade-title` — Orbitron gradient text for the brand wordmark

## Implementation rules

- **Dark mode only.** No light theme. The dark aesthetic IS the brand.
- **Mobile first.** Build every screen mobile-first; desktop is enhancement.
- **No lorem ipsum.** Use real-feeling sample names/subjects/questions during dev.
- **Game canvas isolated.** Phaser runs in its own canvas; HUD is a React layer on top.
- **Achievement system is global.** A single singleton service drives all toast popups.
- **Reuse the result screen component** across all 5 games — only stats/copy change.
- **Typography first in reviews.** If type looks wrong, the screen looks wrong.

## Navigation map

```
LOGIN
├── STUDENT     → Dashboard → Game Vault → 5 games → Subjects → Leaderboard → Profile → Avatar Shop
├── TEACHER     → Dashboard → Classes → Assign Game (3-step) → Question Bank → Reports
├── SCHOOL      → Dashboard → Students → Teachers → Classes → Reports → Settings
└── ADMIN       → Platform Dashboard → Schools → Content → Moderation → Analytics → Config
```

## Migration status (UI redesign)

Tracking the full Dark Arcade Academy redesign. Multi-pass project.

### ✅ Pass 1 — Foundation + Login + Student Dashboard (2026-04-28)
- Loaded Orbitron / Inter / JetBrains Mono in `index.html`.
- Updated `tailwind.config.js`: `font-display` and `font-hud` now point to Orbitron.
- Wrote full Dark Arcade Academy token system + reusable component classes in
  `src/index.css` (CSS variables, `.arcade-*` primitives, particle/grid bg, shimmer XP bar).
- Rewrote [`src/components/Auth/Login.tsx`](src/components/Auth/Login.tsx) to match Screen 1:
  - 4-role tab switcher (Student / Teacher / School / Admin) with role-specific fields.
  - Dark + violet bloom background, drifting particle field.
  - Shake-on-error animation, role-aware error states.
  - Offline / 5xx fallback preserved (demo login still works).
- Rewrote [`src/components/Student/Dashboard.tsx`](src/components/Student/Dashboard.tsx) to match Screen 2:
  - Hero with avatar tile, level badge, XP bar, streak/coins/rank chips.
  - 3-column grid: Today's Quests · Assigned by Teacher · Continue Playing.
  - Hexagonal SVG Skill Map radar (6 subjects, color-coded mastery).
  - Leaderboard preview with podium colors and "you" highlighting.

### ✅ Pass 1b — Handoff Design Implementation (2026-04-30)
Source: `Gamified-learning-platform-1-handoff.zip` (Clash Royale × Duolingo design, teens 13-17).

**Static prototype** — complete working design canvas at [`public/quest-academy/index.html`](public/quest-academy/index.html)
  - 7 fully interactive pages: Home (Dir A + B), Games, Quests, Battle, Leaderboard, Shop, Subjects
  - Mobile companion views (Home, Quiz, Quests)
  - Level-up modal, HUD close-up artboards
  - Accessible at `/quest-academy/` when running the dev server

**Next.js app updated** to match the Clash Royale × Duolingo aesthetic:
- [`app/login/page.tsx`](app/login/page.tsx) — Arena-bg, octagon shield logo, Duolingo hard-drop role tabs,
  `.arena-bg` scanlines backdrop, `.shake` error animation, `▶ ENTER THE ARENA` CTA.
- [`app/(authed)/layout.tsx`](app/(authed)/layout.tsx) — Student top nav rebuilt as `GameNav` with
  HUD strip (🔥 streak pill, 🪙 coins pill, level + segmented XP capsule), emoji nav icons,
  mobile bottom nav matching handoff.
- [`app/(authed)/student/page.tsx`](app/(authed)/student/page.tsx) — Full Direction A dashboard:
  - Hero banner: octagon avatar frame, scanlines, level badge, violet XP bar, pill stats
  - Today's Quests: 2×2 grid with colored left-border quest cards + progress bars
  - From Mentor card + Continue Playing section (real API → demo fallback)
  - Hexagonal SVG radar skill map + colored per-subject mastery bars
  - Sidebar: leaderboard rows with podium gradients, Daily Chest, Achievement grid
- [`app/globals.css`](app/globals.css) — Added `qa-dashboard-grid`, `qa-quest-grid`, `qa-two-col`,
  `qa-skill-grid` responsive layout helpers; `qa-desktop-nav` / `qa-mobile-nav` show/hide classes.

**Design tokens** — already in `globals.css` and matched to handoff `tokens.css`:
  - `--violet #6B4BFF`, `--cyan #18D6FF`, `--gold #FFC93C`, arena surfaces `--bg-deep/#07070F`
  - Fonts: Bowlby One (display), Nunito (body), Oswald (HUD), JetBrains Mono (scores)
  - Duolingo hard-drop shadows: `--hd-violet`, `--hd-cyan`, `--hd-gold` etc.
  - CSS classes: `.arena-bg`, `.card`, `.btn-primary`, `.pill`, `.xp-bar`, `.pframe`, `.lb-row`

### ✅ Pass 2 — Topic Roadmap & Learning Modules (2026-05-03)
Complete per-topic 5-module learning system built on top of the existing platform.

**New DB models** (tables created directly in Supabase):
- `topic_progress` — per-student per-topic mastery scores (learnScore, playScore, practiceScore, quizScore, masteryScore, nextReviewAt)
- `content` — LEARN/PLAY/PRACTICE payloads stored as JSON per topic
- `topic_prerequisites` — prerequisite graph

**New Express routes** (`server/routes/learn.js`):
- `POST /api/learn/progress` — upserts TopicProgress, EWMA mastery, XP + streak
- `GET /api/learn/subjects` — subjects + per-student avg mastery
- `GET /api/learn/topics/:subjectId` — chapters + topics + progress + lock state
- `GET /api/learn/review-due` — spaced-repetition overdue topics
- `GET /api/learn/content/:topicId/:type` — serves content payload

**New lib files**:
- `lib/reviewEngine.ts` — `computeMastery` (EWMA, α=0.3), `getNextReviewDate`, `isWeak`
- `lib/prerequisites.ts` — `getLockedTopics` (iterative lock propagation)

**New pages** (all under `app/(authed)/student/learn/`):
- `/student/learn` — subject roadmap grid with mastery rings + due-for-review chips
- `/student/learn/[subjectId]` — topic roadmap with chapter sections, prerequisite locks, progress rings
- `/student/learn/[subjectId]/[topicId]/learn` — slide stepper (text/diagram/interactive)
- `/student/learn/[subjectId]/[topicId]/quiz` — MCQ quiz from existing Question model
- `/student/learn/[subjectId]/[topicId]/practice` — step-reveal worked examples
- `/student/learn/[subjectId]/[topicId]/play` — 3 in-roadmap games
- `/student/learn/[subjectId]/[topicId]/review` — mastery ring + score bars + weak areas

**Routing change**: `/student/subjects` permanently redirected to `/student/learn` (old page deleted).

**New components**:
- `app/components/ui/MasteryRing.tsx` — SVG circular progress ring
- `app/components/roadmap/SubjectNode.tsx`, `TopicNode.tsx`, `RoadmapPath.tsx`
- `app/components/slides/TextSlide.tsx`, `DiagramSlide.tsx`, `InteractiveSlide.tsx`
- `app/components/interactive/DraggableTriangle.tsx` — drag vertices, live trig readout
- `app/components/modules/LearnStepper.tsx`, `SlideRenderer.tsx`, `QuizRunner.tsx`, `PracticeExamples.tsx`, `ReviewDashboard.tsx`
- `app/components/games/FormulaMatchGame.tsx`, `EquationBalanceGame.tsx`, `TriangleRatioGame.tsx`

**Seed script**: `prisma/seed-class10-math.ts` — Class 10 NCERT Math (14 chapters, ~47 topics, prerequisites, content payloads, ~235 MCQ questions).
Run with: `npx ts-node prisma/seed-class10-math.ts`

### ⏳ Pass 3 — Game Vault Redesign (planned)
- Screen 3: Games Hub (PS5-library feel with featured game + 2-col grid + locked cards).

### ⏳ Pass 3 — Game UIs (planned)
- Screens 4–8: Math Dungeon, Quiz Battle (lobby + match + results), Science Lab Escape, History Conquest, Word Forge.
- Shared result-screen component first.

### ⏳ Pass 4 — Profile + Leaderboard + Avatar Shop (planned)
- Screens 10–11.

### ⏳ Pass 5 — Teacher flow (planned)
- Screens T1–T4.

### ⏳ Pass 6 — School + Platform admin (planned)
- Screens S1, S2, A1.

### ⏳ Pass 7 — Global polish (planned)
- Achievement toast singleton, XP-gain float, level-up full-screen moment, streak flame
  animation, page transitions, empty states, offline banner.

## TODO / known follow-ups

- Skill Map currently uses hardcoded mastery values (`[78, 64, 82, 55, 70, 45]`).
  Wire to real per-subject mastery from `progress` once the analytics endpoint exposes it.
- Leaderboard preview uses seed data with the real user injected. Hook to
  `/api/leaderboard?scope=school` once available.
- The `coins` field is derived from `totalPoints / 5` because `useUserStats` doesn't
  expose coins yet — add it to the stats schema.
- Splash/loading screen (Screen 0) not yet implemented; current loader is a spinner.
