"use client";

import { useGame, useGameDispatch } from "@/lib/game-context";
import { DRIVERS, type DriverKey } from "@/lib/types";
import { getScoreGrade } from "@/lib/game-engine";

export default function GameOver() {
  const game = useGame();
  const dispatch = useGameDispatch();

  const { grade, label, color } = getScoreGrade(game.score);

  const totalWeight = Object.values(game.weightedDriverScores).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Score Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Game Complete — 4 Years Later
          </h1>
          <p className="text-slate-400">
            The Western Sydney grid has been through it all. Here&apos;s how you
            did.
          </p>
        </div>

        {/* Grade Card */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-6 text-center">
          <div className={`text-8xl font-black ${color} mb-2`}>{grade}</div>
          <div className="text-2xl font-bold text-white mb-1">{label}</div>
          <div className="text-slate-400">
            Final Score:{" "}
            <span className="text-amber-400 font-bold text-2xl">
              {game.score}
            </span>{" "}
            points
          </div>
        </div>

        {/* Final Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-slate-400 text-xs uppercase mb-1">
              Population
            </div>
            <div className="text-white font-bold">
              {game.grid.population.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-slate-400 text-xs uppercase mb-1">
              Reliability
            </div>
            <div
              className={`font-bold ${game.grid.reliability > 80 ? "text-emerald-400" : game.grid.reliability > 50 ? "text-yellow-400" : "text-red-400"}`}
            >
              {game.grid.reliability}%
            </div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-slate-400 text-xs uppercase mb-1">
              Satisfaction
            </div>
            <div
              className={`font-bold ${game.grid.customerSatisfaction > 60 ? "text-emerald-400" : game.grid.customerSatisfaction > 30 ? "text-yellow-400" : "text-red-400"}`}
            >
              {game.grid.customerSatisfaction}
            </div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-slate-400 text-xs uppercase mb-1">
              Budget Left
            </div>
            <div
              className={`font-bold ${game.grid.budget > 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              ${game.grid.budget.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Driver Final Health vs Customer Priorities */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold text-lg mb-4">
            Driver Health vs Customer Priorities
          </h2>
          <div className="space-y-4">
            {DRIVERS.map((driver) => {
              const health = game.driverHealth[driver.key as DriverKey];
              const priority =
                totalWeight > 0
                  ? (game.weightedDriverScores[driver.key as DriverKey] /
                      totalWeight) *
                    100
                  : 0;

              return (
                <div key={driver.key}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span>{driver.icon}</span>
                      <span className="text-white text-sm">{driver.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">
                        Priority: {priority.toFixed(0)}%
                      </span>
                      <span
                        className={`font-bold text-sm tabular-nums ${
                          health > 60
                            ? "text-emerald-400"
                            : health > 30
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {health}/100
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${
                        health > 60
                          ? "from-emerald-600 to-emerald-400"
                          : health > 30
                            ? "from-yellow-600 to-yellow-400"
                            : "from-red-600 to-red-400"
                      }`}
                      style={{ width: `${health}%` }}
                    />
                    {/* Priority marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                      style={{ left: `${priority}%` }}
                      title={`Customer priority: ${priority.toFixed(0)}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Amber line = customer priority level | Bar = final health achieved
          </p>
        </div>

        {/* Asset Summary */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold text-lg mb-3">
            Final Asset Portfolio ({game.grid.assets.length} assets)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {game.grid.assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-slate-700/30 rounded-lg p-2"
              >
                <div className="text-white text-xs truncate">{asset.name}</div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    HP: {asset.health}
                  </span>
                  <span>
                    {asset.age.toFixed(1)}y
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Play Again */}
        <div className="text-center">
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="px-12 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
