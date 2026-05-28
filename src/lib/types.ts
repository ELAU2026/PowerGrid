// === Power Grid Game Types ===

export type GamePhase = "lobby" | "player-setup" | "results" | "playing" | "game-over";

export type DriverKey =
  | "growthDemand"
  | "ageingAssets"
  | "gridResilience"
  | "innovation"
  | "reliability";

export interface DriverConfig {
  key: DriverKey;
  label: string;
  description: string;
  icon: string;
}

export const DRIVERS: DriverConfig[] = [
  {
    key: "growthDemand",
    label: "Growth Demands",
    description:
      "Meeting demand from new airport development, data centres, and population growth in Western Sydney",
    icon: "📈",
  },
  {
    key: "ageingAssets",
    label: "Replacing Ageing Assets",
    description:
      "Replacing ageing infrastructure before it fails — substations, cables, and poles nearing end-of-life",
    icon: "🔧",
  },
  {
    key: "gridResilience",
    label: "Grid Resilience",
    description:
      "Hardening the grid against storms, heatwaves, bushfires, floods, and other disasters",
    icon: "🛡️",
  },
  {
    key: "innovation",
    label: "Innovation & DER/EV",
    description:
      "Enabling customer solar, batteries, EVs, and smart grid technology integration",
    icon: "⚡",
  },
  {
    key: "reliability",
    label: "Reliability",
    description:
      "Ensuring consistent, uninterrupted power supply to your connection",
    icon: "💡",
  },
];

export interface PlayerSetup {
  id: number;
  name: string;
  willingnessToPay: number; // $ per quarter (50-500)
  driverImportance: Record<DriverKey, number>; // 0-100 for each, capped by willingness
  submitted: boolean;
}

export interface GridAsset {
  id: string;
  name: string;
  type: "substation" | "transmission" | "distribution" | "solar" | "battery" | "ev-charger";
  health: number; // 0-100
  capacity: number;
  age: number; // years
  maxAge: number;
}

export interface Disaster {
  id: string;
  name: string;
  description: string;
  severity: "minor" | "moderate" | "severe" | "catastrophic";
  damageType: DriverKey[];
  icon: string;
}

export const DISASTERS: Disaster[] = [
  {
    id: "heatwave",
    name: "Extreme Heatwave",
    description: "Record temperatures cause grid overload and transformer failures",
    severity: "severe",
    damageType: ["gridResilience", "reliability"],
    icon: "🌡️",
  },
  {
    id: "storm",
    name: "Severe Storm",
    description: "High winds and lightning damage power lines and substations",
    severity: "moderate",
    damageType: ["gridResilience", "ageingAssets"],
    icon: "⛈️",
  },
  {
    id: "bushfire",
    name: "Bushfire",
    description: "Bushfire threatens transmission corridors and forces shutdowns",
    severity: "catastrophic",
    damageType: ["gridResilience", "reliability", "ageingAssets"],
    icon: "🔥",
  },
  {
    id: "flood",
    name: "Flash Flooding",
    description: "Flooding damages underground cables and substation equipment",
    severity: "severe",
    damageType: ["gridResilience", "ageingAssets"],
    icon: "🌊",
  },
  {
    id: "demand-spike",
    name: "Data Centre Demand Surge",
    description: "New hyperscale data centre comes online, straining capacity",
    severity: "moderate",
    damageType: ["growthDemand"],
    icon: "🖥️",
  },
  {
    id: "ev-surge",
    name: "EV Charging Peak",
    description: "Mass EV adoption causes evening charging peaks beyond grid capacity",
    severity: "minor",
    damageType: ["innovation", "growthDemand"],
    icon: "🔌",
  },
  {
    id: "solar-duck",
    name: "Solar Duck Curve Crisis",
    description: "Midday solar oversupply followed by steep evening ramp creates grid instability",
    severity: "moderate",
    damageType: ["innovation", "gridResilience"],
    icon: "🦆",
  },
  {
    id: "cyber-attack",
    name: "Cyber Attack",
    description: "Sophisticated cyber attack targets grid control systems",
    severity: "severe",
    damageType: ["reliability", "innovation"],
    icon: "🏴‍☠️",
  },
  {
    id: "equipment-failure",
    name: "Major Equipment Failure",
    description: "Critical zone substation transformer fails catastrophically",
    severity: "catastrophic",
    damageType: ["ageingAssets", "reliability"],
    icon: "💥",
  },
  {
    id: "airport-opening",
    name: "Airport Phase Opening",
    description: "New terminal opens at Western Sydney Airport, requiring massive capacity boost",
    severity: "moderate",
    damageType: ["growthDemand"],
    icon: "✈️",
  },
];

export interface GameEvent {
  quarter: number;
  description: string;
  type: "disaster" | "growth" | "achievement" | "warning";
  icon: string;
}

export interface QuarterAction {
  id: string;
  name: string;
  description: string;
  cost: number;
  driver: DriverKey;
  effect: Partial<Record<DriverKey, number>>; // score boosts
}

export interface GridState {
  population: number;
  demand: number; // MW
  capacity: number; // MW
  reliability: number; // 0-100%
  customerSatisfaction: number; // 0-100
  budget: number; // $ remaining
  quarterlyRevenue: number;
  assets: GridAsset[];
}

export interface DriverScores {
  growthDemand: number;
  ageingAssets: number;
  gridResilience: number;
  innovation: number;
  reliability: number;
}

export interface GameState {
  phase: GamePhase;
  playerCount: number;
  players: PlayerSetup[];
  currentPlayerSetup: number; // index of player currently setting up
  averageWillingnessToPay: number;
  weightedDriverScores: DriverScores;
  quarter: number; // current quarter (1-based)
  maxQuarters: number;
  currentPlayerTurn: number; // index of player whose turn it is
  grid: GridState;
  driverHealth: DriverScores; // current health of each driver area (0-100)
  events: GameEvent[];
  activeDisaster: Disaster | null;
  availableActions: QuarterAction[];
  score: number;
}

export const INITIAL_DRIVER_SCORES: DriverScores = {
  growthDemand: 0,
  ageingAssets: 0,
  gridResilience: 0,
  innovation: 0,
  reliability: 0,
};

export const MAX_WILLINGNESS_TO_PAY = 500;
export const MIN_WILLINGNESS_TO_PAY = 50;
export const QUARTERLY_BASE_COST = 200; // base operating cost per quarter
