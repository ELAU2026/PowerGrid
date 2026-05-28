"use client";

import { useGame, useGameDispatch } from "@/lib/game-context";
import { DRIVERS, type DriverKey } from "@/lib/types";

export default function Results() {
  const game = useGame();
  const dispatch = useGameDispatch();

  const totalWeight = Object.values(game.weightedDriverScores).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">📊</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Customer Priorities
          </h1>
          <p className="text-slate-400">
            Here&apos;s what the community has decided — these priorities will
            shape how the grid is managed.
          </p>
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center">
            <div className="text-slate-400 text-sm uppercase tracking-wide mb-1">
              Average Willingness to Pay
            </div>
            <div className="text-4xl font-bold text-amber-400">
              ${game.averageWillingnessToPay}
            </div>
            <div className="text-slate-500 text-sm mt-1">
              per customer per quarter
            </div>
          </div>
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 text-center">
            <div className="text-slate-400 text-sm uppercase tracking-wide mb-1">
              Quarterly Grid Revenue
            </div>
            <div className="text-4xl font-bold text-emerald-400">
              ${(game.playerCount * game.averageWillingnessToPay).toLocaleString()}
            </div>
            <div className="text-slate-500 text-sm mt-1">
              {game.playerCount} customers &times; $
              {game.averageWillingnessToPay}/qtr
            </div>
          </div>
        </div>

        {/* Per-Player Breakdown */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold text-lg mb-4">
            Individual Choices
          </h2>
          <div className="grid gap-3">
            {game.players.map((player) => (
              <div
                key={player.id}
                className="bg-slate-700/50 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-white font-medium">{player.name}</div>
                  <div className="text-slate-400 text-sm">
                    ${player.willingnessToPay}/qtr
                  </div>
                </div>
                <div className="flex gap-2">
                  {DRIVERS.map((d) => (
                    <div
                      key={d.key}
                      className="text-center"
                      title={`${d.label}: ${player.driverImportance[d.key]}`}
                    >
                      <div className="text-lg">{d.icon}</div>
                      <div className="text-xs text-slate-400 tabular-nums">
                        {player.driverImportance[d.key]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weighted Driver Scores */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-semibold text-lg mb-2">
            Weighted Priority Scores
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Priorities weighted by each customer&apos;s willingness to pay —
            those who pay more have a stronger voice.
          </p>

          <div className="space-y-4">
            {DRIVERS.map((driver) => {
              const score =
                game.weightedDriverScores[driver.key as DriverKey];
              const percentage =
                totalWeight > 0 ? (score / totalWeight) * 100 : 0;

              return (
                <div key={driver.key}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{driver.icon}</span>
                      <span className="text-white font-medium">
                        {driver.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">
                        {percentage.toFixed(1)}%
                      </span>
                      <span className="text-amber-400 font-bold text-lg tabular-nums w-10 text-right">
                        {score}
                      </span>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-amber-600 to-amber-400"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Game */}
        <div className="text-center">
          <button
            onClick={() => dispatch({ type: "START_GAME" })}
            className="px-12 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Begin Managing the Grid →
          </button>
          <p className="text-slate-500 text-sm mt-3">
            16 quarters of strategic decisions await
          </p>
        </div>
      </div>
    </div>
  );
}
