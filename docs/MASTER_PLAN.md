# Quest Academy — Master Plan
> Living document. Last updated: 2026-05-02

---

## Instructions for Claude (READ THIS FIRST)

This is the **single source of truth** for the Quest Academy project. Every time you work on this project:

1. **Before starting work** — Read this file to understand what's done, what's in progress, and what's next.
2. **After completing any feature or task** — Check off the relevant `[ ]` items by changing them to `[x]`, update the **Session Log** at the bottom with a one-line entry, and update the **Current State** section if the overall status changes.
3. **When the user requests a new feature** — Add it to the appropriate phase in the Feature Tracker before implementing it. Mark it `[ ]` if planned, `[~]` if in progress, `[x]` if done.
4. **Status key:**
   - `[x]` — Done and working
   - `[~]` — In progress / partially done
   - `[ ]` — Not started
   - `[!]` — Broken / needs fixing
   - `[?]` — Unclear / needs investigation

---

## Project Overview

**Quest Academy** — A school-exclusive gamified learning platform for grades 6–12.
Built for Smart India Hackathon. Intended to grow into a real startup post-hackathon.

**Goal:** Make learning feel like Fortnite × Duolingo. Students earn XP, level up, complete quests, and battle classmates. Teachers assign content, track progress, and flag struggling students. Schools see platform-wide engagement. Admins manage the whole SaaS.

**Stack:**
- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- Backend: Express 5 (Node.js), Socket.io
- Database: Supabase Postgres, Prisma ORM
- Games: Phaser.js (canvas) wrapped in React HUDs
- AI: Anthropic Claude SDK (tutor, hints, recommendations)
- Auth: Custom JWT (httpOnly cookies) + Prisma refresh tokens

**Navigation:**
```
LOGIN
├── STUDENT     → Dashboard → Game Vault → 5 games → Subjects → Leaderboard → Profile → Avatar Shop → Quests → Badges → AI Tutor
├── TEACHER     → Dashboard → Classes → Assign Game (3-step) → Question Bank → Reports → Students
├── SCHOOL      → Dashboard → Students → Teachers → Classes → Reports → Settings
└── ADMIN       → Platform Dashboard → Schools → Users → Content → Moderation → Analytics → Audit → Experiments
```

---

## UI / UX Guidelines

### Student — Highly Gamified (Dark Arcade Academy)
- **Feel:** Fortnite × Duolingo × Clash Royale. Every action has visual feedback.
- **Colors:** Violet `#6B4BFF` (primary), Cyan `#18D6FF` (tech), Gold `#FFC93C` (coins/rewards), `#07070F` (deep bg)
- **Fonts:** Bowlby One (display titles), Nunito (body), JetBrains Mono (scores/numbers)
- **Animations:** XP floats, level-up full-screen, achievement toasts, quest complete burst, streak flame
- **Cards:** Hard-drop shadows (colored), scanline overlays on hero banners, particle fields
- **Avatar:** Octagon frame, level badge overlay
- **Every screen** should feel like you're inside a game, not using a school app

### Teacher — Professional + Subtly Gamified
- **Feel:** Clean SaaS dashboard with game-inspired elements. Teachers aren't playing — they're managing.
- **Colors:** Same dark base. Accent with violet/cyan sparingly.
- **Elements:** Class stats shown as "achievement boards", top performers with crown/gold indicators, progress bars styled like XP bars, "quest creation" framing for assignments
- **No heavy animations.** Smooth transitions only.
- **Data tables** should be clean and scannable.

### School Admin — Professional Dashboard
- **Feel:** Analytics-first. Clean, data-dense, confident.
- **Colors:** Dark base, cyan for data highlights, green/red for health indicators
- **Minimal gamification** — school "health score" as a stat bar, engagement shown with progress rings
- **Focus on clarity** over decoration.

### Platform Admin — Pure SaaS
- **Feel:** Internal ops tool. Clarity over style.
- **Standard dark dashboard.** No game chrome.
- **Data tables, filters, audit logs** are the primary UI.

---

## Current State (as of 2026-05-02)

### What works end-to-end
- Auth system (JWT + httpOnly cookies, refresh tokens, role-based routing)
- Student dashboard (hybrid: real API + smart fallbacks)
- Student leaderboard (hybrid)
- Student shop (real API)
- Student quests (real API)
- Student profile (hybrid)
- Student game vault (hybrid)
- Teacher dashboard (real API, no fallback)
- Teacher question bank (real API)
- School dashboard (real API)
- Supabase Postgres connected, Prisma migrations done

### What's mocked / broken
- Subjects page — fully hardcoded, no API calls
- Games catalog — hardcoded static array (not from DB)
- Multi-tenant user creation chain — routes exist but UI completion and correctness unknown
- Game result screen — may not be writing XP/coins back to DB correctly
- Achievement toasts — not wired at all
- XP float animations — not implemented
- Level-up screen — not implemented
- Quiz Battle multiplayer UI — backend (Socket.io) ready, battle screen UI unclear

### DB State
- Supabase connected, migrations ran
- DB is mostly empty (no seed data for demo)

---

## Feature Tracker

### Phase 1 — Multi-Tenant Creation Chain (CRITICAL PATH)
*Every role must be able to create the next role down. This is the startup's core value.*

#### 1.1 Admin → School
- [ ] Admin can create a new school (name, domain, subscription tier, city)
- [ ] Creating a school automatically creates a School Admin account (email + temp password)
- [ ] Admin can view all schools, suspend/activate, edit details
- [ ] Admin can see per-school analytics snapshot on hover/expand
- [ ] UI: Simple form modal, clean table list. Professional style.

#### 1.2 School Admin → Teacher
- [ ] School admin can create teacher accounts (name, email, subject specialisation, grade levels)
- [ ] Teacher receives credentials (shown on screen + optionally emailed if SMTP configured)
- [ ] School admin can deactivate/reactivate teachers
- [ ] School admin can assign teachers to classes
- [ ] UI: Simple form, searchable teacher list.

#### 1.3 School Admin → Classes
- [ ] School admin can create classes (name, grade, section, academic year)
- [ ] Assign a teacher to each class
- [ ] View class roster
- [ ] UI: Clean table with inline actions.

#### 1.4 Teacher → Students
- [ ] Teacher can add students to their class (name, grade, section → system generates studentId + PIN)
- [ ] Teacher can add students one-by-one OR bulk (CSV upload with name, grade columns)
- [ ] Teacher can reset a student's PIN
- [ ] Teacher can remove/transfer student
- [ ] Generated studentId + PIN shown clearly so teacher can hand it to student
- [ ] UI: Simple add form + table. PIN shown in a "ticket" card the teacher can screenshot.

#### 1.5 Student Login
- [ ] Student logs in with studentId + PIN (4-digit)
- [ ] First login prompts to set a display name / pick avatar
- [ ] UI: Large PIN input, arcade style.

---

### Phase 2 — Gamification Feedback Loop (STUDENT WOW)
*The "this feels like a real game" experience. Without this, it's just a study app.*

#### 2.1 Achievement Toast System (Singleton)
- [ ] Global toast component mounted at root layout (student layout only)
- [ ] Triggers: XP earned, level up, badge unlocked, quest completed, streak milestone, coins earned
- [ ] XP/coins toasts: small pill slides in from top-right ("+25 XP", "+10 coins")
- [ ] Badge/quest toasts: larger card with icon, name, reward summary
- [ ] Multiple toasts queue and stack (max 3 visible)
- [ ] Auto-dismiss after 3s, manually dismissable

#### 2.2 XP Float Animation
- [ ] When a game session completes, "+X XP" floats up and fades out over the result screen
- [ ] Coins earned float separately in gold
- [ ] CSS keyframe animation, no library needed

#### 2.3 Level-Up Full Screen
- [ ] When a user's XP crosses a level threshold, full-screen overlay fires
- [ ] Shows: old level → new level, level name, any new unlocks (items, features)
- [ ] Particle burst animation, Orbitron/Bowlby font
- [ ] "TAP TO CONTINUE" dismisses it
- [ ] Only fires once per session even if multiple levels gained

#### 2.4 Quest Completion Burst
- [ ] When a quest is completed (real-time via API polling or socket), a burst animation plays on the quest card
- [ ] Toast fires with reward summary

#### 2.5 Streak Animations
- [ ] Login streak milestone (7 days, 30 days) shows a full-screen moment (smaller than level-up)
- [ ] Daily streak counter on dashboard pulses if user hasn't played today

#### 2.6 Game Result Screen — Real API Wiring
- [ ] Result screen POSTs to `/api/games/complete` with session data
- [ ] XP and coins actually update in DB and reflect immediately on dashboard
- [ ] Level-up check fires after XP update
- [ ] Quest progress updates after game completion

---

### Phase 3 — Game Experience
*Games must be fully playable and wired to the progression system.*

#### 3.1 Game Catalog
- [ ] Game catalog fetched from DB (teacher assignments should surface first)
- [ ] "Assigned by Teacher" games highlighted with a badge
- [ ] Locked games show unlock level requirement
- [ ] Continue Playing shows last played game + score

#### 3.2 Phaser Game Integration
- [ ] Car game (`/public/games/cargame.html`) loads in iframe/canvas, result passed to Next.js HUD
- [ ] Plants game loads and returns result
- [ ] Fighting game loads and returns result
- [ ] Math Dungeon (React/Phaser wrapper) playable end-to-end
- [ ] Word Forge playable end-to-end
- [ ] Science Lab playable end-to-end
- [ ] History Conquest playable end-to-end

#### 3.3 Quiz Battle (Multiplayer)
- [ ] Lobby creation: Teacher or student creates a room, gets a 6-char code
- [ ] Join flow: Student enters code, sees waiting room with avatars
- [ ] Battle screen: 10 questions, real-time opponent progress bar visible
- [ ] Result screen: winner/loser moment, XP awarded, rematch button
- [ ] Socket.io events wired to UI (lobby join, question push, answer sync, result)

#### 3.4 Shared Result Screen
- [ ] Used across all games (not just Quiz Battle)
- [ ] Shows: score, XP earned (+float animation), coins earned, accuracy %, question breakdown
- [ ] Animated XP bar filling to new level
- [ ] "PLAY AGAIN" and "BACK TO VAULT" buttons

---

### Phase 4 — Teacher Flow
*Teachers should be able to manage their class entirely within the platform.*

#### 4.1 Teacher Dashboard
- [ ] Real analytics from `/api/analytics/{userId}` — wired and displaying
- [ ] "At risk" students highlighted (low engagement / score dropping)
- [ ] Quick actions: Assign Game, Create Question, View Roster
- [ ] Class activity feed (last 24h: who played what, scores)

#### 4.2 Assign Game (3-step flow)
- [ ] Step 1: Select game (grid with thumbnails)
- [ ] Step 2: Configure (subject, chapter, difficulty, due date, points multiplier)
- [ ] Step 3: Select class(es) → Confirm
- [ ] Students see assigned games at top of Game Vault with "due" badge

#### 4.3 Class Management
- [ ] Create class (name, grade, section)
- [ ] View class roster
- [ ] Remove student from class
- [ ] Add existing student to class by studentId

#### 4.4 Question Bank
- [ ] Create question (MCQ, Fill-in-blank supported first)
- [ ] Edit / delete question
- [ ] Filter by subject, grade, difficulty
- [ ] Approval status shown (DRAFT → PENDING → APPROVED)
- [ ] Teacher can submit for approval

#### 4.5 Reports
- [ ] Class performance over time (line chart)
- [ ] Per-student mastery breakdown (radar or bar chart by subject)
- [ ] Game engagement: which games are most played, avg score
- [ ] Export as PDF / CSV (if time allows)

---

### Phase 5 — School Admin Flow
*School admins manage the institution. Professional, data-dense UI.*

#### 5.1 School Dashboard
- [ ] Real data: student count, teacher count, active classes, weekly active users
- [ ] Engagement score as a single health metric
- [ ] Top-performing class and struggling class highlighted
- [ ] Recent activity feed (sign-ups, game completions)

#### 5.2 Student Roster
- [ ] Search, filter by class/grade
- [ ] View student profile (link to their stats)
- [ ] Bulk deactivate
- [ ] Export CSV

#### 5.3 Teacher Management
- [ ] Add teacher (wired to creation flow from 1.2)
- [ ] View teacher's classes and performance
- [ ] Deactivate / reactivate
- [ ] Reassign teacher to different class

#### 5.4 Class Management
- [ ] Full CRUD (create wired to 1.3)
- [ ] View class details: roster, teacher, avg performance
- [ ] Archive old classes

#### 5.5 Reports
- [ ] School-wide engagement over time
- [ ] Subject mastery distribution (heatmap by grade)
- [ ] At-risk student list (cross-class)
- [ ] Teacher activity report (questions created, games assigned)

#### 5.6 Settings
- [ ] School name, logo, timezone
- [ ] Feature flags (enable/disable Quiz Battle, AI Tutor, Shop)
- [ ] Subscription tier display

---

### Phase 6 — Platform Admin Flow
*SaaS operations layer. Pure professional.*

#### 6.1 Platform Dashboard
- [ ] Total schools, students, teachers (live counts)
- [ ] Weekly active users (WAU) trend
- [ ] Revenue / subscription tier breakdown (placeholder if billing not implemented)
- [ ] System health indicators (DB connection, API response time)

#### 6.2 Schools Management
- [ ] Create school (triggers 1.1 flow)
- [ ] List all schools with search, filter by tier/status
- [ ] View school details + usage stats
- [ ] Suspend / reactivate school
- [ ] Edit subscription tier

#### 6.3 User Moderation
- [ ] Search users globally
- [ ] View user profile + activity
- [ ] Suspend / ban user
- [ ] Impersonate for debugging (admin-only, audit logged)

#### 6.4 Content Management
- [ ] Approve/reject teacher-submitted questions
- [ ] View pending question queue
- [ ] Bulk approve by subject/grade

#### 6.5 Analytics
- [ ] Cross-school metrics: avg engagement, subject mastery trends
- [ ] Cohort analysis (students who joined in same week — retention curve)
- [ ] Game popularity ranking

#### 6.6 Audit Log
- [ ] Searchable log of all admin actions
- [ ] Filter by action type, user, date range
- [ ] Export CSV

---

### Phase 7 — Subjects & Curriculum
*Students navigate curriculum through the subjects page.*

#### 7.1 Subjects Page (wire to real API)
- [ ] Fetch subjects list from `/api/subjects`
- [ ] Show subject cards with mastery % from `conceptMastery` table
- [ ] Click subject → chapter tree view
- [ ] Chapter node shows: locked/unlocked status, mastery %, estimated time

#### 7.2 Chapter Detail
- [ ] List topics in chapter
- [ ] Start quiz for chapter → goes to game vault filtered by subject/chapter
- [ ] Show AI Tutor shortcut for this chapter

#### 7.3 Seed Curriculum Data
- [ ] 6 subjects (Math, Science, English, History, Geography, Computer Science)
- [ ] 3–5 chapters per subject
- [ ] 50+ approved questions per subject (via seed script)
- [ ] Mastery seeded for demo student accounts

---

### Phase 8 — Global UI Polish
*The finish that makes it feel like a real product.*

#### 8.1 Loading States
- [ ] Skeleton screens on all data-loading pages (not spinners)
- [ ] Shimmer animation on skeleton cards

#### 8.2 Error States
- [ ] Global error boundary — catches crashes, shows friendly "Something went wrong" screen
- [ ] Per-page API error states with "Retry" button
- [ ] Network offline banner (top bar warning)

#### 8.3 Empty States
- [ ] Student dashboard: no quests → "Your mentor hasn't assigned quests yet. Check back tomorrow!"
- [ ] Game vault: no assignments → "No games assigned. Play from the library below!"
- [ ] Teacher dashboard: no class data → "Add your first class to get started" CTA
- [ ] Each empty state has an illustration and a clear action button

#### 8.4 Splash / Onboarding Screen
- [ ] App loading screen (Screen 0): Quest Academy logo, loading bar, tagline
- [ ] Student first login: pick display name + avatar (3-step onboarding)
- [ ] Teacher first login: "Welcome! Add your first class" prompt

#### 8.5 Mobile Responsiveness Audit
- [ ] Student dashboard — all breakpoints (320px, 375px, 414px, 768px)
- [ ] Teacher dashboard — tablet-optimised (768px+)
- [ ] Game pages — landscape mode for games
- [ ] Bottom nav on mobile — all tabs reachable

#### 8.6 Animations & Micro-interactions
- [ ] Page transition (fade-slide between routes)
- [ ] Button press scale feedback
- [ ] XP bar fill animation on dashboard load
- [ ] Avatar frame glow on hover (student pages)
- [ ] Leaderboard rank change animation (up/down arrow flash)

---

### Phase 9 — Demo Seed Data
*The app must look ALIVE for judges. Empty databases kill demos.*

- [ ] Seed script creates: 1 school ("Greenfield Academy"), 1 school admin
- [ ] 3 teachers (Math, Science, English) with realistic names
- [ ] 30 students across 2 classes (Grade 9A, Grade 9B) with realistic names
- [ ] Students have varied XP, levels (1–15), streaks, coins
- [ ] 500+ approved questions across 6 subjects (can use AI to generate)
- [ ] 200+ game sessions seeded (realistic score distribution)
- [ ] 10+ badge types awarded to various students
- [ ] Quests in various states (active, completed, nearly complete)
- [ ] Leaderboard has a realistic top-10

---

### Phase 10 — Production Hardening
*Makes it defensible as a startup, not just a hackathon project.*

- [ ] All API inputs validated with Zod (frontend + backend)
- [ ] SQL injection impossible (Prisma parameterised queries — verify)
- [ ] XSS prevention (sanitise any user-input rendered as HTML)
- [ ] Rate limiting on auth endpoints (already in place — verify limits)
- [ ] CORS locked to known origins in production
- [ ] Environment variables never exposed to client (audit NEXT_PUBLIC_ vars)
- [ ] Refresh token rotation working correctly
- [ ] Session timeout enforced (30min students, 2hr others)
- [ ] Error logging (Pino already in place — verify coverage)
- [ ] 404 and 500 custom pages

---

## Immediate Sprint — Approach B "Startup MVP" (2 weeks)

### Week 1 — Foundation
| Day | Focus |
|-----|-------|
| 1–2 | Phase 1: Multi-tenant creation chain (audit existing, fix/build UI) |
| 3   | Phase 9: Seed script (demo data) |
| 4   | Phase 7.1–7.2: Wire Subjects page to real API |
| 5   | Phase 2.6: Game result screen wired to DB (XP/coins actually save) |
| 6–7 | Phase 2.1–2.3: Achievement toasts, XP floats, level-up screen |

### Week 2 — Features + Polish
| Day | Focus |
|-----|-------|
| 8–9  | Phase 4.2–4.3: Teacher assign game flow + class management |
| 10   | Phase 3.3: Quiz Battle lobby + battle screen (multiplayer) |
| 11   | Phase 8.1–8.3: Loading skeletons, error boundaries, empty states |
| 12   | Phase 8.4–8.6: Splash screen, mobile audit, micro-interactions |
| 13   | Phase 10: Production hardening pass |
| 14   | Bug fixes, demo prep, final seed data |

---

## Technical Notes

### API Base URL
- Development: `http://localhost:3001`
- Next.js pages use `{ credentials: 'include' }` on all fetch calls (httpOnly cookie auth)
- All authenticated routes require `Authorization` header OR cookie

### Key Service Files
- `server/services/xpService.js` — XP formula, level-up logic, coin calculation
- `server/services/questService.js` — Quest progress tracking, reward distribution
- `server/services/learnerModel.js` — Concept mastery, knowledge state
- `server/services/pacingEngine.js` — Adaptive difficulty
- `server/sockets/quizBattle.js` — Multiplayer Socket.io events

### Design Token Locations
- CSS custom properties: `app/globals.css` (`:root` block)
- Tailwind theme: `tailwind.config.js` (`theme.extend`)
- Static prototype reference: `public/quest-academy/tokens.css`

### Auth Flow
1. Login → Express issues access token (15min) + refresh token (7 days) as httpOnly cookies
2. `app/providers.tsx` → calls `/api/users/me` on mount
3. On 401 → auto-refresh via `/api/auth/refresh`
4. Role determines route access in `app/(authed)/layout.tsx`

### Known Issues
- `coins` on user is derived from `totalPoints / 5` (not a real coins field in some queries) — needs fixing
- Skill Map on student dashboard uses hardcoded mastery values — needs wiring to `/api/learner/knowledge-state`
- Leaderboard merges real + fake data when < 3 real entries — will self-fix once seed data added

---

---

### Phase 11 — Topic Roadmap & Learning Modules (ADDED 2026-05-03)
*Per-topic 5-module learning system with EWMA mastery tracking and spaced-repetition review.*

#### 11.1 Data Layer
- [x] `TopicProgress` model — per-student per-topic mastery with per-module scores
- [x] `Content` model — LEARN/PLAY/PRACTICE payloads stored as JSON per topic
- [x] `TopicPrerequisite` model — prerequisite graph for locking topics
- [x] Tables created directly in Supabase + Prisma client regenerated

#### 11.2 Review Engine & Prerequisites
- [x] `lib/reviewEngine.ts` — EWMA mastery: `computeMastery`, `getNextReviewDate`, `isWeak`
- [x] `lib/prerequisites.ts` — topological lock propagation: `getLockedTopics`

#### 11.3 Express API Routes (`server/routes/learn.js`)
- [x] `POST /api/learn/progress` — upsert TopicProgress, EWMA mastery, XP award, streak update
- [x] `GET /api/learn/subjects` — subjects with per-student avg mastery
- [x] `GET /api/learn/topics/:subjectId` — chapters+topics with progress and lock state
- [x] `GET /api/learn/review-due` — overdue topics for spaced-repetition
- [x] `GET /api/learn/content/:topicId/:type` — serve LEARN/PLAY/PRACTICE payload

#### 11.4 Subject Roadmap (`/student/learn`)
- [x] `app/components/ui/MasteryRing.tsx` — circular SVG mastery indicator
- [x] `app/components/roadmap/SubjectNode.tsx` — subject card with mastery ring
- [x] `app/(authed)/student/learn/page.tsx` — subject grid + due-for-review chips
- [x] `/student/subjects` redirected permanently to `/student/learn`
- [x] Nav link updated

#### 11.5 Topic Roadmap (`/student/learn/[subjectId]`)
- [x] `app/components/roadmap/TopicNode.tsx` — topic card with 4-module pips, lock overlay, badges
- [x] `app/components/roadmap/RoadmapPath.tsx` — SVG connector between nodes
- [x] `app/(authed)/student/learn/[subjectId]/page.tsx` — chapter sections + topic nodes

#### 11.6 Learn Module
- [x] `app/components/slides/TextSlide.tsx` — Framer Motion slide-in text slide
- [x] `app/components/slides/DiagramSlide.tsx` — named SVG diagrams (RightTriangleDiagram)
- [x] `app/components/slides/InteractiveSlide.tsx` — interactive component dispatcher
- [x] `app/components/interactive/DraggableTriangle.tsx` — drag vertices, live sin/cos/tan readout
- [x] `app/components/modules/SlideRenderer.tsx` — dispatches to slide type components
- [x] `app/components/modules/LearnStepper.tsx` — full-screen stepper with progress bar
- [x] `app/(authed)/student/learn/[subjectId]/[topicId]/learn/page.tsx`

#### 11.7 Quiz Module
- [x] `app/components/modules/QuizRunner.tsx` — MCQ, answer feedback, result breakdown
- [x] `app/(authed)/student/learn/[subjectId]/[topicId]/quiz/page.tsx` — fetches from existing Question model

#### 11.8 Practice Module
- [x] `app/components/modules/PracticeExamples.tsx` — step-reveal worked examples
- [x] `app/(authed)/student/learn/[subjectId]/[topicId]/practice/page.tsx`

#### 11.9 Play Module
- [x] `app/components/games/FormulaMatchGame.tsx` — click-to-match formula pairs
- [x] `app/components/games/EquationBalanceGame.tsx` — balance-scale equation solver
- [x] `app/components/games/TriangleRatioGame.tsx` — sin/cos/tan MCQ with triangle visual
- [x] `app/(authed)/student/learn/[subjectId]/[topicId]/play/page.tsx`

#### 11.10 Review Module
- [x] `app/components/modules/ReviewDashboard.tsx` — mastery ring, score bars, weak areas, action buttons
- [x] `app/(authed)/student/learn/[subjectId]/[topicId]/review/page.tsx`

#### 11.11 Seed Data
- [x] `prisma/seed-class10-math.ts` — Class 10 NCERT Math: 14 chapters, ~47 topics, prerequisites, content payloads, 5 MCQ questions per topic

---

## Session Log

| Date | What was done |
|------|--------------|
| 2026-05-02 | Master plan created. Full codebase audited. Approach B "Startup MVP" selected. |
| 2026-05-03 | Phase 11 implemented: full topic roadmap + 5-module learning system + EWMA mastery + Class 10 NCERT Math seed data. |

---

*Quest Academy — Built for Smart India Hackathon. Built to become a startup.*
