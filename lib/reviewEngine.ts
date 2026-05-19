export interface ModuleScores {
  learnScore: number | null
  playScore: number | null
  practiceScore: number | null
  quizScore: number | null
}

const ALPHA = 0.3
const WEIGHTS = { learn: 0.15, play: 0.25, practice: 0.30, quiz: 0.30 }

/**
 * EWMA mastery update. Uses whatever module scores are present (null = skip).
 * combined = weighted average of non-null scores (weights renormalized to sum to 1).
 * newMastery = ALPHA * combined + (1 - ALPHA) * oldMastery
 */
export function computeMastery(oldMastery: number, scores: ModuleScores): number {
  const pairs: Array<[number, number]> = []
  if (scores.learnScore !== null) pairs.push([scores.learnScore / 100, WEIGHTS.learn])
  if (scores.playScore !== null) pairs.push([scores.playScore / 100, WEIGHTS.play])
  if (scores.practiceScore !== null) pairs.push([scores.practiceScore / 100, WEIGHTS.practice])
  if (scores.quizScore !== null) pairs.push([scores.quizScore / 100, WEIGHTS.quiz])

  if (pairs.length === 0) return oldMastery

  const totalWeight = pairs.reduce((sum, [, w]) => sum + w, 0)
  const combined = pairs.reduce((sum, [score, w]) => sum + score * (w / totalWeight), 0)

  return ALPHA * combined + (1 - ALPHA) * oldMastery
}

/**
 * Returns the date when this topic should next be reviewed.
 * mastery < 0.4  → 1 day
 * mastery < 0.6  → 3 days
 * mastery < 0.8  → 7 days
 * mastery >= 0.8 → 14 days
 */
export function getNextReviewDate(mastery: number): Date {
  const days = mastery < 0.4 ? 1 : mastery < 0.6 ? 3 : mastery < 0.8 ? 7 : 14
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

/** True if the topic needs more work (mastery below 0.6). */
export function isWeak(mastery: number): boolean {
  return mastery < 0.6
}
