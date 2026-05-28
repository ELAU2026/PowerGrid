"use client";

import { useGame, useGameDispatch } from "@/lib/game-context";

export default function Lobby() {
  const game = useGame();
  const dispatch = useGameDispatch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            PowerGrid
            <span className="text-amber-400"> WSA</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Build and maintain the power grid for Western Sydney&apos;s booming
            Aerotropolis. Balance growth, reliability, and resilience in this
            turn-based multiplayer strategy game.
          </p>
        </div>

        {/* Game Card */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            New Game Setup
          </h2>

          {/* Player Count */}
          <div className="mb-8">
            <label className="block text-slate-300 text-sm font-medium mb-3">
              Number of Customer Players
            </label>
            <div className="flex gap-3">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    dispatch({ type: "SET_PLAYER_COUNT", count: n })
                  }
                  className={`w-14 h-14 rounded-xl font-bold text-lg transition-all ${
                    game.playerCount === n
                      ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30 scale-105"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-slate-500 text-sm mt-2">
              Each player represents a different customer group in Western Sydney
            </p>
          </div>

          {/* Game Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-700/50 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">
                Duration
              </div>
              <div className="text-white font-semibold">
                16 Quarters (4 Years)
              </div>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">
                Setting
              </div>
              <div className="text-white font-semibold">
                Western Sydney, NSW
              </div>
            </div>
          </div>

          {/* Scenario Description */}
          <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-5 mb-8">
            <h3 className="text-amber-400 font-semibold text-sm mb-2">
              THE SCENARIO
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Western Sydney is transforming. The new international airport at
              Badgerys Creek is driving unprecedented growth. Data centres are
              springing up across the Aerotropolis. Housing developments are
              sprawling. The power grid must grow to meet demand — but ageing
              infrastructure threatens reliability, and disasters lurk around
              every corner.
            </p>
            <p className="text-slate-400 text-sm mt-3">
              As customer stakeholders, you&apos;ll first decide how much
              you&apos;re willing to pay and what matters most to you. Then
              you&apos;ll work together each quarter to invest in the grid and
              keep the lights on.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={() => dispatch({ type: "START_SETUP" })}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Game with {game.playerCount} Players
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-sm mt-6">
          A resource management experience inspired by real grid challenges
        </p>
      </div>
    </div>
  );
}
