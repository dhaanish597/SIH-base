# SIH Platform — Migration TODO (User Actions)

This file tracks **what you (the user) need to do** to take the migration from "code written" to "running". I (Claude) keep writing code in parallel; you only need to do the steps in **🟢 Action required** sections.

> Last updated: 2026-04-26

---

## 🟢 Action required: One-time Supabase + env setup

### 1. Create the Supabase project
1. Go to https://supabase.com → **New project**
2. Name it `sih-platform`, pick a region near you, set a strong DB password (save it!)
3. Wait ~2 minutes for provisioning

### 2. Grab the credentials
From your Supabase dashboard:
- **Project Settings → Database → Connection string → URI** (tick "Use connection pooling", copy the port-6543 string) → this is `DATABASE_URL`
- Same page → **Direct connection** (port 5432) → this is `DIRECT_URL`
- **Project Settings → API → Project URL** → `SUPABASE_URL`
- **Project Settings → API → anon public** → `SUPABASE_ANON_KEY`
- **Project Settings → API → service_role** (secret!) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Get an Anthropic API key
- https://console.anthropic.com/settings/keys → **Create Key**
- Copy → `ANTHROPIC_API_KEY`

### 4. Generate JWT secrets
```bash
# Run these in your terminal once. Each command prints a 64-char hex string.
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Use them as `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (must be different).

### 5. Fill `.env`
```bash
cp .env.example .env
# open .env in your editor and paste in all the values from steps 2-4
```

---

## 🟢 Action required: Install + database setup

```bash
# 1. Install new dependencies (Phaser + Next + Prisma; takes a few minutes)
npm install

# 2. Generate the Prisma client
npx prisma generate

# 3. Create all tables in your Supabase Postgres
npx prisma migrate dev --name init

# 4. Seed reference data (50 levels, badges, quests, shop items)
npm run db:seed

# 5. Seed the question bank (~300 questions from public/games/Questions.json)
npm run db:seed-questions

# 6. Migrate your existing local SQLite users/progress to Postgres
npm run db:migrate-from-sqlite
```

After step 3 you can browse your tables visually with:
```bash
npx prisma studio
```

---

## 🟢 Action required: Run the app

You now have **two** servers — Express backend on `:3001` and Next.js frontend on `:3000`.

```bash
# Run both at the same time:
npm run dev:all

# Or in separate terminals:
npm run server:dev   # Express on :3001
npm run dev          # Next.js on :3000
```

The old Vite app is still runnable as an escape hatch:
```bash
npm run vite:dev     # Vite on :5173 (will be removed once Next.js port is verified working)
```

---

## ✅ What I (Claude) have done

- [x] Prisma schema with all 33 tables (19 existing + 14 new)
- [x] `.env.example` with all placeholders
- [x] `package.json` updated with Next, Prisma, Phaser, Socket.io, Anthropic, Supabase
- [x] SQLite → Postgres migration script
- [x] Question bank seed script (preserves legacyId)
- [x] Reference data seed (levels, badges, quests, shop items)
- [x] Prisma client singleton
- [x] httpOnly cookie auth + refresh tokens (server middleware)
- [x] JWT utilities (access + refresh, role-based TTL)
- [x] Server routes refactored to Prisma: auth, users, leaderboard, badges, progress, coins, quests, shop, games, chatbot
- [x] Chatbot service swapped from OpenAI → Claude (Anthropic SDK with prompt caching)
- [x] AI tutor service (hint generator, free-text grader, concept explainer, study nudge)
- [x] XP / coins / leveling service
- [x] Quest progress tracking service
- [x] School-scoped leaderboard (fixed: was scoped by `class`, now by `school_id`)
- [x] Next.js 14 App Router scaffold
- [x] Modular Express bootstrap (split from 3,441-line monolith)
- [x] All Next.js pages scaffolded (23 pages):
  - Student: dashboard, games index, game player `[slug]`, leaderboard, quests, badges, shop, AI tutor
  - Teacher: dashboard, students list + detail, question bank CRUD
  - School admin: dashboard, students management (add/bulk), teachers list
  - Platform admin: dashboard, schools list, users list, moderation queue
- [x] AI Tutor chat UI (Claude-powered with conversation history)
- [x] Avatar shop with buy/equip flow
- [x] Moderation queue with one-click approve/reject
- [x] Question bank with inline add form + MCQ/T-F/short-answer support
- [x] Quiz Battle lobby UI (Socket.io multiplayer backend already wired)
- [x] **Math Dungeon** — Phaser 3, 5 rooms × 3 enemies, procedural math questions, HP bars, XP/coins reward
- [x] **Word Forge** — MCQ + fill-in-blank + word-sort questions, vocabulary/grammar, reward claiming
- [x] **Science Lab Escape** — equation balancing MCQ + matching pairs, 6 puzzles, reward claiming
- [x] **History Conquest** — SVG territory map, tap to attack, history MCQ to conquer territories
- [x] **UI/UX Polish** — Upgraded Student, Teacher, School Admin, and Platform Admin dashboards with `ui-ux-pro-max` design system
- [x] **Data Binding** — Wired all dashboards to real backend APIs with live data
- [x] **Adaptive Integration** — Wired `learnerModel.js` logic into game question API to serve optimal difficulty questions to students
- [x] **PDF Report Export** — Added print-ready student progress report generation for teacher-parent meetings
- [x] **Audit Log Viewer** — Built admin dashboard page for searching and tracking platform-wide audit events
- [x] **Feature Flags UI** — Added Experiments page for platform admins to toggle features (e.g. AI Tutor, Multiplayer) per school

## 🔄 In progress / next sessions
- [ ] Push notifications for quest completion / badge unlock (Deferred to next phase, requires schema update)
- [ ] React Native mobile app (Deferred for later, focusing on web completion first)

---

## ❓ FAQ

**Q: Will my existing SQLite data be lost?**
A: No. The migration script reads from `server/data/local_analytics.db` and inserts into Postgres without touching SQLite. You can re-run it any time.

**Q: Do I need Docker?**
A: No. Supabase is the hosted DB, your PWA service worker handles offline.

**Q: Can I still use Vite while Next.js migration is in progress?**
A: Yes — `npm run vite:dev` still works. We'll remove Vite once Next.js port reaches feature parity.

**Q: What about real-time multiplayer hosting?**
A: Express + Socket.io will deploy to Railway or Render (not Vercel — serverless functions kill Socket.io). Next.js frontend will deploy to Vercel.
