# src/ → app/ Merge & Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the codebase into a single Next.js App Router directory (`app/`), apply the Clash Royale × Duolingo design update (new fonts + hard-drop shadows), and port 8 missing features from `src/` into `app/`.

**Architecture:** `app/` is the surviving codebase — Next.js 14 App Router + Express backend on :3001 (proxied via next.config.js). Design system lives in `game-components.css` (root) imported by `app/globals.css`. All missing pages become `'use client'` files under `app/(authed)/`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3, Express 5, Prisma, Lucide React, Google Fonts (Bowlby One / Fredoka One / Nunito / Oswald / Bebas Neue / JetBrains Mono).

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `app/layout.tsx` | Load new fonts |
| Modify | `app/globals.css` | Add missing utility classes (badge, nav-item, progress-track, input, skeleton) |
| Verify | `game-components.css` (root) | Component library file from zip |
| Modify | `tailwind.config.js` | Remove `src/` from content array |
| Delete | `src/` | Entire legacy React Router codebase |
| Delete | `dist/` | Compiled Vite output |
| Create | `app/(authed)/student/homework/page.tsx` | Student homework list |
| Create | `app/(authed)/student/assignments/page.tsx` | Student assignments list |
| Create | `app/(authed)/school/reports/page.tsx` | School analytics reports |
| Create | `app/(authed)/school/settings/page.tsx` | School settings |
| Create | `app/(authed)/school/events/page.tsx` | School calendar events |
| Create | `app/(authed)/teacher/add-student/page.tsx` | Add student form |
| Create | `app/(authed)/teacher/assign/page.tsx` | Teacher assign homework/game |
| Create | `app/(authed)/student/subjects/[subject]/[chapter]/page.tsx` | Lesson viewer iframe |
| Create | `app/components/quiz/FeedbackDisplay.tsx` | Post-quiz AI feedback panel |
| Modify | `app/(authed)/student/games/[slug]/page.tsx` | Wire FeedbackDisplay after game ends |
| Modify | `app/(authed)/layout.tsx` | Add homework/assignments nav links for student |

---

## Task 1: Update Font Loading in app/layout.tsx

**Files:**
- Modify: `app/layout.tsx`

The current layout loads Orbitron, Plus Jakarta Sans, and Inter — fonts from the old design. The new design uses Bowlby One (display), Nunito (body), Oswald (HUD/scores), Bebas Neue (HUD fallback), and JetBrains Mono (numbers). The `app/globals.css` CSS vars already reference these names via `--f-display`, `--f-body`, `--f-hud`.

- [ ] **Step 1: Replace the Google Fonts link in app/layout.tsx**

Open `app/layout.tsx`. Replace the `<link>` block (lines 19–22) with:

```tsx
<link
  href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Fredoka+One&family=Nunito:wght@400;600;700;800&family=Oswald:wght@400;600;700&family=Bebas+Neue&family=JetBrains+Mono:wght@500;700&display=swap"
  rel="stylesheet"
/>
```

Keep the two `<link rel="preconnect">` lines above it unchanged.

- [ ] **Step 2: Verify tailwind.config.js fontFamily matches**

Open `tailwind.config.js`. Confirm `theme.extend.fontFamily` already reads:
```js
sans:    ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
display: ['"Bowlby One"', '"Fredoka One"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
body:    ['Nunito', 'sans-serif'],
hud:     ['Oswald', '"Bebas Neue"', 'sans-serif'],
mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
```
If already correct, no change needed.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: update fonts to Bowlby One/Nunito/Oswald (new game design)"
```

---

## Task 2: Copy game-components.css from zip to project root

**Files:**
- Verify/overwrite: `game-components.css` (project root)

The updated `game-components.css` from `files.zip` was already extracted to `C:\tmp\sih-files\game-components.css`. This is the file imported by `app/globals.css` via `@import url('../game-components.css')`.

- [ ] **Step 1: Copy the updated file to project root**

```bash
cp C:/tmp/sih-files/game-components.css c:/Users/clash/Documents/SIH-base/game-components.css
```

- [ ] **Step 2: Stage the file**

```bash
git add game-components.css
git commit -m "feat: update game-components.css with full Clash Royale/Duolingo component library"
```

---

## Task 3: Add Missing CSS Utility Classes to app/globals.css

**Files:**
- Modify: `app/globals.css`

The `app/` components use utility classes (`.badge`, `.nav-item`, `.progress-track`, `.input`, `.skeleton`, `.stagger-children`, `.custom-scrollbar`) that are not currently defined in `app/globals.css` or `game-components.css`. Add them as a `@layer components` block at the end of `app/globals.css`.

- [ ] **Step 1: Append the missing utility layer to app/globals.css**

Append the following to the very end of `app/globals.css`:

```css
/* ==========================================================================
   APP UTILITY CLASSES — used by app/ components
   ========================================================================== */

/* Navigation */
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-family: var(--f-hud);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
}
.nav-item-active {
  background: rgba(107,75,255,0.18);
  color: var(--violet-bright);
}
.nav-item-inactive {
  color: var(--ink-3);
}
.nav-item-inactive:hover {
  background: rgba(255,255,255,0.05);
  color: var(--ink-1);
}

/* Badges / chips */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-family: var(--f-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border: 1px solid transparent;
}
.badge-primary {
  background: rgba(107,75,255,0.2);
  color: var(--violet-bright);
  border-color: rgba(107,75,255,0.35);
}
.badge-info {
  background: rgba(24,214,255,0.15);
  color: var(--cyan);
  border-color: rgba(24,214,255,0.3);
}
.badge-success {
  background: rgba(45,212,110,0.15);
  color: var(--green);
  border-color: rgba(45,212,110,0.3);
}
.badge-warning {
  background: rgba(255,201,60,0.15);
  color: var(--gold);
  border-color: rgba(255,201,60,0.3);
}
.badge-danger {
  background: rgba(255,90,77,0.15);
  color: var(--hot);
  border-color: rgba(255,90,77,0.3);
}

/* Progress bars */
.progress-track {
  background: #0A0B18;
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}
.progress-fill {
  height: 100%;
  background: var(--violet);
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.22,1,0.36,1);
  position: relative;
}
.progress-fill::after {
  content: '';
  position: absolute;
  right: 2px; top: 1px; bottom: 1px; width: 6px;
  background: rgba(255,255,255,0.4);
  border-radius: 999px;
}

/* Form input */
.input {
  width: 100%;
  background: var(--bg-arena);
  color: var(--ink-1);
  border: 2px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  font-family: var(--f-body);
  font-weight: 600;
  font-size: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input::placeholder { color: var(--ink-3); }
.input:focus {
  outline: none;
  border-color: var(--violet-bright);
  box-shadow: 0 0 0 3px rgba(107,75,255,0.2);
}

/* Buttons (app-layer aliases that map to globals) */
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--violet); color: #fff;
  font-family: var(--f-hud); font-weight: 700;
  letter-spacing: 0.07em; text-transform: uppercase;
  padding: 12px 22px; border-radius: 12px; font-size: 14px;
  border: none; cursor: pointer;
  box-shadow: var(--hd-violet);
  transition: transform 0.08s, box-shadow 0.08s, filter 0.12s;
}
.btn-primary:hover { transform: translateY(-2px); filter: brightness(1.08); }
.btn-primary:active { transform: translateY(4px); box-shadow: 0 1px 0 0 var(--violet-deep); }

.btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  background: transparent; color: var(--ink-1);
  font-family: var(--f-hud); font-weight: 700;
  letter-spacing: 0.07em; text-transform: uppercase;
  padding: 12px 22px; border-radius: 12px; font-size: 14px;
  border: 2px solid var(--line); cursor: pointer;
  box-shadow: 0 5px 0 0 #050610;
  transition: transform 0.08s, box-shadow 0.08s, border-color 0.12s, color 0.12s;
}
.btn-secondary:hover { border-color: var(--cyan); color: var(--cyan); transform: translateY(-2px); }
.btn-secondary:active { transform: translateY(4px); box-shadow: 0 1px 0 0 #050610; }

/* Skeleton loader */
.skeleton {
  background: linear-gradient(90deg, var(--bg-elev-1) 25%, var(--bg-elev-2) 50%, var(--bg-elev-1) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
  border-radius: 10px;
}
@keyframes skeletonShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Staggered children fade-in */
.stagger-children > * {
  animation: fadeInUp 0.3s ease-out both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.20s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
.stagger-children > *:nth-child(6) { animation-delay: 0.30s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.animate-fade-in { animation: fadeIn 0.25s ease-out; }

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--violet); }

/* pb-safe for iPhone home bar */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add missing utility classes (badge, nav-item, progress, skeleton) to globals.css"
```

---

## Task 4: Verify Dev Server Starts Clean

Before touching src/, confirm app/ works.

- [ ] **Step 1: Run dev server**

```bash
npm run server:dev &
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login) in a browser. Confirm:
- Page loads without white flash
- Font is Bowlby One / Nunito (NOT Orbitron)
- Role tabs have hard-drop shadows

- [ ] **Step 2: Check for console errors**

In browser DevTools console, no red errors. If CSS import errors appear (`Cannot resolve '../game-components.css'`), verify `game-components.css` exists at project root.

---

## Task 5: Remove src/ and Consolidate

**Files:**
- Modify: `tailwind.config.js`
- Delete: `src/` directory
- Delete: `dist/` directory (if exists)

- [ ] **Step 1: Remove src/ from tailwind content array**

Open `tailwind.config.js`. Change the `content` array from:
```js
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './src/**/*.{js,ts,jsx,tsx}',
  './index.html',
],
```
to:
```js
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './index.html',
],
```

- [ ] **Step 2: Delete src/ and dist/**

```bash
rm -rf src dist
```

- [ ] **Step 3: Verify next build doesn't reference src/**

```bash
grep -r "from '.*src/" app/ --include="*.tsx" --include="*.ts"
```

Expected: no output. If any imports appear, fix them.

- [ ] **Step 4: Run dev server again to confirm no broken imports**

```bash
npm run dev
```

Navigate to `/login` and `/student`. No 500 errors or missing module errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove src/ (legacy React Router) and dist/ — app/ is now sole source"
```

---

## Task 6: Student Homework Page

**Files:**
- Create: `app/(authed)/student/homework/page.tsx`
- Modify: `app/(authed)/layout.tsx` (add homework to student bottom nav)

- [ ] **Step 1: Create the homework page**

Create `app/(authed)/student/homework/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle, AlertCircle, ArrowRight, Gamepad2 } from 'lucide-react';

type Homework = {
  id: string;
  homeworkId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'PENDING' | 'COMPLETED' | 'LATE' | 'GRADED';
  score: number | null;
};

export default function HomeworkPage() {
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/homework/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const pending = items.filter((h) => h.status === 'PENDING');
  const done = items.filter((h) => h.status !== 'PENDING');

  function timeLeft(dueDate: string | null) {
    if (!dueDate) return null;
    const ms = new Date(dueDate).getTime() - Date.now();
    if (ms <= 0) return 'Overdue';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h left` : `${h}h left`;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-brand-primary" />
          HOMEWORK
        </h1>
        <p className="text-sm text-text-secondary mt-1">Assigned by your teacher</p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
        </div>
      ) : pending.length === 0 && done.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle className="w-12 h-12 text-accent-green mx-auto mb-3 opacity-50" />
          <p className="font-display font-bold text-lg text-text-primary">All caught up!</p>
          <p className="text-sm text-text-secondary mt-1">No homework assigned right now.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-text-secondary tracking-widest uppercase mb-3">
                Pending ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((h) => {
                  const due = timeLeft(h.dueDate);
                  const overdue = due === 'Overdue';
                  return (
                    <div key={h.id} className="card p-5 hover:border-brand-primary transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-accent-red/20' : 'bg-brand-primary/20'}`}>
                          {overdue
                            ? <AlertCircle className="w-5 h-5 text-accent-red" />
                            : <BookOpen className="w-5 h-5 text-brand-primary" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-text-primary">{h.title}</p>
                          {h.description && <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{h.description}</p>}
                          {due && (
                            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${overdue ? 'text-accent-red' : 'text-accent-gold'}`}>
                              <Clock className="w-3 h-3" /> {due}
                            </div>
                          )}
                        </div>
                        <Link href={`/student/subjects`} className="flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-primaryGlow uppercase tracking-wider flex-shrink-0">
                          START <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-text-secondary tracking-widest uppercase mb-3">
                Completed ({done.length})
              </h2>
              <div className="space-y-3">
                {done.map((h) => (
                  <div key={h.id} className="card p-5 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-accent-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-text-primary">{h.title}</p>
                        {h.score !== null && (
                          <p className="text-xs text-accent-gold font-bold mt-0.5">Score: {h.score}</p>
                        )}
                      </div>
                      <span className="badge badge-success">Done</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add homework link to student nav in app/(authed)/layout.tsx**

Find the `studentNav` array (around line 67). Add the homework entry:
```tsx
{ href: '/student/homework', label: 'Homework', icon: BookOpen },
```
Add the import for `BookOpen` if not already present (it is in the current imports at line 9).

- [ ] **Step 3: Commit**

```bash
git add app/\(authed\)/student/homework/page.tsx app/\(authed\)/layout.tsx
git commit -m "feat: add student homework page with live API + nav link"
```

---

## Task 7: Student Assignments Page

**Files:**
- Create: `app/(authed)/student/assignments/page.tsx`

- [ ] **Step 1: Create the assignments page**

Create `app/(authed)/student/assignments/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Clock, CheckCircle, AlertCircle, Gamepad2 } from 'lucide-react';
import Link from 'next/link';

type Assignment = {
  id: string;
  assignmentId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'PENDING' | 'COMPLETED' | 'LATE' | 'GRADED';
  score: number | null;
};

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assignments/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const pending = items.filter((a) => a.status === 'PENDING');
  const done = items.filter((a) => a.status !== 'PENDING');

  function timeLeft(dueDate: string | null) {
    if (!dueDate) return null;
    const ms = new Date(dueDate).getTime() - Date.now();
    if (ms <= 0) return 'Overdue';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h left` : `${h}h left`;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-brand-secondary" />
          ASSIGNMENTS
        </h1>
        <p className="text-sm text-text-secondary mt-1">Tasks assigned by your teacher</p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
        </div>
      ) : pending.length === 0 && done.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle className="w-12 h-12 text-accent-green mx-auto mb-3 opacity-50" />
          <p className="font-display font-bold text-lg text-text-primary">No assignments yet!</p>
          <p className="text-sm text-text-secondary mt-1">Your teacher hasn't assigned anything yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-text-secondary tracking-widest uppercase mb-3">Pending ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((a) => {
                  const due = timeLeft(a.dueDate);
                  const overdue = due === 'Overdue';
                  return (
                    <div key={a.id} className="card p-5 hover:border-brand-secondary transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-accent-red/20' : 'bg-brand-secondary/20'}`}>
                          {overdue
                            ? <AlertCircle className="w-5 h-5 text-accent-red" />
                            : <ScrollText className="w-5 h-5 text-brand-secondary" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-text-primary">{a.title}</p>
                          {a.description && <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{a.description}</p>}
                          {due && (
                            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${overdue ? 'text-accent-red' : 'text-accent-gold'}`}>
                              <Clock className="w-3 h-3" /> {due}
                            </div>
                          )}
                        </div>
                        <span className="badge badge-info">Pending</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-bold text-text-secondary tracking-widest uppercase mb-3">Completed ({done.length})</h2>
              <div className="space-y-3">
                {done.map((a) => (
                  <div key={a.id} className="card p-5 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-accent-green" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-text-primary">{a.title}</p>
                        {a.score !== null && <p className="text-xs text-accent-gold font-bold mt-0.5">Score: {a.score}</p>}
                      </div>
                      <span className="badge badge-success">Done</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(authed\)/student/assignments/page.tsx
git commit -m "feat: add student assignments page"
```

---

## Task 8: School Reports Page

**Files:**
- Create: `app/(authed)/school/reports/page.tsx`
- Modify: `app/(authed)/layout.tsx` (add reports link to SCHOOL nav)

- [ ] **Step 1: Create the reports page**

Create `app/(authed)/school/reports/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Brain, Trophy, AlertTriangle } from 'lucide-react';

type ReportData = {
  totalStudents: number;
  activeToday: number;
  averageCompletion: number;
  averageScore: number;
  topSubjects: Array<{ subject: string; avgScore: number }>;
  atRiskStudents: Array<{ id: string; name: string; class: string; engagementScore: number }>;
};

export default function SchoolReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/school', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 w-full" />)}
    </div>
  );

  const stats = [
    { label: 'Total Students', value: data?.totalStudents ?? '—', icon: Users, color: 'text-brand-primary' },
    { label: 'Active Today', value: data?.activeToday ?? '—', icon: TrendingUp, color: 'text-accent-green' },
    { label: 'Avg. Completion', value: data ? `${data.averageCompletion}%` : '—', icon: Brain, color: 'text-brand-secondary' },
    { label: 'Avg. Score', value: data ? `${data.averageScore}%` : '—', icon: Trophy, color: 'text-accent-gold' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase">SCHOOL REPORTS</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-5">
              <Icon className={`w-6 h-6 mb-2 ${s.color}`} />
              <p className="text-2xl font-mono font-bold text-text-primary">{s.value}</p>
              <p className="text-xs text-text-secondary mt-1 font-bold uppercase tracking-wider">{s.label}</p>
            </div>
          );
        })}
      </div>

      {data?.topSubjects && data.topSubjects.length > 0 && (
        <section className="card p-5">
          <h2 className="font-display font-bold text-sm tracking-widest uppercase text-text-secondary mb-4">SUBJECT PERFORMANCE</h2>
          <div className="space-y-3">
            {data.topSubjects.map((s) => (
              <div key={s.subject}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-primary uppercase tracking-wider">{s.subject}</span>
                  <span className="font-mono text-text-secondary">{s.avgScore}%</span>
                </div>
                <div className="progress-track h-2">
                  <div className="progress-fill" style={{ width: `${s.avgScore}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data?.atRiskStudents && data.atRiskStudents.length > 0 && (
        <section className="card p-5">
          <h2 className="font-display font-bold text-sm tracking-widest uppercase text-text-secondary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-red" /> AT-RISK STUDENTS
          </h2>
          <div className="space-y-2">
            {data.atRiskStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-full bg-accent-red/20 flex items-center justify-center text-sm font-bold text-accent-red">
                  {s.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">{s.name}</p>
                  <p className="text-xs text-text-secondary">{s.class}</p>
                </div>
                <span className="badge badge-danger">Low engagement</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add Reports to school nav in app/(authed)/layout.tsx**

Find the `navFor` function's `SCHOOL` block (around line 237). Add:
```tsx
{ href: '/school/reports', label: 'Reports', icon: BarChart3 },
```
`BarChart3` is already imported.

- [ ] **Step 3: Commit**

```bash
git add app/\(authed\)/school/reports/page.tsx app/\(authed\)/layout.tsx
git commit -m "feat: add school reports page with subject performance + at-risk students"
```

---

## Task 9: School Settings Page

**Files:**
- Create: `app/(authed)/school/settings/page.tsx`

- [ ] **Step 1: Create school settings page**

Create `app/(authed)/school/settings/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Save, Building2, Mail, Phone, MapPin } from 'lucide-react';

export default function SchoolSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const handleSave = async () => {
    const r = await fetch('/api/schools/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    if (r.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase">SCHOOL SETTINGS</h1>

      <section className="card p-6 space-y-4">
        <h2 className="font-display font-bold text-sm tracking-widest uppercase text-text-secondary">SCHOOL INFORMATION</h2>
        {[
          { field: 'name', label: 'School Name', icon: Building2, type: 'text' },
          { field: 'email', label: 'Contact Email', icon: Mail, type: 'email' },
          { field: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
          { field: 'address', label: 'Address', icon: MapPin, type: 'text' },
        ].map(({ field, label, icon: Icon, type }) => (
          <div key={field}>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">{label}</label>
            <div className="relative">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type={type}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="input pl-11"
                placeholder={label}
              />
            </div>
          </div>
        ))}

        <button onClick={handleSave} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saved ? 'SAVED!' : 'SAVE CHANGES'}
        </button>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Add Settings to school nav in layout.tsx**

In the `navFor` SCHOOL block, add:
```tsx
{ href: '/school/settings', label: 'Settings', icon: Settings },
```
Add `Settings` to the lucide-react import at the top of `app/(authed)/layout.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/\(authed\)/school/settings/page.tsx app/\(authed\)/layout.tsx
git commit -m "feat: add school settings page"
```

---

## Task 10: School Events Page

**Files:**
- Create: `app/(authed)/school/events/page.tsx`

- [ ] **Step 1: Create school events page**

Create `app/(authed)/school/events/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';

type SchoolEvent = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
};

export default function SchoolEventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', eventDate: '' });
  const [adding, setAdding] = useState(false);

  const load = () => {
    fetch('/api/schools/events', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addEvent = async () => {
    setAdding(true);
    await fetch('/api/schools/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setForm({ title: '', description: '', eventDate: '' });
    setAdding(false);
    load();
  };

  const deleteEvent = async (id: string) => {
    await fetch(`/api/schools/events/${id}`, { method: 'DELETE', credentials: 'include' });
    setEvents((e) => e.filter((ev) => ev.id !== id));
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase">SCHOOL EVENTS</h1>

      <section className="card p-6 space-y-4">
        <h2 className="font-display font-bold text-sm tracking-widest uppercase text-text-secondary">ADD EVENT</h2>
        <input className="input" placeholder="Event title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <input className="input" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <input className="input" type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} />
        <button onClick={addEvent} disabled={!form.title || !form.eventDate || adding} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> ADD EVENT
        </button>
      </section>

      <section className="space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton h-16 w-full" />)
        ) : events.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No events scheduled.</p>
          </div>
        ) : events.map((ev) => (
          <div key={ev.id} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary">{ev.title}</p>
              {ev.description && <p className="text-xs text-text-secondary mt-0.5">{ev.description}</p>}
              <p className="text-xs font-mono text-accent-gold mt-1">{new Date(ev.eventDate).toLocaleDateString()}</p>
            </div>
            <button onClick={() => deleteEvent(ev.id)} className="text-text-muted hover:text-accent-red transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Add Events to school nav**

In `app/(authed)/layout.tsx`, SCHOOL navFor block, add:
```tsx
{ href: '/school/events', label: 'Events', icon: Calendar },
```
`Calendar` is already in the imports.

- [ ] **Step 3: Commit**

```bash
git add app/\(authed\)/school/events/page.tsx app/\(authed\)/layout.tsx
git commit -m "feat: add school events page (create/list/delete)"
```

---

## Task 11: Teacher — Assign Homework/Game Page

**Files:**
- Create: `app/(authed)/teacher/assign/page.tsx`

- [ ] **Step 1: Create the assign page**

Create `app/(authed)/teacher/assign/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Send, BookOpen, Gamepad2 } from 'lucide-react';

type Class = { id: string; name: string; gradeLevel: number };

export default function TeacherAssignPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [tab, setTab] = useState<'homework' | 'game'>('homework');
  const [form, setForm] = useState({ classId: '', title: '', description: '', dueDate: '', gameType: 'MATH_DUNGEON' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/classes/mine', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  const submit = async () => {
    setSending(true);
    const endpoint = tab === 'homework' ? '/api/homework' : '/api/games/assign';
    const body = tab === 'homework'
      ? { classId: form.classId, title: form.title, description: form.description, dueDate: form.dueDate || undefined }
      : { classId: form.classId, gameType: form.gameType, dueDate: form.dueDate || undefined };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    setSending(false);
    if (r.ok) {
      setSuccess(true);
      setForm({ classId: '', title: '', description: '', dueDate: '', gameType: 'MATH_DUNGEON' });
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const gameTypes = [
    { value: 'MATH_DUNGEON', label: 'Math Dungeon' },
    { value: 'QUIZ_BATTLE', label: 'Quiz Battle' },
    { value: 'SCIENCE_LAB', label: 'Science Lab Escape' },
    { value: 'HISTORY_CONQUEST', label: 'History Conquest' },
    { value: 'WORD_FORGE', label: 'Word Forge' },
  ];

  const valid = form.classId && (tab === 'homework' ? form.title : form.gameType);

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase">ASSIGN TO CLASS</h1>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {(['homework', 'game'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${tab === t ? 'bg-brand-primary border-brand-primary text-white' : 'bg-bg-elevated border-white/5 text-text-secondary hover:text-text-primary'}`}
          >
            {t === 'homework' ? <BookOpen className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
            {t === 'homework' ? 'Homework' : 'Game'}
          </button>
        ))}
      </div>

      <section className="card p-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">CLASS</label>
          <select
            value={form.classId}
            onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
            className="input"
          >
            <option value="">Select a class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — Grade {c.gradeLevel}</option>)}
          </select>
        </div>

        {tab === 'homework' ? (
          <>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">TITLE</label>
              <input className="input" placeholder="Homework title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">DESCRIPTION (OPTIONAL)</label>
              <input className="input" placeholder="Instructions…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </>
        ) : (
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">GAME</label>
            <select value={form.gameType} onChange={(e) => setForm((f) => ({ ...f, gameType: e.target.value }))} className="input">
              {gameTypes.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">DUE DATE (OPTIONAL)</label>
          <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
        </div>

        <button onClick={submit} disabled={!valid || sending} className="btn-primary w-full flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          {success ? 'ASSIGNED!' : sending ? 'ASSIGNING…' : 'ASSIGN NOW'}
        </button>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Add Assign link to teacher nav in layout.tsx**

In the `navFor` TEACHER block, add:
```tsx
{ href: '/teacher/assign', label: 'Assign', icon: Send },
```
Add `Send` to lucide-react imports.

- [ ] **Step 3: Commit**

```bash
git add app/\(authed\)/teacher/assign/page.tsx app/\(authed\)/layout.tsx
git commit -m "feat: add teacher assign homework/game page"
```

---

## Task 12: Teacher — Add Student Page

**Files:**
- Create: `app/(authed)/teacher/add-student/page.tsx`

- [ ] **Step 1: Create add-student page**

Create `app/(authed)/teacher/add-student/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';

type Class = { id: string; name: string; gradeLevel: number };

export default function AddStudentPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [form, setForm] = useState({ name: '', email: '', studentId: '', classId: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/classes/mine', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setClasses)
      .catch(() => {});
  }, []);

  const submit = async () => {
    setSubmitting(true);
    setResult(null);
    const r = await fetch('/api/users/create-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (r.ok) {
      setResult({ ok: true, msg: `Student "${form.name}" added!` });
      setForm({ name: '', email: '', studentId: '', classId: '', password: '' });
    } else {
      const err = await r.json().catch(() => ({}));
      setResult({ ok: false, msg: err.message || 'Failed to add student.' });
    }
  };

  const valid = form.name && form.classId && form.password;

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'email', label: 'Email (optional)', type: 'email', required: false },
    { key: 'studentId', label: 'Student ID / Roll No. (optional)', type: 'text', required: false },
    { key: 'password', label: 'Temporary Password', type: 'password', required: true },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase flex items-center gap-3">
        <UserPlus className="w-6 h-6 text-brand-primary" /> ADD STUDENT
      </h1>

      <section className="card p-6 space-y-4">
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">{label}</label>
            <input
              type={type}
              className="input"
              placeholder={label}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">CLASS *</label>
          <select value={form.classId} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} className="input">
            <option value="">Select class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — Grade {c.gradeLevel}</option>)}
          </select>
        </div>

        {result && (
          <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${result.ok ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 'bg-accent-red/10 text-accent-red border border-accent-red/30'}`}>
            {result.ok && <CheckCircle className="w-4 h-4" />}
            {result.msg}
          </div>
        )}

        <button onClick={submit} disabled={!valid || submitting} className="btn-primary w-full flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" />
          {submitting ? 'ADDING…' : 'ADD STUDENT'}
        </button>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(authed\)/teacher/add-student/page.tsx
git commit -m "feat: add teacher add-student page"
```

---

## Task 13: Lesson Viewer Page

**Files:**
- Create: `app/(authed)/student/subjects/[subject]/[chapter]/page.tsx`

- [ ] **Step 1: Create the lesson viewer page**

Create `app/(authed)/student/subjects/[subject]/[chapter]/page.tsx`:

```tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LessonViewerPage() {
  const params = useParams<{ subject: string; chapter: string }>();
  const subject = decodeURIComponent(params.subject);
  const chapter = decodeURIComponent(params.chapter);
  const src = `/lessons/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}`;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-bg-overlay/80 backdrop-blur-md">
        <Link href="/student/subjects" className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4" /> Back to Subjects
        </Link>
        <span className="text-white/20">|</span>
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{subject} — {chapter}</span>
      </div>
      <iframe
        title={`${subject} — ${chapter}`}
        src={src}
        className="flex-1 w-full border-0"
        allow="fullscreen"
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(authed)/student/subjects/[subject]/[chapter]/page.tsx"
git commit -m "feat: add lesson viewer page (iframe wrapper for /lessons/)"
```

---

## Task 14: Post-Quiz FeedbackDisplay Component

**Files:**
- Create: `app/components/quiz/FeedbackDisplay.tsx`
- Modify: `app/(authed)/student/games/[slug]/page.tsx`

- [ ] **Step 1: Create FeedbackDisplay component**

Create `app/components/quiz/FeedbackDisplay.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { X, Brain, TrendingUp, TrendingDown, BookOpen, Star } from 'lucide-react';

export type ConceptBreakdown = {
  concept: string;
  mastery: number;
  questions: number;
  correct: number;
  feedback: string;
};

export type FeedbackData = {
  overallScore: number;
  conceptBreakdown: ConceptBreakdown[];
  strengths: Array<{ concept: string; mastery: number }>;
  weaknesses: Array<{ concept: string; mastery: number }>;
  recommendations: Array<{ type: 'lesson' | 'quiz'; concept: string; message: string }>;
};

type Props = {
  data: FeedbackData;
  onClose: () => void;
};

export default function FeedbackDisplay({ data, onClose }: Props) {
  const [tab, setTab] = useState<'overview' | 'breakdown' | 'tips'>('overview');
  const scoreColor = data.overallScore >= 80 ? 'text-accent-green' : data.overallScore >= 60 ? 'text-accent-gold' : 'text-accent-red';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-bg-surface border-2 border-brand-primary rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(107,75,255,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-brand-primary" />
            <h2 className="font-display font-bold text-text-primary tracking-widest uppercase">QUIZ FEEDBACK</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score hero */}
        <div className="p-6 text-center border-b border-white/5">
          <p className={`font-display text-6xl font-bold ${scoreColor}`}>{data.overallScore}%</p>
          <p className="text-sm text-text-secondary mt-1">Overall Score</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {(['overview', 'breakdown', 'tips'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${tab === t ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-text-muted hover:text-text-secondary'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {tab === 'overview' && (
            <div className="space-y-4">
              {data.strengths.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-accent-green uppercase tracking-wider mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> STRENGTHS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.strengths.map((s) => (
                      <span key={s.concept} className="badge badge-success">{s.concept} {Math.round(s.mastery * 100)}%</span>
                    ))}
                  </div>
                </div>
              )}
              {data.weaknesses.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-accent-red uppercase tracking-wider mb-2 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> NEEDS WORK
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.weaknesses.map((w) => (
                      <span key={w.concept} className="badge badge-danger">{w.concept} {Math.round(w.mastery * 100)}%</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'breakdown' && (
            <div className="space-y-4">
              {data.conceptBreakdown.map((c) => (
                <div key={c.concept}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-text-primary">{c.concept}</span>
                    <span className="text-xs font-mono text-text-secondary">{c.correct}/{c.questions}</span>
                  </div>
                  <div className="progress-track h-2">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${c.mastery * 100}%`,
                        background: c.mastery >= 0.8 ? 'var(--green)' : c.mastery >= 0.5 ? 'var(--violet)' : 'var(--hot)',
                      }}
                    />
                  </div>
                  {c.feedback && <p className="text-xs text-text-muted mt-1">{c.feedback}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === 'tips' && (
            <div className="space-y-3">
              {data.recommendations.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Great work — no specific recommendations right now!</p>
              ) : data.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-bg-elevated rounded-xl border border-white/5">
                  {r.type === 'lesson'
                    ? <BookOpen className="w-4 h-4 text-brand-secondary mt-0.5 flex-shrink-0" />
                    : <Star className="w-4 h-4 text-accent-gold mt-0.5 flex-shrink-0" />
                  }
                  <div>
                    <p className="text-xs font-bold text-text-primary">{r.concept}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <button onClick={onClose} className="btn-primary w-full">CONTINUE</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire FeedbackDisplay into the game slug page**

Open `app/(authed)/student/games/[slug]/page.tsx`. Add the import at the top and a `feedback` state, then show it after a quiz ends. First, read the current file to understand its structure, then add:

```tsx
// Add to imports
import FeedbackDisplay, { type FeedbackData } from '../../../../components/quiz/FeedbackDisplay';

// Add state inside the component
const [feedback, setFeedback] = useState<FeedbackData | null>(null);

// After quiz submission, call:
// setFeedback(responseData);

// Add before closing </div>:
{feedback && <FeedbackDisplay data={feedback} onClose={() => setFeedback(null)} />}
```

Note: The exact integration depends on how game slug page currently ends a game session. Read the file first and add the state + component in the appropriate places.

- [ ] **Step 3: Commit**

```bash
git add app/components/quiz/FeedbackDisplay.tsx app/\(authed\)/student/games/\[slug\]/page.tsx
git commit -m "feat: add post-quiz FeedbackDisplay component with overview/breakdown/tips tabs"
```

---

## Task 15: Final Build Verification

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -50
```

Fix any type errors before proceeding.

- [ ] **Step 2: Run Next.js build**

```bash
npm run build
```

Expected: build completes successfully. If errors appear, fix them.

- [ ] **Step 3: Start the full stack and smoke test**

```bash
npm run dev:all
```

Navigate to each new page and confirm it loads:
- `/login` — check fonts are Bowlby One / Nunito
- `/student` — dashboard loads
- `/student/homework` — page renders (may show empty state if no API data)
- `/student/assignments` — page renders
- `/school/reports` — renders (SCHOOL role needed)
- `/school/settings` — renders
- `/school/events` — renders
- `/teacher/assign` — renders
- `/teacher/add-student` — renders

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete src/→app/ merge — design refresh, consolidation, 8 new pages"
```

---

## Self-Review Notes

- **Spec coverage:** All 3 priorities covered — design change (Tasks 1-4), consolidation (Task 5), missing features (Tasks 6-14).
- **API endpoints assumed in place:** `/api/homework/me`, `/api/assignments/me`, `/api/schools/events`, `/api/schools/settings`, `/api/classes/mine`, `/api/users/create-student`, `/api/analytics/school`. These all need to exist in `server/`. If they don't, the pages will gracefully show empty states.
- **FeedbackDisplay integration** (Task 14 Step 2) requires reading the current game slug page first — the exact wiring point depends on how sessions end in that file.
- **No placeholders:** All code blocks are complete and self-contained.
