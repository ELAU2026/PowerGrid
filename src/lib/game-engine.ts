import {
  type PlayerSetup,
  type DriverScores,
  type DriverKey,
  type GridState,
  type QuarterAction,
  type Disaster,
  type Scenario,
  type GameEvent,
  type GridAsset,
  INITIAL_DRIVER_SCORES,
  DISASTERS,
  SCENARIOS,
} from "./types";

// === Scoring ===

export function calculateAverageWillingness(players: PlayerSetup[]): number {
  const submitted = players.filter((p) => p.submitted);
  if (submitted.length === 0) return 0;
  return Math.round(
    submitted.reduce((sum, p) => sum + p.willingnessToPay, 0) / submitted.length
  );
}

export function calculateWeightedDriverScores(players: PlayerSetup[]): DriverScores {
  const submitted = players.filter((p) => p.submitted);
  if (submitted.length === 0) return { ...INITIAL_DRIVER_SCORES };

  const totalWillingness = submitted.reduce((sum, p) => sum + p.willingnessToPay, 0);
  if (totalWillingness === 0) return { ...INITIAL_DRIVER_SCORES };

  const keys: DriverKey[] = [
    "growthDemand",
    "ageingAssets",
    "gridResilience",
    "innovation",
    "reliability",
  ];

  const scores: DriverScores = { ...INITIAL_DRIVER_SCORES };

  for (const key of keys) {
    let weightedSum = 0;
    for (const player of submitted) {
      const weight = player.willingnessToPay / totalWillingness;
      weightedSum += player.driverImportance[key] * weight;
    }
    scores[key] = Math.round(weightedSum);
  }

  return scores;
}

// === Server-side scoring (raw DB data) ===

interface PlayerData {
  willingnessToPay: number;
  driverImportance: Record<DriverKey, number>;
}

export function calculateAverageWillingnessFromPlayers(
  players: PlayerData[]
): number {
  if (players.length === 0) return 0;
  return Math.round(
    players.reduce((sum, p) => sum + p.willingnessToPay, 0) / players.length
  );
}

export function calculateWeightedDriverScoresFromPlayers(
  players: PlayerData[]
): DriverScores {
  if (players.length === 0) return { ...INITIAL_DRIVER_SCORES };

  const totalWillingness = players.reduce(
    (sum, p) => sum + p.willingnessToPay,
    0
  );
  if (totalWillingness === 0) return { ...INITIAL_DRIVER_SCORES };

  const keys: DriverKey[] = [
    "growthDemand",
    "ageingAssets",
    "gridResilience",
    "innovation",
    "reliability",
  ];

  const scores: DriverScores = { ...INITIAL_DRIVER_SCORES };

  for (const key of keys) {
    let weightedSum = 0;
    for (const player of players) {
      const weight = player.willingnessToPay / totalWillingness;
      weightedSum += player.driverImportance[key] * weight;
    }
    scores[key] = Math.round(weightedSum);
  }

  return scores;
}

// === Max slider value based on willingness to pay ===
// Higher willingness = more budget = can allocate more importance
// At $50/quarter, max slider is 40. At $500/quarter, max slider is 100.
export function getMaxSliderValue(willingnessToPay: number): number {
  const minPay = 50;
  const maxPay = 500;
  const minSlider = 40;
  const maxSlider = 100;
  const ratio = (willingnessToPay - minPay) / (maxPay - minPay);
  return Math.round(minSlider + ratio * (maxSlider - minSlider));
}

// === Initial Grid State ===

function createInitialAssets(): GridAsset[] {
  return [
    {
      id: "sub-1",
      name: "Liverpool Zone Substation",
      type: "substation",
      health: 65,
      capacity: 200,
      age: 35,
      maxAge: 50,
    },
    {
      id: "sub-2",
      name: "Penrith Zone Substation",
      type: "substation",
      health: 45,
      capacity: 150,
      age: 42,
      maxAge: 50,
    },
    {
      id: "sub-3",
      name: "Badgerys Creek Substation",
      type: "substation",
      health: 95,
      capacity: 300,
      age: 2,
      maxAge: 50,
    },
    {
      id: "tx-1",
      name: "Western Transmission Line",
      type: "transmission",
      health: 55,
      capacity: 500,
      age: 38,
      maxAge: 60,
    },
    {
      id: "dist-1",
      name: "Aerotropolis Distribution Network",
      type: "distribution",
      health: 90,
      capacity: 100,
      age: 3,
      maxAge: 40,
    },
    {
      id: "dist-2",
      name: "Oran Park Distribution",
      type: "distribution",
      health: 70,
      capacity: 80,
      age: 15,
      maxAge: 40,
    },
    {
      id: "solar-1",
      name: "Community Solar Farm",
      type: "solar",
      health: 85,
      capacity: 50,
      age: 5,
      maxAge: 25,
    },
    {
      id: "battery-1",
      name: "Grid Battery Storage",
      type: "battery",
      health: 90,
      capacity: 30,
      age: 2,
      maxAge: 15,
    },
  ];
}

export function createInitialGridState(
  avgPay: number,
  playerCount: number
): GridState {
  // Quarterly revenue = aggregate of all customers' willingness to pay
  const quarterlyRevenue = playerCount * avgPay;
  return {
    population: 350000,
    demand: 800, // MW
    capacity: 1050, // MW (some headroom)
    reliability: 92,
    customerSatisfaction: 70,
    budget: quarterlyRevenue * 2, // start with 2 quarters of runway
    quarterlyRevenue,
    assets: createInitialAssets(),
  };
}

// === Actions ===
//
// Action costs are expressed as fractions of the quarterly revenue so the
// economy scales naturally with player count and average willingness to pay.
// With all players taking a turn each quarter, the group can typically afford
// 2-4 actions total depending on the mix of cheap vs expensive choices.

interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  /** Cost as a fraction of quarterly revenue (e.g. 0.55 = 55% of one quarter's income) */
  costFraction: number;
  driver: DriverKey;
  effect: Partial<Record<DriverKey, number>>;
}

const ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "build-substation",
    name: "Build New Substation",
    description: "Construct a new zone substation near the airport precinct",
    costFraction: 0.55,
    driver: "growthDemand",
    effect: { growthDemand: 15, reliability: 5 },
  },
  {
    id: "upgrade-transmission",
    name: "Upgrade Transmission Lines",
    description: "Replace ageing transmission conductors with high-capacity lines",
    costFraction: 0.40,
    driver: "ageingAssets",
    effect: { ageingAssets: 20, reliability: 10 },
  },
  {
    id: "storm-hardening",
    name: "Storm Hardening Program",
    description: "Underground critical cables and reinforce pole infrastructure",
    costFraction: 0.35,
    driver: "gridResilience",
    effect: { gridResilience: 20, ageingAssets: 5 },
  },
  {
    id: "install-solar",
    name: "Community Solar Installation",
    description: "Deploy rooftop solar across new housing developments",
    costFraction: 0.20,
    driver: "innovation",
    effect: { innovation: 15, growthDemand: 5 },
  },
  {
    id: "ev-infrastructure",
    name: "EV Charging Network",
    description: "Install smart EV chargers across the Aerotropolis precinct",
    costFraction: 0.28,
    driver: "innovation",
    effect: { innovation: 20, growthDemand: 5 },
  },
  {
    id: "battery-storage",
    name: "Grid Battery Storage",
    description: "Deploy large-scale battery to manage peak demand and solar integration",
    costFraction: 0.48,
    driver: "gridResilience",
    effect: { gridResilience: 15, innovation: 10, reliability: 5 },
  },
  {
    id: "maintenance-program",
    name: "Asset Maintenance Blitz",
    description: "Accelerated inspection and repair program for ageing equipment",
    costFraction: 0.22,
    driver: "ageingAssets",
    effect: { ageingAssets: 15, reliability: 10 },
  },
  {
    id: "smart-grid",
    name: "Smart Grid Sensors",
    description: "Deploy IoT sensors for real-time grid monitoring and automated responses",
    costFraction: 0.30,
    driver: "innovation",
    effect: { innovation: 15, reliability: 10, gridResilience: 5 },
  },
  {
    id: "demand-response",
    name: "Demand Response Program",
    description: "Incentivise customers to reduce usage during peak periods",
    costFraction: 0.15,
    driver: "reliability",
    effect: { reliability: 15, innovation: 5 },
  },
  {
    id: "data-centre-connection",
    name: "Data Centre Direct Feed",
    description: "Build dedicated high-voltage connection for new data centre campus",
    costFraction: 0.60,
    driver: "growthDemand",
    effect: { growthDemand: 25, reliability: 5 },
  },
];

export function generateActions(
  _driverScores: DriverScores,
  quarter: number,
  grid: GridState
): QuarterAction[] {
  const rev = grid.quarterlyRevenue;

  // Costs inflate slightly each quarter (5% compounding)
  const costMultiplier = 1 + (quarter - 1) * 0.05;

  const baseActions: QuarterAction[] = ACTION_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    cost: Math.round(t.costFraction * rev * costMultiplier),
    driver: t.driver,
    effect: t.effect,
  }));

  // Emergency actions (premium-priced) only when grid is stressed
  const emergencyActions: QuarterAction[] = [];
  if (grid.reliability < 70) {
    emergencyActions.push({
      id: "emergency-repair",
      name: "Emergency Grid Repair",
      description: "Emergency crews deployed to restore critical infrastructure",
      cost: Math.round(0.35 * rev * costMultiplier),
      driver: "reliability",
      effect: { reliability: 25, ageingAssets: 5 },
    });
  }
  if (grid.demand > grid.capacity * 0.9) {
    emergencyActions.push({
      id: "emergency-capacity",
      name: "Emergency Capacity Boost",
      description: "Deploy temporary generation to prevent blackouts",
      cost: Math.round(0.40 * rev * costMultiplier),
      driver: "growthDemand",
      effect: { growthDemand: 10, reliability: 15 },
    });
  }

  return [...baseActions, ...emergencyActions];
}

// === Scenarios & Disasters ===

/**
 * Select a scenario for this quarter. Every quarter gets a scenario — this is
 * core to the behavioural economics testing. The scenario is what frames the
 * player's decision and lets us measure whether they respond to it.
 *
 * Severity escalates as the game progresses, and we avoid repeating recent
 * scenarios by tracking which IDs were already used.
 */
export function selectScenario(
  quarter: number,
  maxQuarters: number,
  usedScenarioIds: string[]
): Scenario {
  // Determine target severity based on game progression
  const progress = quarter / maxQuarters;
  const severityPool: Scenario["severity"][] =
    progress < 0.25
      ? ["minor", "moderate"]
      : progress < 0.5
        ? ["moderate", "severe"]
        : progress < 0.75
          ? ["moderate", "severe", "catastrophic"]
          : ["severe", "catastrophic"];

  // Filter to unused scenarios matching target severity, fall back to any unused
  let candidates = SCENARIOS.filter(
    (s) => !usedScenarioIds.includes(s.id) && severityPool.includes(s.severity)
  );
  if (candidates.length === 0) {
    candidates = SCENARIOS.filter(
      (s) => !usedScenarioIds.includes(s.id)
    );
  }
  if (candidates.length === 0) {
    // All scenarios used — reset and pick any matching severity
    candidates = SCENARIOS.filter((s) => severityPool.includes(s.severity));
    if (candidates.length === 0) candidates = [...SCENARIOS];
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Convert a Scenario to a legacy Disaster for damage application */
export function scenarioToDisaster(s: Scenario): Disaster {
  return {
    id: s.id,
    name: s.name,
    description: s.headline,
    severity: s.severity,
    damageType: s.damageType,
    icon: s.icon,
  };
}

/** Legacy random roll — kept for backward compat but no longer the primary path */
export function rollForDisaster(quarter: number): Disaster | null {
  const baseChance = 0.25;
  const quarterBonus = quarter * 0.03;
  const chance = Math.min(baseChance + quarterBonus, 0.7);
  if (Math.random() > chance) return null;
  const idx = Math.floor(Math.random() * DISASTERS.length);
  return DISASTERS[idx];
}

export function applyDisasterDamage(
  grid: GridState,
  driverHealth: DriverScores,
  disaster: Disaster
): { grid: GridState; driverHealth: DriverScores } {
  const newGrid = { ...grid };
  const newHealth = { ...driverHealth };

  const severityMultiplier: Record<string, number> = {
    minor: 0.5,
    moderate: 1,
    severe: 1.5,
    catastrophic: 2,
  };
  const mult = severityMultiplier[disaster.severity] ?? 1;

  // Damage driver health
  for (const driver of disaster.damageType) {
    newHealth[driver] = Math.max(0, newHealth[driver] - Math.round(15 * mult));
  }

  // Damage grid stats
  newGrid.reliability = Math.max(0, newGrid.reliability - Math.round(10 * mult));
  newGrid.customerSatisfaction = Math.max(
    0,
    newGrid.customerSatisfaction - Math.round(8 * mult)
  );

  // Damage random assets
  const damageCount = Math.min(
    Math.ceil(mult),
    newGrid.assets.length
  );
  const shuffled = [...newGrid.assets].sort(() => Math.random() - 0.5);
  newGrid.assets = newGrid.assets.map((asset) => {
    if (shuffled.slice(0, damageCount).find((a) => a.id === asset.id)) {
      return {
        ...asset,
        health: Math.max(0, asset.health - Math.round(20 * mult)),
      };
    }
    return asset;
  });

  // Budget hit for emergency response — scaled to ~15% of quarterly revenue per severity unit
  const emergencyCost = Math.round(grid.quarterlyRevenue * 0.15 * mult);
  newGrid.budget = Math.max(0, newGrid.budget - emergencyCost);

  return { grid: newGrid, driverHealth: newHealth };
}

// === Quarter Progression ===

export function progressQuarter(
  grid: GridState,
  driverHealth: DriverScores,
  quarter: number
): { grid: GridState; driverHealth: DriverScores; events: GameEvent[] } {
  const newGrid = { ...grid };
  const newHealth = { ...driverHealth };
  const events: GameEvent[] = [];

  // Population growth (airport-driven)
  const growthRate = 0.02 + quarter * 0.003; // accelerating growth
  newGrid.population = Math.round(newGrid.population * (1 + growthRate));

  // Demand growth
  const demandGrowth = 15 + quarter * 3;
  newGrid.demand += demandGrowth;

  if (newGrid.demand > newGrid.capacity * 0.95) {
    events.push({
      quarter,
      description: "Grid capacity critically strained — demand approaching maximum!",
      type: "warning",
      icon: "⚠️",
    });
  }

  // Revenue — customers pay in each quarter
  newGrid.budget += newGrid.quarterlyRevenue;

  // Operating costs — base ~40% of revenue, rising ~1.5% of revenue per quarter
  // This leaves ~60% of each quarter's revenue for discretionary investment early on,
  // narrowing to ~36% by Q16, reflecting rising costs of maintaining a growing grid.
  const opex = Math.round(
    newGrid.quarterlyRevenue * (0.40 + quarter * 0.015)
  );
  newGrid.budget -= opex;

  // Asset aging
  newGrid.assets = newGrid.assets.map((asset) => {
    const aged = { ...asset, age: asset.age + 0.25 }; // quarter of a year
    if (aged.age > aged.maxAge * 0.8) {
      aged.health = Math.max(0, aged.health - 3);
    }
    if (aged.health < 30) {
      newHealth.ageingAssets = Math.max(0, newHealth.ageingAssets - 2);
      newHealth.reliability = Math.max(0, newHealth.reliability - 1);
    }
    return aged;
  });

  // Natural driver health decay
  const decayKeys: DriverKey[] = [
    "growthDemand",
    "ageingAssets",
    "gridResilience",
    "innovation",
    "reliability",
  ];
  for (const key of decayKeys) {
    newHealth[key] = Math.max(0, newHealth[key] - 2);
  }

  // Reliability based on capacity margin
  const capacityMargin = (newGrid.capacity - newGrid.demand) / newGrid.capacity;
  if (capacityMargin < 0.05) {
    newGrid.reliability = Math.max(0, newGrid.reliability - 5);
    events.push({
      quarter,
      description: "Rolling blackouts due to insufficient capacity",
      type: "disaster",
      icon: "🔴",
    });
  } else if (capacityMargin < 0.15) {
    newGrid.reliability = Math.max(0, newGrid.reliability - 2);
  }

  // Customer satisfaction based on average driver health
  const avgHealth =
    Object.values(newHealth).reduce((a, b) => a + b, 0) / 5;
  newGrid.customerSatisfaction = Math.round(
    newGrid.customerSatisfaction * 0.7 + avgHealth * 0.3
  );

  // Growth milestone events
  if (quarter === 4) {
    events.push({
      quarter,
      description: "Western Sydney Airport Phase 1 opens — massive demand increase!",
      type: "growth",
      icon: "✈️",
    });
    newGrid.demand += 50;
  }
  if (quarter === 8) {
    events.push({
      quarter,
      description: "New data centre campus comes online in the Aerotropolis",
      type: "growth",
      icon: "🖥️",
    });
    newGrid.demand += 80;
  }
  if (quarter === 12) {
    events.push({
      quarter,
      description: "Airport Phase 2 expansion doubles passenger capacity",
      type: "growth",
      icon: "✈️",
    });
    newGrid.demand += 100;
  }

  return { grid: newGrid, driverHealth: newHealth, events };
}

// === Apply Player Action ===

export function applyAction(
  grid: GridState,
  driverHealth: DriverScores,
  action: QuarterAction
): { grid: GridState; driverHealth: DriverScores } {
  const newGrid = { ...grid };
  const newHealth = { ...driverHealth };

  // Deduct cost
  newGrid.budget -= action.cost;

  // Apply driver effects
  for (const [key, value] of Object.entries(action.effect)) {
    if (key in newHealth) {
      newHealth[key as DriverKey] = Math.min(
        100,
        newHealth[key as DriverKey] + (value as number)
      );
    }
  }

  // Specific effects by action type
  if (action.id === "build-substation" || action.id === "data-centre-connection") {
    newGrid.capacity += 100;
    newGrid.assets.push({
      id: `asset-${Date.now()}`,
      name: action.name,
      type: "substation",
      health: 100,
      capacity: 100,
      age: 0,
      maxAge: 50,
    });
  }
  if (action.id === "install-solar") {
    newGrid.capacity += 30;
    newGrid.assets.push({
      id: `solar-${Date.now()}`,
      name: "New Solar Installation",
      type: "solar",
      health: 100,
      capacity: 30,
      age: 0,
      maxAge: 25,
    });
  }
  if (action.id === "battery-storage") {
    newGrid.capacity += 20;
    newGrid.assets.push({
      id: `battery-${Date.now()}`,
      name: "New Battery Storage",
      type: "battery",
      health: 100,
      capacity: 20,
      age: 0,
      maxAge: 15,
    });
  }
  if (action.id === "ev-infrastructure") {
    newGrid.assets.push({
      id: `ev-${Date.now()}`,
      name: "EV Charging Station",
      type: "ev-charger",
      health: 100,
      capacity: 10,
      age: 0,
      maxAge: 20,
    });
  }
  if (action.id === "upgrade-transmission" || action.id === "maintenance-program") {
    newGrid.assets = newGrid.assets.map((a) =>
      a.health < 70 ? { ...a, health: Math.min(100, a.health + 25) } : a
    );
  }
  if (action.id === "emergency-capacity") {
    newGrid.capacity += 50;
  }
  if (action.id === "emergency-repair") {
    newGrid.reliability = Math.min(100, newGrid.reliability + 15);
    newGrid.assets = newGrid.assets.map((a) =>
      a.health < 50 ? { ...a, health: Math.min(100, a.health + 20) } : a
    );
  }
  if (action.id === "demand-response") {
    newGrid.demand = Math.max(0, newGrid.demand - 20);
  }
  if (action.id === "storm-hardening") {
    newGrid.reliability = Math.min(100, newGrid.reliability + 5);
  }
  if (action.id === "smart-grid") {
    newGrid.reliability = Math.min(100, newGrid.reliability + 5);
  }

  return { grid: newGrid, driverHealth: newHealth };
}

// === Final Score ===

export function calculateFinalScore(
  grid: GridState,
  driverHealth: DriverScores,
  weightedDriverScores: DriverScores
): number {
  let score = 0;

  // Driver health weighted by what customers care about
  const driverKeys: DriverKey[] = [
    "growthDemand",
    "ageingAssets",
    "gridResilience",
    "innovation",
    "reliability",
  ];
  const totalWeight = Object.values(weightedDriverScores).reduce((a, b) => a + b, 0);

  if (totalWeight > 0) {
    for (const key of driverKeys) {
      const weight = weightedDriverScores[key] / totalWeight;
      score += driverHealth[key] * weight * 3; // max ~300
    }
  }

  // Grid performance bonuses
  score += grid.reliability * 1.5; // max 150
  score += grid.customerSatisfaction; // max 100

  // Capacity margin bonus
  const margin = (grid.capacity - grid.demand) / grid.capacity;
  if (margin > 0.2) score += 50;
  else if (margin > 0.1) score += 30;
  else if (margin > 0) score += 10;

  // Budget management
  if (grid.budget > 0) score += Math.min(50, grid.budget / 20);

  // Asset health bonus
  const avgAssetHealth =
    grid.assets.reduce((s, a) => s + a.health, 0) / grid.assets.length;
  score += avgAssetHealth * 0.5;

  return Math.round(score);
}

export function getScoreGrade(score: number): {
  grade: string;
  label: string;
  color: string;
} {
  if (score >= 500) return { grade: "A+", label: "World-Class Grid", color: "text-emerald-400" };
  if (score >= 400) return { grade: "A", label: "Excellent Performance", color: "text-green-400" };
  if (score >= 300) return { grade: "B", label: "Good Management", color: "text-blue-400" };
  if (score >= 200) return { grade: "C", label: "Adequate Service", color: "text-yellow-400" };
  if (score >= 100) return { grade: "D", label: "Struggling Grid", color: "text-orange-400" };
  return { grade: "F", label: "Grid Failure", color: "text-red-400" };
}
