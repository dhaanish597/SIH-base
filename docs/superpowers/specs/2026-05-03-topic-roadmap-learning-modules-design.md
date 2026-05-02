# Quest Academy — Topic Roadmap & Learning Modules
> Spec written: 2026-05-03 | Status: Approved

---

## Overview

Add a full per-topic learning system to Quest Academy. Students navigate a visual roadmap of subjects → topics, then work through five sequential modules per topic: Learn → Play → Practice → Quiz → Review. Mastery is tracked per-topic using an EWMA formula and drives spaced-repetition review scheduling.

This extends the existing platform without touching auth, games vault, or multi-tenant admin flows.

---

## Decisions Made

| Question | Decision |
|---|---|
| Auth | Keep existing custom JWT + httpOnly cookies. No NextAuth. |
| Scope | Generic architecture, seed Class 10 NCERT Math only. |
| Quiz content | Reuse existing `Question` model (filtered by topicId). Add `explanation` field. |
| Learn/Play/Practice content | New `Content` model with typed JSON payload. |
| Subjects page | Delete `/student/subjects`, redirect to `/student/learn`. |
| Play module games | Roadmap-exclusive. Not added to Game Vault. |
| Learn slide types | Text + SVG diagrams + one interactive (DraggableTriangle for trig). Pattern exists for extension. |

---

## Data Layer

### New model: `TopicProgress`

One row per (student, topic). Each module score is independent and nullable (null = never attempted).
Mastery is recomputed via EWMA only when the progress API is called.

```prisma
model TopicProgress {
  id            String    @id @default(cuid())
  studentId     String
  topicId       String
  learnScore    Float?
  playScore     Float?
  practiceScore Float?
  quizScore     Float?
  masteryScore  Float     @default(0)
  nextReviewAt  DateTime?
  attemptCount  Int       @default(0)
  lastAttemptAt DateTime?
  updatedAt     DateTime  @updatedAt

  student User  @relation(fields: [studentId], references: [id])
  topic   Topic @relation(fields: [topicId], references: [id])

  @@unique([studentId, topicId])
}
```

### New model: `Content`

One row per (topic, type). Type is LEARN | PLAY | PRACTICE only. QUIZ uses the existing `Question` model.

```prisma
enum ContentType {
  LEARN
  PLAY
  PRACTICE
}

model Content {
  id        String      @id @default(cuid())
  topicId   String
  type      ContentType
  payload   Json
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  topic Topic @relation(fields: [topicId], references: [id])

  @@unique([topicId, type])
}
```

### Payload shapes by type

**LEARN payload:**
```json
{
  "slides": [
    {
      "type": "text",
      "title": "string",
      "body": "string"
    },
    {
      "type": "diagram",
      "title": "string",
      "body": "string",
      "animationData": { "type": "RightTriangleDiagram" }
    },
    {
      "type": "interactive",
      "title": "string",
      "body": "string",
      "animationData": { "type": "DraggableTriangle" }
    }
  ]
}
```

**PLAY payload:**
```json
{
  "gameType": "FormulaMatchGame | EquationBalanceGame | TriangleRatioGame",
  "config": {}
}
```

**PRACTICE payload:**
```json
{
  "examples": [
    {
      "problem": "string",
      "steps": ["string"],
      "answer": "string"
    }
  ]
}
```

### Modification to existing `Question` model

Add nullable field: `explanation  String?`

Used by QuizRunner to show why an answer is correct/wrong after the student answers.

### New model: `TopicPrerequisite`

```prisma
model TopicPrerequisite {
  topicId        String
  prerequisiteId String

  topic        Topic @relation("TopicDeps", fields: [topicId], references: [id])
  prerequisite Topic @relation("TopicPrereqs", fields: [prerequisiteId], references: [id])

  @@id([topicId, prerequisiteId])
}
```

---

## API Routes

All new routes live in `app/api/learn/` as Next.js API routes. Auth via existing httpOnly cookie using the project's `getUserFromRequest` helper.

### `POST /api/learn/progress`

```
body: { topicId: string, module: 'learn'|'play'|'practice'|'quiz', score: number }

→ upserts TopicProgress row
→ updates the relevant module score field
→ recomputes masteryScore via EWMA when all 4 scores present, or immediately if any exist
→ writes nextReviewAt via getNextReviewDate(masteryScore)
→ adds XP to User.totalPoints (learn=10, play=25, practice=30, quiz=35)
→ updates User.lastActivityAt, increments streak if yesterday / resets if gap > 1 day
→ returns updated TopicProgress
```

### `GET /api/learn/subjects`

```
→ returns all Subjects
→ for each subject: avg masteryScore across student's TopicProgress rows for that subject
```

### `GET /api/learn/topics/[subjectId]`

```
→ returns all Topics for the subject (via Chapter → Subject)
→ for each topic: TopicProgress row (or null) + locked boolean
→ locked computed server-side: topological sort of TopicPrerequisite graph
   a topic is locked if any prerequisite has masteryScore < 0.4 or no progress row
```

### `GET /api/learn/review-due`

```
→ returns topics where nextReviewAt <= now AND masteryScore < 0.8
→ includes subject and chapter names for display
```

---

## Pages & Routing

All pages under `app/(authed)/student/learn/` — inside existing auth guard.

```
/student/learn                                  Subject roadmap
/student/learn/[subjectId]                      Topic roadmap
/student/learn/[subjectId]/[topicId]/learn      Learn module
/student/learn/[subjectId]/[topicId]/play       Play module
/student/learn/[subjectId]/[topicId]/practice   Practice module
/student/learn/[subjectId]/[topicId]/quiz       Quiz module
/student/learn/[subjectId]/[topicId]/review     Review dashboard
```

**Migration:**
- `app/(authed)/student/subjects/page.tsx` — deleted
- `app/(authed)/student/subjects/[subject]/[chapter]/page.tsx` — deleted
- `next.config.js` — add permanent redirect: `/student/subjects` → `/student/learn`
- `app/(authed)/layout.tsx` — update nav subjects link to `/student/learn`

---

## Component Tree

```
app/components/
  roadmap/
    SubjectNode.tsx          card: avg mastery ring, subject icon, name, CTA
    TopicNode.tsx            node: 4-part progress ring, lock overlay, due badge, star badge
    RoadmapPath.tsx          curved SVG connector between topic nodes on roadmap
  modules/
    LearnStepper.tsx         full-screen slide stepper with top progress bar + Prev/Next
    SlideRenderer.tsx        dispatches to TextSlide | DiagramSlide | InteractiveSlide
    PracticeExamples.tsx     worked example viewer: problem visible, steps reveal one-by-one
    QuizRunner.tsx           10-question MCQ stepper, post-answer feedback with explanation
    ReviewDashboard.tsx      mastery ring + module score bars + weak areas + next review date
  games/
    FormulaMatchGame.tsx     drag formula card to matching name card
    EquationBalanceGame.tsx  drag number tiles to balance both sides of equation
    TriangleRatioGame.tsx    click correct sin/cos/tan ratio for a displayed right triangle
  slides/
    TextSlide.tsx            title + body, Framer Motion slide-in (AnimatePresence)
    DiagramSlide.tsx         renders named SVG component by animationData.type
    InteractiveSlide.tsx     renders named interactive component by animationData.type
  interactive/
    DraggableTriangle.tsx    draggable vertices, live angle + sin/cos/tan readout
  ui/
    MasteryRing.tsx          circular SVG ring, stroke driven by 0–1 mastery score
lib/
  reviewEngine.ts            computeMastery, getNextReviewDate, isWeak (pure, no DB)
  prerequisites.ts           getLockedTopics: topological sort → Set<topicId>
prisma/
  seed-class10-math.ts       Class 10 NCERT Math: chapters, topics, prereqs, content, questions
```

---

## Review Engine (`lib/reviewEngine.ts`)

Pure functions, no DB calls.

```typescript
const ALPHA = 0.3
const WEIGHTS = { learn: 0.15, play: 0.25, practice: 0.30, quiz: 0.30 }

// Weighted combination of module scores → EWMA with previous mastery
computeMastery(oldMastery: number, scores: Partial<ModuleScores>): number

// Mastery band → days until next review
// < 0.4 → 1 day | < 0.6 → 3 days | < 0.8 → 7 days | >= 0.8 → 14 days
getNextReviewDate(mastery: number): Date

// True if mastery < 0.6 (topic needs more work)
isWeak(mastery: number): boolean
```

Weight rationale: Learn is passive (15%), Play builds intuition (25%), Practice builds procedure (30%), Quiz tests recall (30%).

---

## Prerequisite Locking (`lib/prerequisites.ts`)

```typescript
// Returns Set of topicIds that are locked for this student
getLockedTopics(
  topics: Topic[],
  prereqs: TopicPrerequisite[],
  progressMap: Map<topicId, TopicProgress>
): Set<string>
```

A topic is locked if **any** of its prerequisites has `masteryScore < 0.4` or has no `TopicProgress` row at all. This is evaluated via Kahn's algorithm (topological sort) so transitive locks work correctly.

---

## Module Behaviour

### Learn
- Fetches LEARN Content payload for the topic
- Renders slides via SlideRenderer (TextSlide | DiagramSlide | InteractiveSlide)
- Framer Motion AnimatePresence slide-in between slides
- On completing last slide: POST /api/learn/progress with score=100 (binary — watched = done)

### Play
- Reads gameType from PLAY Content payload
- Renders the correct game component from components/games/
- Each game is self-contained (own state, receives config prop)
- onComplete(score: number) callback → POST /api/learn/progress

### Practice
- Shows worked examples one at a time from PRACTICE Content payload
- Problem visible immediately; steps hidden behind "Show next step" reveals
- After all steps: "Did you understand?" → Yes (1.0) / Mostly (0.6) / No (0.2)
- Score = avg understanding rating × 100 across all examples → POST /api/learn/progress

### Quiz
- Fetches Questions from existing Question model filtered by topicId
- Shuffles and picks 10
- One question at a time; MCQ options
- After each answer: show correct/wrong + explanation (Question.explanation field)
- Score = (correct / 10) × 100 → POST /api/learn/progress
- Result screen: per-question breakdown with correct answers for wrong ones

### Review
- Reads TopicProgress + computes display values (no write)
- Shows: mastery ring (0–1), module score bar chart, weak area list (isWeak topics), next review date
- "Study again" buttons deep-link back to relevant module

---

## Seed Data: Class 10 NCERT Mathematics

File: `prisma/seed-class10-math.ts` — idempotent via upsert.

**Creates:**
- 1 Subject: "Mathematics (Class 10)"
- 15 Chapters (all NCERT Class 10 Math chapters)
- ~60 Topics (3–5 per chapter)
- ~20 TopicPrerequisite rows (key relationships, e.g. Trigonometry → Basic Geometry)
- ~60 Content rows (LEARN + PLAY + PRACTICE per topic)
- ~700 Question rows (8–12 MCQ per topic, with explanation field)

---

## Integration Points

| Existing | Change |
|---|---|
| `User.totalPoints` | Incremented by progress API on every module completion |
| `User.lastActivityAt` | Updated by progress API; streak computed from gap |
| `app/(authed)/layout.tsx` nav | Subjects link updated `/student/subjects` → `/student/learn` |
| `app/(authed)/student/subjects/` | Deleted (both page.tsx files) |
| `next.config.js` | Permanent redirect added |
| `prisma/schema.prisma` | TopicProgress + Content + TopicPrerequisite added; Question.explanation added |
| `server/routes/progress.js` | Not touched |
| Game Vault | Not touched |
| All admin/teacher/school flows | Not touched |

---

## Implementation Order

1. Prisma schema + migration
2. `lib/reviewEngine.ts` + `lib/prerequisites.ts`
3. Next.js API routes (`/api/learn/*`)
4. Subject roadmap page (`/student/learn`)
5. Topic roadmap page (`/student/learn/[subjectId]`)
6. Learn module
7. Quiz module
8. Practice module
9. Play module + FormulaMatchGame first, then EquationBalanceGame, TriangleRatioGame
10. Review module dashboard
11. Delete old subjects pages + add redirect + update nav
12. Class 10 NCERT Math seed script
