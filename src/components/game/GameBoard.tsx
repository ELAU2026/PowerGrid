"use client";

import { useState } from "react";
import { useGame, useGameDispatch } from "@/lib/game-context";
import { DRIVERS, type DriverKey, type QuarterAction } from "@/lib/types";

function HealthBar({
  value,
  max = 100,
  color = "amber",
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor =
    pct > 60
      ? "from-emerald-600 to-emerald-400"
      : pct > 30
        ? "from-yellow-600 to-yellow-400"
        : "from-red-600 to-red-400";

  return (
    <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${color === "auto" ? barColor : `from-${color}-600 to-${color}-400`}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatusCard({
  label,
  value,
  unit,
  icon,
  warning,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: string;
  warning?: boolean;
}) {
  return (
    <div
      className={`bg-slate-700/50 rounded-xl p-3 ${warning ? "border border-red-500/50 animate-pulse" : ""}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-slate-400 text-xs uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`font-bold text-lg ${warning ? "text-red-400" : "text-white"}`}>
        {value}
        {unit && <span className="text-sm text-slate-400 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

export default function GameBoard() {
  const game = useGame();
  const dispatch = useGameDispatch();
  const [selectedAction, setSelectedAction] = useState<QuarterAction | null>(
    null
  );
  const [actionsThisTurn, setActionsThisTurn] = useState(0);

  const currentPlayer = game.players[game.currentPlayerTurn];
  const capacityMargin =
    ((game.grid.capacity - game.grid.demand) / game.grid.capacity) * 100;

  const handleAction = (action: QuarterAction) => {
    if (game.grid.budget < action.cost) return;
    dispatch({ type: "EXECUTE_ACTION", action });
    setActionsThisTurn((prev) => prev + 1);
    setSelectedAction(null);
  };

  const handleEndTurn = () => {
    setActionsThisTurn(0);
    setSelectedAction(null);
    dispatch({ type: "END_TURN" });
  };

  const handleSkipTurn = () => {
    setActionsThisTurn(0);
    setSelectedAction(null);
    dispatch({ type: "SKIP_TURN" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                PowerGrid WSA
              </h1>
              <div className="text-slate-400 text-xs">
                Q{game.quarter} of {game.maxQuarters} — Year{" "}
                {Math.ceil(game.quarter / 4)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
              <span className="text-slate-400 text-xs">Revenue/qtr: </span>
              <span className="font-bold text-blue-400">
                ${game.grid.quarterlyRevenue.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
              <span className="text-slate-400 text-xs">Budget: </span>
              <span
                className={`font-bold ${game.grid.budget < game.grid.quarterlyRevenue * 0.3 ? "text-red-400" : "text-emerald-400"}`}
              >
                ${game.grid.budget.toLocaleString()}
              </span>
            </div>
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-1.5">
              <span className="text-amber-300 text-xs">Now: </span>
              <span className="text-amber-400 font-bold">
                {currentPlayer?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Disaster Banner */}
        {game.activeDisaster && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 mb-4 flex items-center gap-3">
            <span className="text-3xl">{game.activeDisaster.icon}</span>
            <div>
              <div className="text-red-300 font-bold">
                {game.activeDisaster.name}
              </div>
              <div className="text-red-400/80 text-sm">
                {game.activeDisaster.description}
              </div>
            </div>
            <div className="ml-auto">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  game.activeDisaster.severity === "catastrophic"
                    ? "bg-red-600 text-white"
                    : game.activeDisaster.severity === "severe"
                      ? "bg-orange-600 text-white"
                      : game.activeDisaster.severity === "moderate"
                        ? "bg-yellow-600 text-slate-900"
                        : "bg-blue-600 text-white"
                }`}
              >
                {game.activeDisaster.severity}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Grid Status */}
          <div className="lg:col-span-1 space-y-4">
            {/* Grid Stats */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Grid Status
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <StatusCard
                  label="Population"
                  value={game.grid.population.toLocaleString()}
                  icon="👥"
                />
                <StatusCard
                  label="Demand"
                  value={game.grid.demand}
                  unit="MW"
                  icon="📈"
                  warning={game.grid.demand > game.grid.capacity * 0.9}
                />
                <StatusCard
                  label="Capacity"
                  value={game.grid.capacity}
                  unit="MW"
                  icon="🔋"
                />
                <StatusCard
                  label="Margin"
                  value={`${capacityMargin.toFixed(1)}%`}
                  icon="📊"
                  warning={capacityMargin < 10}
                />
                <StatusCard
                  label="Reliability"
                  value={`${game.grid.reliability}%`}
                  icon="💡"
                  warning={game.grid.reliability < 70}
                />
                <StatusCard
                  label="Satisfaction"
                  value={`${game.grid.customerSatisfaction}`}
                  icon="😊"
                  warning={game.grid.customerSatisfaction < 40}
                />
              </div>
            </div>

            {/* Driver Health */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Driver Health
              </h2>
              <div className="space-y-3">
                {DRIVERS.map((driver) => {
                  const health = game.driverHealth[driver.key as DriverKey];
                  return (
                    <div key={driver.key}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{driver.icon}</span>
                          <span className="text-slate-300 text-xs">
                            {driver.label}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            health > 60
                              ? "text-emerald-400"
                              : health > 30
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {health}
                        </span>
                      </div>
                      <HealthBar value={health} color="auto" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assets */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Assets ({game.grid.assets.length})
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {game.grid.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between bg-slate-700/30 rounded-lg p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-xs truncate">
                        {asset.name}
                      </div>
                      <div className="text-slate-500 text-xs">
                        Age: {asset.age.toFixed(1)}y / {asset.maxAge}y
                      </div>
                    </div>
                    <div className="w-16 ml-2">
                      <HealthBar value={asset.health} color="auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Actions */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                  Available Actions
                </h2>
                <span className="text-slate-500 text-xs">
                  {actionsThisTurn} action{actionsThisTurn !== 1 ? "s" : ""}{" "}
                  taken
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {game.availableActions.map((action) => {
                  const canAfford = game.grid.budget >= action.cost;
                  const isSelected = selectedAction?.id === action.id;
                  const driverConfig = DRIVERS.find(
                    (d) => d.key === action.driver
                  );

                  return (
                    <button
                      key={action.id}
                      onClick={() =>
                        setSelectedAction(isSelected ? null : action)
                      }
                      disabled={!canAfford}
                      className={`w-full text-left rounded-xl p-3 transition-all border ${
                        isSelected
                          ? "bg-amber-500/20 border-amber-500/50"
                          : canAfford
                            ? "bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/60 hover:border-slate-500/50"
                            : "bg-slate-800/50 border-slate-700/30 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white font-medium text-sm">
                          {action.name}
                        </span>
                        <span
                          className={`font-bold text-sm ml-2 ${canAfford ? "text-emerald-400" : "text-red-400"}`}
                        >
                          ${action.cost}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mb-2">
                        {action.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {driverConfig?.icon}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {driverConfig?.label}
                        </span>
                        <div className="flex gap-1 ml-auto">
                          {Object.entries(action.effect).map(([k, v]) => (
                            <span
                              key={k}
                              className="text-emerald-400 text-xs bg-emerald-400/10 px-1.5 py-0.5 rounded"
                            >
                              +{v as number}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {selectedAction && (
                <button
                  onClick={() => handleAction(selectedAction)}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-all"
                >
                  Invest ${selectedAction.cost}
                </button>
              )}
              {actionsThisTurn > 0 ? (
                <button
                  onClick={handleEndTurn}
                  className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-xl transition-all"
                >
                  End Turn →
                </button>
              ) : (
                <button
                  onClick={handleSkipTurn}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl transition-all"
                >
                  Skip Turn →
                </button>
              )}
            </div>
          </div>

          {/* Right: Event Log & Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quarter Info */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Quarter Timeline
              </h2>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: game.maxQuarters }, (_, i) => i + 1).map(
                  (q) => (
                    <div
                      key={q}
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                        q === game.quarter
                          ? "bg-amber-500 text-slate-900"
                          : q < game.quarter
                            ? "bg-slate-600 text-slate-400"
                            : "bg-slate-700/50 text-slate-600"
                      }`}
                    >
                      {q}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Player Turn Order */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Players
              </h2>
              <div className="space-y-1.5">
                {game.players.map((player, i) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                      i === game.currentPlayerTurn
                        ? "bg-amber-500/20 border border-amber-500/30"
                        : "bg-slate-700/30"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        i === game.currentPlayerTurn
                          ? "bg-amber-400"
                          : i < game.currentPlayerTurn
                            ? "bg-slate-500"
                            : "bg-slate-700"
                      }`}
                    />
                    <span
                      className={`text-sm ${i === game.currentPlayerTurn ? "text-amber-300 font-semibold" : "text-slate-400"}`}
                    >
                      {player.name}
                    </span>
                    {i === game.currentPlayerTurn && (
                      <span className="text-amber-400 text-xs ml-auto">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Event Log */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Event Log
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {[...game.events].reverse().map((event, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-2.5 text-xs border ${
                      event.type === "disaster"
                        ? "bg-red-900/30 border-red-500/30 text-red-300"
                        : event.type === "warning"
                          ? "bg-yellow-900/30 border-yellow-500/30 text-yellow-300"
                          : event.type === "growth"
                            ? "bg-blue-900/30 border-blue-500/30 text-blue-300"
                            : "bg-slate-700/30 border-slate-600/30 text-slate-300"
                    }`}
                  >
                    <span className="mr-1.5">{event.icon}</span>
                    {event.description}
                    {event.quarter > 0 && (
                      <span className="text-slate-500 ml-1">
                        (Q{event.quarter})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
