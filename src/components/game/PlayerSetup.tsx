"use client";

import { useGame, useGameDispatch } from "@/lib/game-context";
import { DRIVERS, type DriverKey } from "@/lib/types";
import { getMaxSliderValue } from "@/lib/game-engine";

export default function PlayerSetup() {
  const game = useGame();
  const dispatch = useGameDispatch();

  const currentPlayer = game.players[game.currentPlayerSetup];
  if (!currentPlayer) return null;

  const maxSlider = getMaxSliderValue(currentPlayer.willingnessToPay);

  const updatePlayer = (updates: Partial<typeof currentPlayer>) => {
    dispatch({
      type: "UPDATE_PLAYER",
      player: { ...currentPlayer, ...updates },
    });
  };

  const updateDriverImportance = (key: DriverKey, value: number) => {
    const capped = Math.min(value, maxSlider);
    updatePlayer({
      driverImportance: {
        ...currentPlayer.driverImportance,
        [key]: capped,
      },
    });
  };

  const handleWillingnessChange = (value: number) => {
    const newMax = getMaxSliderValue(value);
    // Cap existing driver values to new max
    const newImportance = { ...currentPlayer.driverImportance };
    for (const key of Object.keys(newImportance) as DriverKey[]) {
      if (newImportance[key] > newMax) {
        newImportance[key] = newMax;
      }
    }
    updatePlayer({
      willingnessToPay: value,
      driverImportance: newImportance,
    });
  };

  const progressPercent = ((game.currentPlayerSetup + 1) / game.playerCount) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Player Setup</span>
            <span className="text-slate-400 text-sm">
              {game.currentPlayerSetup + 1} of {game.playerCount}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Player Card */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Player Name */}
          <div className="mb-8">
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Your Name / Customer Group
            </label>
            <input
              type="text"
              value={currentPlayer.name}
              onChange={(e) => updatePlayer({ name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter your name..."
            />
          </div>

          {/* Willingness to Pay */}
          <div className="mb-10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-semibold text-lg">
                  Willingness to Pay
                </h3>
                <p className="text-slate-400 text-sm">
                  How much are you willing to pay per quarter for electricity
                  network services?
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-400">
                  ${currentPlayer.willingnessToPay}
                </div>
                <div className="text-slate-500 text-xs">per quarter</div>
              </div>
            </div>

            <input
              type="range"
              min={50}
              max={500}
              step={10}
              value={currentPlayer.willingnessToPay}
              onChange={(e) =>
                handleWillingnessChange(parseInt(e.target.value))
              }
              className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/30"
            />
            <div className="flex justify-between text-slate-500 text-xs mt-1">
              <span>$50/qtr</span>
              <span>$500/qtr</span>
            </div>

            <div className="mt-3 bg-slate-700/50 rounded-lg p-3 text-sm">
              <span className="text-slate-400">
                Your willingness to pay sets the maximum importance you can
                allocate below.
              </span>
              <span className="text-amber-400 font-semibold ml-1">
                Max slider: {maxSlider}
              </span>
            </div>
          </div>

          {/* Driver Importance Sliders */}
          <div className="mb-8">
            <h3 className="text-white font-semibold text-lg mb-1">
              Investment Priorities
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Rate the importance of each area. Higher willingness to pay lets
              you allocate more importance.
            </p>

            <div className="space-y-6">
              {DRIVERS.map((driver) => (
                <div key={driver.key} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{driver.icon}</span>
                      <span className="text-white font-medium text-sm">
                        {driver.label}
                      </span>
                    </div>
                    <span className="text-amber-400 font-bold text-lg tabular-nums w-12 text-right">
                      {currentPlayer.driverImportance[driver.key]}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mb-2 ml-8">
                    {driver.description}
                  </p>
                  <div className="ml-8 relative">
                    <input
                      type="range"
                      min={0}
                      max={maxSlider}
                      step={1}
                      value={currentPlayer.driverImportance[driver.key]}
                      onChange={(e) =>
                        updateDriverImportance(
                          driver.key,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-md"
                    />
                    {/* Cap indicator */}
                    <div className="flex justify-between text-slate-600 text-xs mt-1">
                      <span>0</span>
                      <span>Cap: {maxSlider}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => dispatch({ type: "SUBMIT_PLAYER" })}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            {game.currentPlayerSetup < game.playerCount - 1
              ? `Submit & Next Player →`
              : `Submit & View Results`}
          </button>
        </div>
      </div>
    </div>
  );
}
