# Roadmap Feature + Background Theme — Design Spec
**Date:** 2026-05-16  
**Project:** Quest Academy (SIH-base)  
**Branch:** feature/startup-mvp-sprint

---

## Overview

Two parallel workstreams:

1. **Roadmap Feature** — a three-level interactive map (Subject → Chapter → Topic) replacing the current flat `/student/learn` grid, with branching prerequisite-locked paths rendered as a combined horizontal+vertical snake.
2. **Background Theme Overhaul** — replace the flat `#07070F` background globally with a deep midnight-blue celestial nebula (stars, gradient glow) matching the reference PNG, plus per-subject biome colour accents on roadmap pages.

Both workstreams touch separate files and are built by parallel agents simultaneously.

---

## Part 1 — Roadmap Feature

### Routes

```
/student/roadmap                            ← Level 1: Subject World Map
/student/roadmap/[subjectId]                ← Level 2: Chapter Branching Map
/student/roadmap/[subjectId]/[chapterId]    ← Level 3: Topic Branching Map
```

The existing `/student/learn/**` pages are **kept untouched** — they are the deep learning modules (learn/quiz/practice/play/review). The roadmap is the navigation layer above them: browse → click topic → enter `/student/learn/[subjectId]/[topicId]/learn`.

The nav link currently labelled **"Subjects"** (`/student/learn`) in `app/(authed)/layout.tsx` is **renamed to "Roadmap"** and pointed to `/student/roadmap`.

### Level 1 — Subject World Map (`/student/roadmap`)

- Full-screen canvas area with the celestial background (stars + nebula).
- Student's enrolled class is read from their profile server-side; only subjects for that class are shown. No class picker UI.
- Each subject is a **large glowing circular node** (radius ~38px in SVG units) placed on a winding path that travels both horizontally and vertically across the canvas.
- Node states:
  - **All subjects are always unlocked** — any subject can be entered at any time.
  - Node ring shows per-subject mastery arc (0–100%, colour matches subject biome).
  - Subject icon (emoji) centred in the node.
  - Mastery % shown below icon.
- Hover tooltip shows subject name.
- Click → navigate to `/student/roadmap/[subjectId]`.
- Data source: existing `GET /api/learn/subjects` endpoint.
- Placeholder subjects when API returns empty: Math, Science, English, History, Geography, CS.

### Level 2 — Chapter Branching Map (`/student/roadmap/[subjectId]`)

- Same celestial background with subject biome accent colour.
- Nodes are **medium circles** (radius ~28px SVG units).
- Path layout: **combined horizontal + vertical snake** — nodes branch left, right, and upward from each parent. One node can have 1–3 children; children can share a parent (merge paths). Paths are curved dashed lines.
- Locking rules:
  - All subjects always open.
  - Chapters locked if their prerequisite chapter(s) are not yet completed (mastery ≥ 0.8 or all topics touched).
  - Locked nodes shown dimmed (opacity 0.5) with 🔒 icon; tooltip says "Complete [prerequisite name] first".
- Node states: completed (green ring, ✓), in-progress (violet ring, % shown), available (cyan ring, "New"), locked (dark, 🔒).
- Hover tooltip shows chapter name.
- Click unlocked node → navigate to `/student/roadmap/[subjectId]/[chapterId]`.
- Data source: existing `GET /api/learn/topics/:subjectId` (chapters array with topics).
- Placeholder: hardcoded 6–12 chapter nodes for Math if API is empty.

### Level 3 — Topic Branching Map (`/student/roadmap/[subjectId]/[chapterId]`)

- Same celestial background.
- Nodes are **small circles** (radius ~24px SVG units).
- Same branching path layout as Level 2 but smaller scale.
- Same locking rules — topic locked if prerequisite topic not complete.
- Hover tooltip shows topic name.
- Click unlocked topic → navigate to `/student/learn/[subjectId]/[topicId]/learn` (enters existing learning modules).
- A **side panel** slides in from the right on click (before navigating) showing:
  - Topic name, chapter name
  - Progress bars for each module (Learn / Play / Practice / Quiz)
  - Mastery ring
  - "Continue" button → routes to the most relevant module
  - "View Stats" link
- Data source: topics array from the same subjects API, filtered by chapterId.

### Branching Path Rendering

- Paths rendered as SVG on a scrollable canvas.
- Layout algorithm: nodes are positioned in a grid of tiers. Each tier can have 1–N nodes spread horizontally. Paths curve between parent and child using cubic bezier (`C` command). Dashed stroke, 60% opacity.
- The SVG viewBox is calculated from the node count and tier count, with the canvas scrolling vertically (and horizontally if very wide).
- No external graph library — pure SVG paths computed from a simple tier-based layout function.

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| `RoadmapCanvas` | `app/components/roadmap/RoadmapCanvas.tsx` | SVG wrapper, viewBox calc, scroll |
| `RoadmapNode` | `app/components/roadmap/RoadmapNode.tsx` | Single node (all 3 sizes), all states, tooltip |
| `RoadmapEdge` | `app/components/roadmap/RoadmapEdge.tsx` | Curved dashed path between two nodes |
| `RoadmapLayout` | `app/lib/roadmapLayout.ts` | Pure function: nodes[] → positioned nodes + edges |
| `TopicSidePanel` | `app/components/roadmap/TopicSidePanel.tsx` | Slide-in panel for topic detail (Level 3 only) |
| `/student/roadmap/page.tsx` | Level 1 page | |
| `/student/roadmap/[subjectId]/page.tsx` | Level 2 page | |
| `/student/roadmap/[subjectId]/[chapterId]/page.tsx` | Level 3 page | |

Existing `SubjectNode`, `TopicNode`, `RoadmapPath` components in `app/components/roadmap/` are **not deleted** — they remain for the old `/student/learn` pages. New components are added alongside.

### Data Shape fed to RoadmapLayout

```ts
interface RoadmapNode {
  id: string;
  label: string;
  icon?: string;           // emoji, subject level only
  state: 'completed' | 'in-progress' | 'available' | 'locked';
  mastery: number;         // 0–1
  prereqIds: string[];     // ids that must be complete before this unlocks
  biomeColor: string;      // hex, inherited from subject
}
```

`RoadmapLayout` returns `{ x, y }` for each node and a list of `{ fromId, toId }` edges. It uses a simple BFS-tier algorithm: root node at bottom tier, children spread horizontally above it, alternating left/right to create the snake feel.

---

## Part 2 — Background Theme Overhaul

### Global base background

Replace `--bg-deep: #07070F` in `app/globals.css` with a CSS gradient + pseudo-element star field:

```css
--bg-deep: #060614;  /* slightly more blue-tinted */
```

The `body` (or `.arcade-bg`) gets:
- `background: radial-gradient(ellipse at 30% 40%, #0d1035 0%, #080818 40%, #060614 100%)`
- A `::before` pseudo-element with a generated star-field using `box-shadow` (100–200 tiny white dots at random positions) — pure CSS, no images, no canvas.
- A subtle violet bloom at top-left and cyan bloom at bottom-right using `radial-gradient` layered via `background`.

This affects every page automatically since `body` has `background: var(--bg-deep)`.

### Per-subject biome accents (Roadmap pages only)

Each subject gets a biome token applied as a CSS class on the roadmap page wrapper:

| Subject | Biome class | Primary colour | Background tint |
|---------|-------------|---------------|-----------------|
| Mathematics | `.biome-math` | `#6B4BFF` violet | `#0d0a1f` |
| Science | `.biome-science` | `#18D6FF` cyan | `#07151f` |
| English | `.biome-english` | `#2DD46E` green | `#071510` |
| History | `.biome-history` | `#FFC93C` gold | `#120f00` |
| Geography | `.biome-geography` | `#FF4D8A` pink | `#150010` |
| Computer Science | `.biome-cs` | `#FF8A2B` orange | `#140800` |

Each biome class overrides:
- `--biome-color`: primary accent
- `--biome-bg`: deep tinted background
- `--biome-glow`: rgba version for box-shadows

The star field pseudo-element has its bloom colour inherit from `--biome-color`.

### Existing pages

All existing pages (`/student/page.tsx`, `/student/games`, etc.) automatically get the improved base background from the global CSS change. No per-page changes needed for the non-roadmap pages.

---

## What is NOT in scope

- No class picker UI (class derived from profile).
- No new backend endpoints — all data from existing `/api/learn/*` routes.
- No changes to `/student/learn/**` deep-learning module pages.
- No animated parallax or canvas-based star field — pure CSS only.
- No seeding new curriculum data — placeholder nodes used when API returns empty.

---

## Parallel Agent Split

| Agent | Owns | Files touched |
|-------|------|--------------|
| **Agent A** (Roadmap) | All three roadmap pages + new components + layout algorithm + nav link rename | `app/(authed)/student/roadmap/**`, `app/components/roadmap/RoadmapCanvas.tsx`, `RoadmapNode.tsx`, `RoadmapEdge.tsx`, `TopicSidePanel.tsx`, `app/lib/roadmapLayout.ts`, `app/(authed)/layout.tsx` (nav link only) |
| **Agent B** (Theme) | Global CSS background + biome tokens | `app/globals.css` |

Zero file overlap. Agent B can finish in minutes; Agent A is the larger workstream.
