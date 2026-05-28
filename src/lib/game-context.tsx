"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import {
  type GameState,
  type PlayerSetup,
  type DriverKey,
  type QuarterAction,
  INITIAL_DRIVER_SCORES,
} from "./types";
import {
  calculateAverageWillingness,
  calculateWeightedDriverScores,
  createInitialGridState,
  generateActions,
  rollForDisaster,
  applyDisasterDamage,
  progressQuarter,
  applyAction,
  calculateFinalScore,
} from "./game-engine";

// === Actions ===

type GameAction =
  | { type: "SET_PLAYER_COUNT"; count: number }
  | { type: "START_SETUP" }
  | { type: "UPDATE_PLAYER"; player: PlayerSetup }
  | { type: "SUBMIT_PLAYER" }
  | { type: "CALCULATE_RESULTS" }
  | { type: "START_GAME" }
  | { type: "EXECUTE_ACTION"; action: QuarterAction }
  | { type: "END_TURN" }
  | { type: "SKIP_TURN" }
  | { type: "RESET" };

// === Initial State ===

function createInitialPlayer(id: number): PlayerSetup {
  return {
    id,
    name: `Customer ${id + 1}`,
    willingnessToPay: 150,
    driverImportance: {
      growthDemand: 50,
      ageingAssets: 50,
      gridResilience: 50,
      innovation: 50,
      reliability: 50,
    },
    submitted: false,
  };
}

const initialState: GameState = {
  phase: "lobby",
  playerCount: 3,
  players: [],
  currentPlayerSetup: 0,
  averageWillingnessToPay: 0,
  weightedDriverScores: { ...INITIAL_DRIVER_SCORES },
  quarter: 1,
  maxQuarters: 16,
  currentPlayerTurn: 0,
  grid: createInitialGridState(150, 3),
  driverHealth: {
    growthDemand: 60,
    ageingAssets: 50,
    gridResilience: 55,
    innovation: 40,
    reliability: 65,
  },
  events: [],
  activeDisaster: null,
  availableActions: [],
  score: 0,
};

// === Reducer ===

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_PLAYER_COUNT":
      return { ...state, playerCount: Math.max(2, Math.min(6, action.count)) };

    case "START_SETUP": {
      const players = Array.from({ length: state.playerCount }, (_, i) =>
        createInitialPlayer(i)
      );
      return {
        ...state,
        phase: "player-setup",
        players,
        currentPlayerSetup: 0,
      };
    }

    case "UPDATE_PLAYER": {
      const players = state.players.map((p) =>
        p.id === action.player.id ? action.player : p
      );
      return { ...state, players };
    }

    case "SUBMIT_PLAYER": {
      const players = state.players.map((p, i) =>
        i === state.currentPlayerSetup ? { ...p, submitted: true } : p
      );
      const nextPlayer = state.currentPlayerSetup + 1;
      if (nextPlayer >= state.playerCount) {
        // All players submitted, calculate results
        const avg = calculateAverageWillingness(players);
        const scores = calculateWeightedDriverScores(players);
        return {
          ...state,
          players,
          phase: "results",
          averageWillingnessToPay: avg,
          weightedDriverScores: scores,
        };
      }
      return { ...state, players, currentPlayerSetup: nextPlayer };
    }

    case "CALCULATE_RESULTS": {
      const avg = calculateAverageWillingness(state.players);
      const scores = calculateWeightedDriverScores(state.players);
      return {
        ...state,
        phase: "results",
        averageWillingnessToPay: avg,
        weightedDriverScores: scores,
      };
    }

    case "START_GAME": {
      const grid = createInitialGridState(
        state.averageWillingnessToPay,
        state.playerCount
      );
      const driverHealth: Record<DriverKey, number> = {
        growthDemand: Math.min(60, state.weightedDriverScores.growthDemand + 30),
        ageingAssets: Math.min(50, state.weightedDriverScores.ageingAssets + 20),
        gridResilience: Math.min(55, state.weightedDriverScores.gridResilience + 25),
        innovation: Math.min(40, state.weightedDriverScores.innovation + 15),
        reliability: Math.min(65, state.weightedDriverScores.reliability + 35),
      };
      const actions = generateActions(state.weightedDriverScores, 1, grid);
      return {
        ...state,
        phase: "playing",
        quarter: 1,
        currentPlayerTurn: 0,
        grid,
        driverHealth,
        availableActions: actions,
        events: [
          {
            quarter: 0,
            description:
              "Western Sydney Power Grid is now operational. The city is counting on you!",
            type: "achievement",
            icon: "🏙️",
          },
        ],
        activeDisaster: null,
        score: 0,
      };
    }

    case "EXECUTE_ACTION": {
      const { grid, driverHealth } = applyAction(
        state.grid,
        state.driverHealth,
        action.action
      );
      const event = {
        quarter: state.quarter,
        description: `${state.players[state.currentPlayerTurn].name} invested in: ${action.action.name}`,
        type: "achievement" as const,
        icon: "✅",
      };
      return {
        ...state,
        grid,
        driverHealth,
        events: [...state.events, event],
      };
    }

    case "END_TURN":
    case "SKIP_TURN": {
      const nextPlayer = state.currentPlayerTurn + 1;

      if (nextPlayer >= state.playerCount) {
        // All players have had their turn, advance quarter
        const nextQuarter = state.quarter + 1;

        if (nextQuarter > state.maxQuarters) {
          // Game over
          const finalScore = calculateFinalScore(
            state.grid,
            state.driverHealth,
            state.weightedDriverScores
          );
          return {
            ...state,
            phase: "game-over",
            score: finalScore,
            currentPlayerTurn: 0,
          };
        }

        // Progress the quarter
        const {
          grid: progressedGrid,
          driverHealth: progressedHealth,
          events: quarterEvents,
        } = progressQuarter(state.grid, state.driverHealth, nextQuarter);

        // Roll for disaster
        const disaster = rollForDisaster(nextQuarter);
        let finalGrid = progressedGrid;
        let finalHealth = progressedHealth;
        const allEvents = [...state.events, ...quarterEvents];

        if (disaster) {
          const dmg = applyDisasterDamage(
            progressedGrid,
            progressedHealth,
            disaster
          );
          finalGrid = dmg.grid;
          finalHealth = dmg.driverHealth;
          allEvents.push({
            quarter: nextQuarter,
            description: `DISASTER: ${disaster.name} — ${disaster.description}`,
            type: "disaster",
            icon: disaster.icon,
          });
        }

        const newActions = generateActions(
          state.weightedDriverScores,
          nextQuarter,
          finalGrid
        );

        return {
          ...state,
          quarter: nextQuarter,
          currentPlayerTurn: 0,
          grid: finalGrid,
          driverHealth: finalHealth,
          events: allEvents,
          activeDisaster: disaster,
          availableActions: newActions,
        };
      }

      return { ...state, currentPlayerTurn: nextPlayer };
    }

    case "RESET":
      return { ...initialState };

    default:
      return state;
  }
}

// === Context ===

const GameContext = createContext<GameState>(initialState);
const GameDispatchContext = createContext<Dispatch<GameAction>>(() => {});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}

export function useGameDispatch() {
  return useContext(GameDispatchContext);
}
