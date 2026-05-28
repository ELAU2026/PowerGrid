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

/**
 * A Scenario is a richer version of a Disaster — it's what players see each
 * quarter before choosing their action. It includes a customer-impact narrative,
 * the question posed to the player, and the action IDs that would logically
 * address the scenario (used to measure responsiveness in analytics).
 */
export interface Scenario {
  id: string;
  name: string;
  icon: string;
  severity: "minor" | "moderate" | "severe" | "catastrophic";
  /** What happened — the headline */
  headline: string;
  /** The customer-impact story — what this means for the player personally */
  customerImpact: string;
  /** The question / framing shown to the player before they pick an action */
  decisionPrompt: string;
  /** Which driver areas this scenario damages */
  damageType: DriverKey[];
  /** Action IDs that would be a "responsive" choice to this scenario */
  relevantActionIds: string[];
  /** Category for grouping analytics */
  category: "weather" | "infrastructure" | "demand" | "cyber" | "innovation";
}

export const SCENARIOS: Scenario[] = [
  {
    id: "severe-storm",
    name: "Severe Storm Hits Western Sydney",
    icon: "⛈️",
    severity: "moderate",
    headline: "A powerful storm with destructive winds has torn through the region overnight.",
    customerImpact:
      "Your power was out for 6 hours. Trees brought down power lines across your suburb. " +
      "Your fridge food is spoiled. Your home security system went offline during the outage.",
    decisionPrompt:
      "The grid is vulnerable to more storms this season. How should the network invest to protect customers like you?",
    damageType: ["gridResilience", "ageingAssets"],
    relevantActionIds: ["storm-hardening", "battery-storage", "maintenance-program", "emergency-repair"],
    category: "weather",
  },
  {
    id: "bushfire-threat",
    name: "Bushfire Disrupts Power Supply",
    icon: "🔥",
    severity: "catastrophic",
    headline: "A fast-moving bushfire in the Blue Mountains has forced emergency power shutdowns.",
    customerImpact:
      "Your area experienced a preventive blackout lasting 14 hours as fire threatened " +
      "transmission lines. You had no warning — your EV couldn't charge, your solar panels " +
      "were curtailed, and a vulnerable neighbour needed medical equipment.",
    decisionPrompt:
      "Bushfire risk is increasing with climate change. What investment would best protect the grid and customers?",
    damageType: ["gridResilience", "reliability", "ageingAssets"],
    relevantActionIds: ["storm-hardening", "battery-storage", "smart-grid", "emergency-repair"],
    category: "weather",
  },
  {
    id: "heatwave-overload",
    name: "Extreme Heatwave Causes Grid Overload",
    icon: "🌡️",
    severity: "severe",
    headline: "Five consecutive days above 45°C have pushed the grid to breaking point.",
    customerImpact:
      "Rolling blackouts hit your area during the hottest part of the day. Your air conditioning " +
      "cut out for 3 hours at 47°C. Transformers in your street are overheating and aging fast.",
    decisionPrompt:
      "Heatwaves are becoming more frequent and intense. Where should the network focus investment?",
    damageType: ["gridResilience", "reliability"],
    relevantActionIds: ["battery-storage", "demand-response", "build-substation", "storm-hardening"],
    category: "weather",
  },
  {
    id: "flash-flooding",
    name: "Flash Flooding Damages Underground Infrastructure",
    icon: "🌊",
    severity: "severe",
    headline: "Intense rainfall has caused flash flooding across the Aerotropolis precinct.",
    customerImpact:
      "Underground cable joints in your area are waterlogged. Power has been intermittent " +
      "for 2 days with no firm restoration time. Your insurance claim depends on how long " +
      "the power stays off.",
    decisionPrompt:
      "Flooding events are increasing as development paves over natural drainage. How should we respond?",
    damageType: ["gridResilience", "ageingAssets"],
    relevantActionIds: ["storm-hardening", "upgrade-transmission", "maintenance-program"],
    category: "weather",
  },
  {
    id: "substation-failure",
    name: "Critical Substation Transformer Explodes",
    icon: "💥",
    severity: "catastrophic",
    headline: "A 40-year-old transformer at a major zone substation has catastrophically failed.",
    customerImpact:
      "10,000 customers including you have been without power for 18 hours. The failed " +
      "equipment is so old that replacement parts must be custom-manufactured, meaning " +
      "reduced capacity for months.",
    decisionPrompt:
      "Ageing infrastructure is a ticking time bomb. Many assets are past their design life. What's the priority?",
    damageType: ["ageingAssets", "reliability"],
    relevantActionIds: ["upgrade-transmission", "maintenance-program", "build-substation", "emergency-repair"],
    category: "infrastructure",
  },
  {
    id: "cable-failure",
    name: "Underground Cable Failure",
    icon: "🔌",
    severity: "moderate",
    headline: "A major underground distribution cable has failed due to insulation breakdown after 35 years.",
    customerImpact:
      "Your suburb has been on emergency supply through a single backup cable. Any further " +
      "fault would mean extended blackout. Repair will take 3 weeks.",
    decisionPrompt:
      "Hidden infrastructure is failing without warning. How should the network manage aging assets?",
    damageType: ["ageingAssets", "reliability"],
    relevantActionIds: ["maintenance-program", "upgrade-transmission", "smart-grid"],
    category: "infrastructure",
  },
  {
    id: "data-centre-surge",
    name: "Hyperscale Data Centre Demand Surge",
    icon: "🖥️",
    severity: "moderate",
    headline: "A major tech company has just activated its new hyperscale data centre in the Aerotropolis.",
    customerImpact:
      "The sudden 80MW demand increase means your area now faces supply constraints. " +
      "New housing connection times have blown out from 6 weeks to 6 months. Your " +
      "business expansion is on hold.",
    decisionPrompt:
      "Demand from data centres is growing faster than anyone predicted. How should the grid respond?",
    damageType: ["growthDemand"],
    relevantActionIds: ["build-substation", "data-centre-connection", "demand-response", "emergency-capacity"],
    category: "demand",
  },
  {
    id: "airport-phase",
    name: "Airport Terminal Opens Ahead of Schedule",
    icon: "✈️",
    severity: "moderate",
    headline: "Western Sydney Airport's new terminal has opened 6 months early, catching the grid off-guard.",
    customerImpact:
      "The airport precinct is drawing huge power. Your area's supply voltage has dropped, " +
      "causing appliance issues. New commercial connections in the Aerotropolis are being delayed.",
    decisionPrompt:
      "The region is growing faster than planned. What investment is most urgent?",
    damageType: ["growthDemand"],
    relevantActionIds: ["build-substation", "data-centre-connection", "upgrade-transmission"],
    category: "demand",
  },
  {
    id: "housing-boom",
    name: "Housing Development Boom Strains Grid",
    icon: "🏘️",
    severity: "minor",
    headline: "5,000 new homes have been energised this quarter — double the forecast.",
    customerImpact:
      "Your area's local transformer is now overloaded during peak hours. Lights dim in the " +
      "evening. Your solar export has been limited because the local network can't absorb it.",
    decisionPrompt:
      "Residential growth is outpacing network capacity. What's the best way to keep up?",
    damageType: ["growthDemand", "innovation"],
    relevantActionIds: ["build-substation", "install-solar", "battery-storage", "ev-infrastructure"],
    category: "demand",
  },
  {
    id: "cyber-attack",
    name: "Cyber Attack on Grid Control Systems",
    icon: "🏴‍☠️",
    severity: "severe",
    headline: "A sophisticated state-sponsored cyber attack has compromised grid control systems.",
    customerImpact:
      "Your rooftop solar was remotely curtailed as a precaution. Smart meters went offline, " +
      "so billing is estimated. Grid operators lost visibility of your area for 8 hours, " +
      "unable to respond to faults.",
    decisionPrompt:
      "Cyber threats to critical infrastructure are escalating. Where should the network invest?",
    damageType: ["reliability", "innovation"],
    relevantActionIds: ["smart-grid", "demand-response", "battery-storage"],
    category: "cyber",
  },
  {
    id: "solar-curtailment",
    name: "Mass Solar Curtailment Due to Grid Instability",
    icon: "☀️",
    severity: "moderate",
    headline: "Excess midday solar generation has forced emergency curtailment of customer solar exports.",
    customerImpact:
      "Your 10kW solar system was remotely switched off at midday — you lost $45 in " +
      "feed-in revenue this quarter. The grid couldn't handle the reverse power flow. " +
      "Your battery couldn't charge from solar either.",
    decisionPrompt:
      "DER integration is creating new grid challenges. How should the network adapt?",
    damageType: ["innovation", "gridResilience"],
    relevantActionIds: ["battery-storage", "smart-grid", "install-solar", "ev-infrastructure"],
    category: "innovation",
  },
  {
    id: "ev-evening-peak",
    name: "EV Charging Crashes Evening Peak",
    icon: "🔋",
    severity: "moderate",
    headline: "Mass evening EV charging has created a new peak that exceeds the old summer maximum.",
    customerImpact:
      "Your street's transformer tripped at 7pm when everyone plugged in their EVs after work. " +
      "Power was out for 2 hours. The network has asked you to delay charging to midnight, " +
      "but your EV needs to be ready by 6am.",
    decisionPrompt:
      "EV adoption is accelerating faster than the grid can adapt. What investment matters most?",
    damageType: ["innovation", "growthDemand"],
    relevantActionIds: ["ev-infrastructure", "smart-grid", "battery-storage", "demand-response"],
    category: "innovation",
  },
  {
    id: "pole-collapse",
    name: "Wooden Pole Collapse Blocks Major Road",
    icon: "🪵",
    severity: "minor",
    headline: "A termite-damaged wooden power pole has collapsed across a main road.",
    customerImpact:
      "Your morning commute was blocked. Power was out for 4 hours. The network admits " +
      "that 15% of poles in your area are overdue for replacement.",
    decisionPrompt:
      "Ageing poles and wires are an everyday risk. Is the network maintaining its assets well enough?",
    damageType: ["ageingAssets"],
    relevantActionIds: ["maintenance-program", "upgrade-transmission", "storm-hardening"],
    category: "infrastructure",
  },
  {
    id: "voltage-complaint",
    name: "Widespread Voltage Complaints",
    icon: "📉",
    severity: "minor",
    headline: "Hundreds of customers have reported flickering lights and appliance damage from poor voltage.",
    customerImpact:
      "Your TV and fridge compressor both failed this quarter due to voltage fluctuations. " +
      "The network says the local infrastructure is at capacity and can't regulate properly.",
    decisionPrompt:
      "Poor power quality affects everyday life. How important is reliable, clean power to you?",
    damageType: ["reliability", "ageingAssets"],
    relevantActionIds: ["demand-response", "maintenance-program", "smart-grid", "build-substation"],
    category: "infrastructure",
  },
];

// Legacy Disaster type mapped from Scenarios for compatibility
export const DISASTERS: Disaster[] = SCENARIOS.map((s) => ({
  id: s.id,
  name: s.name,
  description: s.headline,
  severity: s.severity,
  damageType: s.damageType,
  icon: s.icon,
}));

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
