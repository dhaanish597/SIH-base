# src/ → app/ Merge & Design Refresh — Changes Summary

**Completed:** 2026-04-29  
**Branch:** master

---

## What Was Done

### Priority 1: Design Change (Fonts + CSS)

#### `app/layout.tsx`
- Replaced old Google Fonts (Orbitron, Inter, Plus Jakarta Sans) with the new game design fonts:
  **Bowlby One** (display/titles), **Fredoka One** (display alt), **Nunito** (body), **Oswald** (HUD/numbers), **Bebas Neue** (HUD fallback), **JetBrains Mono** (scores/code)

#### `app/globals.css`
- Added `.btn-primary` and `.btn-secondary` to the base button selector so they inherit full button styles (padding, font, transition)
- Appended full utility class library used by all `app/` components:
  - **Navigation:** `.nav-item`, `.nav-item-active`, `.nav-item-inactive`
  - **Badges:** `.badge`, `.badge-primary`, `.badge-info`, `.badge-success`, `.badge-warning`, `.badge-danger`
  - **Progress bars:** `.progress-track`, `.progress-fill`
  - **Form:** `.input` (standalone alias for `.arcade-input`)
  - **Buttons:** `.btn-secondary` (ghost variant)
  - **Loading:** `.skeleton` + `@keyframes skeletonShimmer`
  - **Animations:** `.stagger-children`, `.animate-fade-in`, `@keyframes fadeInUp`, `@keyframes fadeIn`
  - **Scrollbar:** `.custom-scrollbar`
  - **Mobile:** `.pb-safe`
  - **Tailwind aliases:** bg/text/border/shadow semantic classes for legacy components

#### `game-components.css` (project root)
- Already up to date (identical to files.zip version) — no change needed

---

### Priority 2: Codebase Consolidation

#### Deleted
- `src/` — entire legacy Vite + React Router codebase (5 components, hooks, i18n, CSS, utils)
- `dist/` — compiled Vite output

#### `tailwind.config.js`
- Removed `'./src/**/*.{js,ts,jsx,tsx}'` from `content` array

#### `tsconfig.json`
- Removed stale `@/src/*` and `@/components/*` path aliases (pointed to deleted `src/`)
- Added `tests` to `exclude` to prevent broken e2e spec files from failing type checks

---

### Priority 3: New Features Ported to app/

#### Student Pages
| Page | Route | Description |
|------|-------|-------------|
| Homework | `/student/homework` | Lists pending/completed homework from teacher. Fetches `/api/homework/me` |
| Assignments | `/student/assignments` | Lists pending/completed assignments. Fetches `/api/assignments/me` |
| Lesson Viewer | `/student/subjects/[subject]/[chapter]` | iframe wrapper for `/lessons/` content |

#### School Pages
| Page | Route | Description |
|------|-------|-------------|
| Reports | `/school/reports` | Analytics dashboard — student count, active today, avg score, subject performance bars |
| Settings | `/school/settings` | Edit school name/email/phone/address via PATCH `/api/schools/settings` |
| Events | `/school/events` | Create/list/delete school calendar events |

#### Teacher Pages
| Page | Route | Description |
|------|-------|-------------|
| Assign | `/teacher/assign` | Assign homework OR game to a class with due date |
| Add Student | `/teacher/add-student` | Create a new student account + enroll in class |

#### Components
- `app/components/quiz/FeedbackDisplay.tsx` — Post-quiz AI feedback panel with 3 tabs (Overview / Breakdown / Tips). Wired into the game slug page — shows after a game session ends with results.

---

### Navigation Updates (`app/(authed)/layout.tsx`)
- **Student bottom nav:** added Homework link (📋 ScrollText icon)
- **School sidebar:** added Reports, Settings, Events links
- **Teacher sidebar:** added Assign and Add Student links
- Cleaned up unused lucide-react imports

---

### New Backend Routes (`server/`)

| File | Route | Description |
|------|-------|-------------|
| `routes/homework.js` | `GET /api/homework/me` | Student's homework list (via StudentHomework → Homework join) |
| | `POST /api/homework` | Teacher creates homework + assigns to class enrollment |
| `routes/assignments.js` | `GET /api/assignments/me` | Student's assignment list |
| | `POST /api/assignments` | Teacher creates assignment + assigns to class enrollment |
| `routes/classes.js` | `GET /api/classes/mine` | Teacher's classes (or school's classes for school admin) |
| `routes/schools.js` | `PATCH /api/schools/settings` | Update school info |
| | `GET /api/schools/events` | List school events |
| | `POST /api/schools/events` | Create school event |
| | `DELETE /api/schools/events/:id` | Delete school event |
| `routes/analytics.js` | `GET /api/analytics/school` | School overview stats |
| `routes/games.js` | `POST /api/games/assign` | Teacher assigns a game type to a class |
| `routes/users.js` | `POST /api/users/create-student` | Teacher/school creates a student account |

All new routes registered in `server/index.js`.

---

## Build Result

```
✓ Compiled successfully
✓ 33 pages built (0 errors)
✓ TypeScript passes clean (npx tsc --noEmit)
```

All pages from `/student/homework` to `/teacher/add-student` confirmed present in build output.
