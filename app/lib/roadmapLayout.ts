// ── roadmapLayout.ts ─────────────────────────────────────────────────────────
// Pure TypeScript layout algorithm for the branching roadmap canvas.
// No external dependencies.

export interface RawNode {
  id: string;
  label: string;
  icon?: string;
  state: 'completed' | 'in-progress' | 'available' | 'locked';
  mastery: number;       // 0–1
  prereqIds: string[];
  biomeColor: string;
}

export interface PositionedNode extends RawNode {
  x: number;
  y: number;
  tier: number;
}

export interface Edge {
  fromId: string;
  toId: string;
}

export interface RoadmapLayout {
  nodes: PositionedNode[];
  edges: Edge[];
  width: number;
  height: number;
}

/**
 * Compute a tier-based layout for a set of nodes with prereq relationships.
 *
 * Tier 0 = bottom (root nodes with no prereqs).
 * Higher tier number = higher up on the canvas (smaller y value in SVG).
 * Children of the same parent spread horizontally; alternating left/right to
 * create a snake feel.
 */
export function computeLayout(nodes: RawNode[], nodeRadius: number): RoadmapLayout {
  if (nodes.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const hSpacing = nodeRadius * 4;
  const vSpacing = nodeRadius * 5;

  // ── 1. Build adjacency maps ──────────────────────────────────────────────
  const childrenOf = new Map<string, string[]>();
  const parentsOf  = new Map<string, string[]>();
  const nodeById   = new Map<string, RawNode>();

  for (const n of nodes) {
    nodeById.set(n.id, n);
    if (!childrenOf.has(n.id)) childrenOf.set(n.id, []);
    if (!parentsOf.has(n.id))  parentsOf.set(n.id, []);
  }

  for (const n of nodes) {
    for (const prereqId of n.prereqIds) {
      if (!nodeById.has(prereqId)) continue;
      // prereqId is a parent of n
      const children = childrenOf.get(prereqId) ?? [];
      children.push(n.id);
      childrenOf.set(prereqId, children);

      const parents = parentsOf.get(n.id) ?? [];
      parents.push(prereqId);
      parentsOf.set(n.id, parents);
    }
  }

  // ── 2. BFS tier assignment ───────────────────────────────────────────────
  const tierOf = new Map<string, number>();
  const queue: string[] = [];

  // Root nodes (no prereqs that exist in our set)
  for (const n of nodes) {
    const validPrereqs = n.prereqIds.filter(id => nodeById.has(id));
    if (validPrereqs.length === 0) {
      tierOf.set(n.id, 0);
      queue.push(n.id);
    }
  }

  // If no roots found (cycle?), assign all to tier 0
  if (queue.length === 0) {
    for (const n of nodes) {
      tierOf.set(n.id, 0);
      queue.push(n.id);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentTier = tierOf.get(current) ?? 0;
    const children = childrenOf.get(current) ?? [];
    for (const childId of children) {
      const existingTier = tierOf.get(childId);
      const newTier = currentTier + 1;
      if (existingTier === undefined || newTier > existingTier) {
        tierOf.set(childId, newTier);
        queue.push(childId);
      }
    }
  }

  // Nodes not reached (isolated)
  for (const n of nodes) {
    if (!tierOf.has(n.id)) tierOf.set(n.id, 0);
  }

  // ── 3. Group nodes by tier ───────────────────────────────────────────────
  const tiers = new Map<number, string[]>();
  for (const n of nodes) {
    const t = tierOf.get(n.id) ?? 0;
    const group = tiers.get(t) ?? [];
    group.push(n.id);
    tiers.set(t, group);
  }

  const maxTier = Math.max(...Array.from(tiers.keys()));
  const maxNodesInTier = Math.max(...Array.from(tiers.values()).map(g => g.length));

  const totalWidth  = Math.max(maxNodesInTier * hSpacing, hSpacing * 2);
  const totalHeight = (maxTier + 1) * vSpacing;

  // ── 4. Position nodes ────────────────────────────────────────────────────
  // Within each tier, alternate placement around the centre to create a snake.
  const xOf = new Map<string, number>();
  const yOf = new Map<string, number>();

  for (const [tierNum, tierNodes] of Array.from(tiers.entries())) {
    const count = tierNodes.length;
    // Sort within tier by parent x positions for consistency
    tierNodes.sort((a, b) => {
      const pa = parentsOf.get(a)?.[0];
      const pb = parentsOf.get(b)?.[0];
      const pax = pa ? (xOf.get(pa) ?? totalWidth / 2) : totalWidth / 2;
      const pbx = pb ? (xOf.get(pb) ?? totalWidth / 2) : totalWidth / 2;
      return pax - pbx;
    });

    const totalRowWidth = (count - 1) * hSpacing;
    const startX = (totalWidth - totalRowWidth) / 2;

    // Alternate: even indices left of centre, odd indices right (snake feel)
    const sorted = tierNodes.slice();
    if (count > 1) {
      // Interleave: place in centre-out alternating order
      const reordered: string[] = [];
      let lo = 0;
      let hi = sorted.length - 1;
      let toggle = true;
      while (lo <= hi) {
        if (toggle) reordered.push(sorted[lo++]);
        else         reordered.push(sorted[hi--]);
        toggle = !toggle;
      }
      // Now assign positions in original index order from the sorted array
      for (let i = 0; i < sorted.length; i++) {
        xOf.set(sorted[i], startX + i * hSpacing);
        // tier 0 = bottom → y = totalHeight - vSpacing/2
        // tier maxTier = top → y = vSpacing/2
        yOf.set(sorted[i], totalHeight - tierNum * vSpacing - vSpacing / 2);
      }
    } else {
      xOf.set(sorted[0], totalWidth / 2);
      yOf.set(sorted[0], totalHeight - tierNum * vSpacing - vSpacing / 2);
    }
  }

  // ── 5. Build positioned nodes ────────────────────────────────────────────
  const positionedNodes: PositionedNode[] = nodes.map(n => ({
    ...n,
    x: xOf.get(n.id) ?? totalWidth / 2,
    y: yOf.get(n.id) ?? totalHeight / 2,
    tier: tierOf.get(n.id) ?? 0,
  }));

  // ── 6. Build edges ───────────────────────────────────────────────────────
  const edges: Edge[] = [];
  for (const n of nodes) {
    for (const prereqId of n.prereqIds) {
      if (nodeById.has(prereqId)) {
        edges.push({ fromId: prereqId, toId: n.id });
      }
    }
  }

  return {
    nodes: positionedNodes,
    edges,
    width: totalWidth,
    height: totalHeight,
  };
}
