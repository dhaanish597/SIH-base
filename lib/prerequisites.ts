export interface TopicNode {
  id: string
}

export interface PrereqEdge {
  topicId: string        // the topic that HAS the prerequisite
  prerequisiteId: string // the topic that must be mastered first
}

export interface ProgressEntry {
  topicId: string
  masteryScore: number
}

/**
 * Returns the Set of topicIds that are locked for a student.
 * A topic is locked if ANY of its prerequisites has masteryScore < 0.4
 * or has no progress entry at all.
 * Uses iterative evaluation (not Kahn's) for simplicity: any topic
 * whose prerequisite is locked is itself locked (transitive).
 */
export function getLockedTopics(
  topics: TopicNode[],
  prereqs: PrereqEdge[],
  progressMap: Map<string, ProgressEntry>
): Set<string> {
  const locked = new Set<string>()

  // Mark topics whose direct prerequisites are not mastered
  for (const prereq of prereqs) {
    const progress = progressMap.get(prereq.prerequisiteId)
    const mastered = progress !== undefined && progress.masteryScore >= 0.4
    if (!mastered) {
      locked.add(prereq.topicId)
    }
  }

  // Propagate: if a prerequisite is locked, the dependent is also locked
  let changed = true
  while (changed) {
    changed = false
    for (const prereq of prereqs) {
      if (locked.has(prereq.prerequisiteId) && !locked.has(prereq.topicId)) {
        locked.add(prereq.topicId)
        changed = true
      }
    }
  }

  return locked
}
