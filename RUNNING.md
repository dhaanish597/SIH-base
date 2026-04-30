# Running the SIH Platform

This project has two servers that run side by side:

| Server | Port | What it does |
|---|---|---|
| **Next.js** | 3000 | Frontend (React UI, pages, games) |
| **Express** | 3001 | Backend API, Socket.io, auth |

Next.js proxies all `/api/*` calls to Express, so the browser only ever talks to port 3000.

---

## Prerequisites

- Node.js 18+ (`node -v`)
- A [Supabase](https://supabase.com) account (free tier is fine)
- An [Anthropic API key](https://console.anthropic.com/settings/keys) (for the AI tutor — optional, a fallback works without it)

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

### Supabase (database)
1. Go to [supabase.com](https://supabase.com) → **New project**
2. Wait ~2 minutes for it to provision
3. Go to **Project Settings → Database**
   - Copy the **Connection pooling URI** (port 6543) → `DATABASE_URL`
   - Copy the **Direct connection URI** (port 5432) → `DIRECT_URL`
4. Go to **Project Settings → API**
   - Copy **Project URL** → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key (keep this secret) → `SUPABASE_SERVICE_ROLE_KEY`

### JWT secrets
Generate two different random secrets and paste them in:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the first output as `JWT_ACCESS_SECRET` and the second as `JWT_REFRESH_SECRET`.

### Anthropic (AI tutor)
Paste your key as `ANTHROPIC_API_KEY`. If you leave it blank the tutor still works via a built-in fallback.

Also copy `.env` to `.env.local` so Next.js can read the `NEXT_PUBLIC_*` variables:

```bash
cp .env .env.local
```

---

## 3. Set up the database

```bash
# Generate the Prisma client from the schema
npx prisma generate

# Create all tables in your Supabase Postgres
npx prisma migrate dev --name init

# Seed reference data: 50 levels, badges, quests, shop items
npm run db:seed

# Seed the question bank (~300 questions from Questions.json)
npm run db:seed-questions
```

If you have existing data in the old SQLite database, migrate it too:

```bash
npm run db:migrate-from-sqlite
```

To browse your database visually:

```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

## 4. Run the app

```bash
# Recommended: run both servers at once
npm run dev:all
```

Or in two separate terminals:

```bash
# Terminal 1 — Next.js frontend
npm run dev

# Terminal 2 — Express backend
npm run server:dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 5. Create your first account

The platform is school-exclusive — you need a school to exist before creating users. Use Prisma Studio to seed one manually, or run:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const school = await prisma.school.create({
    data: { name: 'Demo School', code: 'DEMO', plan: 'FREE', maxStudents: 500 }
  });
  await prisma.user.create({
    data: {
      name: 'Admin User', email: 'admin@demo.school',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN', schoolId: school.id, status: 'ACTIVE'
    }
  });
  console.log('Created school:', school.code);
  await prisma.\$disconnect();
}
main();
"
```

Then log in at [http://localhost:3000/login](http://localhost:3000/login) with `admin@demo.school` / `admin123`.

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev:all` | Start Next.js + Express together (recommended) |
| `npm run dev` | Next.js only (port 3000) |
| `npm run server:dev` | Express only with auto-reload (port 3001) |
| `npm run build` | Production build of Next.js |
| `npm start` | Run the production Next.js build |
| `npx prisma studio` | Visual database browser |
| `npx prisma migrate dev` | Apply schema changes and create a migration |
| `npm run db:seed` | Re-seed levels, badges, quests, shop items |
| `npm run db:seed-questions` | Re-seed the question bank |

---

## Project structure

```
sih-platform/
├── app/                        # Next.js 14 App Router (frontend)
│   ├── (authed)/               # Pages that require login
│   │   ├── student/            # Student dashboard, games, quests, shop…
│   │   ├── teacher/            # Teacher dashboard, students, question bank
│   │   ├── school/             # School admin: manage students & teachers
│   │   └── admin/              # Platform admin: schools, users, moderation
│   ├── components/games/       # Game components (Math Dungeon, Word Forge…)
│   ├── login/                  # Login page (4-role selector)
│   ├── layout.tsx              # Root layout
│   └── providers.tsx           # Auth context
│
├── server/                     # Express backend (port 3001)
│   ├── routes/                 # Route modules (auth, games, quests, shop…)
│   ├── services/               # Business logic (XP, AI tutor, analytics…)
│   ├── middleware/             # Auth middleware, role guards
│   ├── sockets/                # Socket.io (Quiz Battle multiplayer)
│   ├── utils/                  # JWT helpers
│   └── index.js                # Server bootstrap
│
├── prisma/
│   └── schema.prisma           # Database schema (33 models)
│
├── scripts/
│   ├── seed.js                 # Reference data seed
│   ├── seed-questions.js       # Question bank seed
│   └── migrate-sqlite-to-postgres.js
│
├── public/games/               # Legacy Vite game assets (still works)
├── .env.example                # Environment variable template
├── next.config.js              # Next.js config (API proxy, Phaser webpack)
└── MIGRATION_TODO.md           # Ongoing task checklist
```

---

## How the two servers communicate

```
Browser (port 3000)
    │
    ├─ /api/* ──────────────► Express (port 3001)   ← all API calls
    │   (Next.js proxy)           └─ Prisma ──────► Supabase Postgres
    │
    ├─ /student/...         ← Next.js renders the page
    └─ Socket.io  ─────────► Express (port 3001)    ← real-time games
```

---

## Roles

| Role | Login with | Can do |
|---|---|---|
| **STUDENT** | Student ID + PIN | Play games, earn XP, chat with AI tutor |
| **TEACHER** | Email + password | View analytics, manage question bank |
| **SCHOOL** | Email + password + school code | Manage students and teachers |
| **ADMIN** | Email + password | Platform-wide analytics, moderation |

---

## Troubleshooting

**`prisma migrate dev` fails with connection error**
→ Check `DIRECT_URL` in `.env`. It must be the port-5432 direct connection (not the pooler).

**Games don't load (blank canvas)**
→ Phaser 3 is browser-only. Make sure you're accessing via `http://localhost:3000`, not a server-rendered route.

**AI tutor returns "Chatbot unavailable"**
→ Add a valid `ANTHROPIC_API_KEY` to `.env`. Without it the fallback returns rule-based answers.

**Socket.io connection refused**
→ The Express server must be running (`npm run server:dev`). Next.js alone does not serve WebSockets.

**Old Vite app**
→ Still runnable with `npm run vite:dev` on port 5173. It uses the same Express backend on port 3001.
