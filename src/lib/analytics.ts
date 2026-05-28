/**
 * Behavioural Economics Analytics Engine
 *
 * Analyses player behaviour to reveal:
 * 1. Stated vs revealed preferences (what they said matters vs what they invested in)
 * 2. Customer segmentation based on behavioural patterns
 * 3. Action-outcome correlations
 */

import { type DriverKey, DRIVERS } from "./types";

export interface PlayerAnalytics {
  playerId: number;
  name: string;
  willingnessToPay: number;
  statedPriorities: Record<DriverKey, number>; // what they said in setup
  revealedPriorities: Record<DriverKey, number>; // what they actually spent on
  totalSpent: number;
  actionsTaken: number;
  spendByDriver: Record<DriverKey, number>;
  segment: string;
  segmentColor: string;
}

export interface ActionOutcome {
  actionId: string;
  actionName: string;
  driver: DriverKey;
  timesChosen: number;
  totalCost: number;
  avgHealthImpact: number; // average driver health delta when this action was taken
  chosenBySegments: Record<string, number>; // segment -> count
}

export interface SegmentProfile {
  name: string;
  color: string;
  description: string;
  playerCount: number;
  avgWillingnessToPay: number;
  topStatedPriority: string;
  topRevealedPriority: string;
  avgSpend: number;
  statedVsRevealedGap: number; // how much stated differs from revealed (0=aligned, higher=more gap)
}

export interface GameAnalytics {
  players: PlayerAnalytics[];
  segments: SegmentProfile[];
  actionOutcomes: ActionOutcome[];
  correlations: {
    willingnessVsActions: number; // correlation between WTP and action count
    statedVsRevealed: number; // avg alignment across all players
    budgetEfficiency: number; // how well spending matched stated priorities
  };
}

// === Segment Definitions ===
// Segments are assigned based on behavioural patterns

interface SegmentRule {
  name: string;
  color: string;
  description: string;
  match: (p: {
    willingnessToPay: number;
    statedPriorities: Record<DriverKey, number>;
    spendByDriver: Record<DriverKey, number>;
    totalSpent: number;
    actionsTaken: number;
  }) => number; // score 0-1, highest wins
}

const SEGMENT_RULES: SegmentRule[] = [
  {
    name: "Reliability Seeker",
    color: "#3b82f6",
    description:
      "Prioritises uninterrupted supply above all. Willing to pay for certainty.",
    match: (p) => {
      const relShare =
        (p.spendByDriver.reliability || 0) /
        Math.max(1, p.totalSpent);
      const statedRel =
        p.statedPriorities.reliability /
        Math.max(
          1,
          Object.values(p.statedPriorities).reduce((a, b) => a + b, 0)
        );
      return (relShare * 0.6 + statedRel * 0.4);
    },
  },
  {
    name: "Growth Champion",
    color: "#f59e0b",
    description:
      "Focused on meeting new demand — airport, data centres, population growth.",
    match: (p) => {
      const growthShare =
        (p.spendByDriver.growthDemand || 0) /
        Math.max(1, p.totalSpent);
      const statedGrowth =
        p.statedPriorities.growthDemand /
        Math.max(
          1,
          Object.values(p.statedPriorities).reduce((a, b) => a + b, 0)
        );
      return (growthShare * 0.6 + statedGrowth * 0.4);
    },
  },
  {
    name: "Innovation Advocate",
    color: "#8b5cf6",
    description:
      "Invests in DER, EVs, smart grid, and new technology ahead of the curve.",
    match: (p) => {
      const innovShare =
        (p.spendByDriver.innovation || 0) /
        Math.max(1, p.totalSpent);
      const statedInnov =
        p.statedPriorities.innovation /
        Math.max(
          1,
          Object.values(p.statedPriorities).reduce((a, b) => a + b, 0)
        );
      return (innovShare * 0.6 + statedInnov * 0.4);
    },
  },
  {
    name: "Resilience Builder",
    color: "#10b981",
    description:
      "Prioritises hardening the grid against disasters and climate risks.",
    match: (p) => {
      const resShare =
        ((p.spendByDriver.gridResilience || 0) +
          (p.spendByDriver.ageingAssets || 0) * 0.5) /
        Math.max(1, p.totalSpent);
      const statedRes =
        (p.statedPriorities.gridResilience +
          p.statedPriorities.ageingAssets * 0.5) /
        Math.max(
          1,
          Object.values(p.statedPriorities).reduce((a, b) => a + b, 0)
        );
      return (resShare * 0.6 + statedRes * 0.4);
    },
  },
  {
    name: "Budget Conscious",
    color: "#ef4444",
    description:
      "Low willingness to pay but still engaged. Seeks value for money.",
    match: (p) => {
      // Low WTP relative to max, fewer actions
      const wtpScore = 1 - p.willingnessToPay / 500;
      const actScore = p.actionsTaken < 5 ? 0.3 : 0;
      return wtpScore * 0.7 + actScore * 0.3;
    },
  },
  {
    name: "Balanced Strategist",
    color: "#64748b",
    description:
      "Spreads investment evenly across drivers. No strong single preference.",
    match: (p) => {
      if (p.totalSpent === 0) return 0.1;
      const shares = Object.values(p.spendByDriver).map(
        (v) => v / Math.max(1, p.totalSpent)
      );
      const nonZero = shares.filter((s) => s > 0.05);
      // More even spread = higher score
      const evenness = nonZero.length >= 3 ? 0.5 : 0.2;
      const maxShare = Math.max(...shares);
      return evenness + (1 - maxShare) * 0.5;
    },
  },
];

export function assignSegment(p: {
  willingnessToPay: number;
  statedPriorities: Record<DriverKey, number>;
  spendByDriver: Record<DriverKey, number>;
  totalSpent: number;
  actionsTaken: number;
}): { name: string; color: string } {
  let bestScore = -1;
  let bestSegment = SEGMENT_RULES[SEGMENT_RULES.length - 1];

  for (const rule of SEGMENT_RULES) {
    const score = rule.match(p);
    if (score > bestScore) {
      bestScore = score;
      bestSegment = rule;
    }
  }

  return { name: bestSegment.name, color: bestSegment.color };
}

function getTopDriverLabel(scores: Record<DriverKey, number>): string {
  const entries = Object.entries(scores) as [DriverKey, number][];
  if (entries.length === 0) return "None";
  entries.sort((a, b) => b[1] - a[1]);
  const d = DRIVERS.find((d) => d.key === entries[0][0]);
  return d?.label ?? entries[0][0];
}

export function computeGameAnalytics(
  playersData: Array<{
    id: number;
    name: string;
    willingnessToPay: number;
    statedPriorities: Record<DriverKey, number>;
  }>,
  actions: Array<{
    playerId: number;
    actionId: string;
    actionName: string;
    actionCost: number;
    actionDriver: string;
    actionEffect: Record<string, number>;
    quarter: number;
  }>
): GameAnalytics {
  // 1. Compute per-player spend by driver
  const playerAnalytics: PlayerAnalytics[] = playersData.map((p) => {
    const playerActions = actions.filter((a) => a.playerId === p.id);
    const totalSpent = playerActions.reduce((s, a) => s + a.actionCost, 0);
    const spendByDriver: Record<DriverKey, number> = {
      growthDemand: 0,
      ageingAssets: 0,
      gridResilience: 0,
      innovation: 0,
      reliability: 0,
    };
    for (const a of playerActions) {
      const key = a.actionDriver as DriverKey;
      if (key in spendByDriver) {
        spendByDriver[key] += a.actionCost;
      }
    }

    // Revealed priorities = normalised spend proportions (0-100)
    const revealedPriorities: Record<DriverKey, number> = {
      growthDemand: 0,
      ageingAssets: 0,
      gridResilience: 0,
      innovation: 0,
      reliability: 0,
    };
    if (totalSpent > 0) {
      for (const key of Object.keys(revealedPriorities) as DriverKey[]) {
        revealedPriorities[key] = Math.round(
          (spendByDriver[key] / totalSpent) * 100
        );
      }
    }

    const seg = assignSegment({
      willingnessToPay: p.willingnessToPay,
      statedPriorities: p.statedPriorities,
      spendByDriver,
      totalSpent,
      actionsTaken: playerActions.length,
    });

    return {
      playerId: p.id,
      name: p.name,
      willingnessToPay: p.willingnessToPay,
      statedPriorities: p.statedPriorities,
      revealedPriorities,
      totalSpent,
      actionsTaken: playerActions.length,
      spendByDriver,
      segment: seg.name,
      segmentColor: seg.color,
    };
  });

  // 2. Segment profiles
  const segmentMap = new Map<string, PlayerAnalytics[]>();
  for (const pa of playerAnalytics) {
    if (!segmentMap.has(pa.segment)) segmentMap.set(pa.segment, []);
    segmentMap.get(pa.segment)!.push(pa);
  }

  const segments: SegmentProfile[] = Array.from(segmentMap.entries()).map(
    ([name, members]) => {
      const rule = SEGMENT_RULES.find((r) => r.name === name);
      const avgWTP =
        members.reduce((s, m) => s + m.willingnessToPay, 0) / members.length;
      const avgSpend =
        members.reduce((s, m) => s + m.totalSpent, 0) / members.length;

      // Aggregate stated & revealed
      const avgStated: Record<DriverKey, number> = {
        growthDemand: 0,
        ageingAssets: 0,
        gridResilience: 0,
        innovation: 0,
        reliability: 0,
      };
      const avgRevealed: Record<DriverKey, number> = { ...avgStated };
      for (const m of members) {
        for (const key of Object.keys(avgStated) as DriverKey[]) {
          avgStated[key] += m.statedPriorities[key] / members.length;
          avgRevealed[key] += m.revealedPriorities[key] / members.length;
        }
      }

      // Gap: sum of absolute differences between stated & revealed proportions
      let gap = 0;
      const statedTotal = Object.values(avgStated).reduce((a, b) => a + b, 0);
      for (const key of Object.keys(avgStated) as DriverKey[]) {
        const statedNorm = statedTotal > 0 ? (avgStated[key] / statedTotal) * 100 : 0;
        gap += Math.abs(statedNorm - avgRevealed[key]);
      }

      return {
        name,
        color: rule?.color ?? "#64748b",
        description: rule?.description ?? "",
        playerCount: members.length,
        avgWillingnessToPay: Math.round(avgWTP),
        topStatedPriority: getTopDriverLabel(avgStated),
        topRevealedPriority: getTopDriverLabel(avgRevealed),
        avgSpend: Math.round(avgSpend),
        statedVsRevealedGap: Math.round(gap),
      };
    }
  );

  // 3. Action outcomes
  const actionMap = new Map<
    string,
    { name: string; driver: DriverKey; count: number; totalCost: number; segments: Record<string, number> }
  >();
  for (const a of actions) {
    if (!actionMap.has(a.actionId)) {
      actionMap.set(a.actionId, {
        name: a.actionName,
        driver: a.actionDriver as DriverKey,
        count: 0,
        totalCost: 0,
        segments: {},
      });
    }
    const entry = actionMap.get(a.actionId)!;
    entry.count++;
    entry.totalCost += a.actionCost;
    const playerSeg =
      playerAnalytics.find((p) => p.playerId === a.playerId)?.segment ?? "Unknown";
    entry.segments[playerSeg] = (entry.segments[playerSeg] || 0) + 1;
  }

  const actionOutcomes: ActionOutcome[] = Array.from(actionMap.entries()).map(
    ([id, data]) => ({
      actionId: id,
      actionName: data.name,
      driver: data.driver,
      timesChosen: data.count,
      totalCost: Math.round(data.totalCost),
      avgHealthImpact: 0, // would need health snapshots per quarter for true delta
      chosenBySegments: data.segments,
    })
  );

  // 4. Correlations
  // WTP vs action count
  const wtps = playerAnalytics.map((p) => p.willingnessToPay);
  const acts = playerAnalytics.map((p) => p.actionsTaken);
  const willingnessVsActions = pearsonCorrelation(wtps, acts);

  // Stated vs revealed alignment (avg cosine similarity)
  let totalAlignment = 0;
  for (const pa of playerAnalytics) {
    const statedVec = Object.values(pa.statedPriorities);
    const revealedVec = Object.values(pa.revealedPriorities);
    totalAlignment += cosineSimilarity(statedVec, revealedVec);
  }
  const statedVsRevealed =
    playerAnalytics.length > 0 ? totalAlignment / playerAnalytics.length : 0;

  // Budget efficiency: did spend proportions match stated proportions?
  let totalEff = 0;
  for (const pa of playerAnalytics) {
    const statedTotal = Object.values(pa.statedPriorities).reduce(
      (a, b) => a + b,
      0
    );
    if (statedTotal === 0 || pa.totalSpent === 0) continue;
    const statedNorm = Object.values(pa.statedPriorities).map(
      (v) => (v / statedTotal) * 100
    );
    const revealedNorm = Object.values(pa.revealedPriorities);
    totalEff += cosineSimilarity(statedNorm, revealedNorm);
  }
  const budgetEfficiency =
    playerAnalytics.length > 0 ? totalEff / playerAnalytics.length : 0;

  return {
    players: playerAnalytics,
    segments,
    actionOutcomes,
    correlations: {
      willingnessVsActions: Math.round(willingnessVsActions * 100) / 100,
      statedVsRevealed: Math.round(statedVsRevealed * 100) / 100,
      budgetEfficiency: Math.round(budgetEfficiency * 100) / 100,
    },
  };
}

// === Math Helpers ===

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i] - mx;
    const yi = y[i] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
