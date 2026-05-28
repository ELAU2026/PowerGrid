"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { DRIVERS, type DriverKey, type QuarterAction } from "@/lib/types";
import { getMaxSliderValue } from "@/lib/game-engine";
import type { GameAnalytics } from "@/lib/analytics";

interface GameData {
  game: {
    id: string;
    phase: string;
    quarter: number;
    maxQuarters: number;
    averageWillingness: number;
    weightedScores: Record<DriverKey, number> | null;
    gridState: {
      population: number;
      demand: number;
      capacity: number;
      reliability: number;
      customerSatisfaction: number;
      budget: number;
      quarterlyRevenue: number;
    } | null;
    driverHealth: Record<DriverKey, number> | null;
    events: Array<{
      quarter: number;
      description: string;
      type: string;
      icon: string;
    }>;
    activeDisaster: {
      name: string;
      icon: string;
      severity: string;
      description: string;
    } | null;
    activeScenario: {
      id: string;
      name: string;
      icon: string;
      severity: string;
      headline: string;
      customerImpact: string;
      decisionPrompt: string;
      damageType: DriverKey[];
      relevantActionIds: string[];
      category: string;
    } | null;
    availableActions: QuarterAction[];
    score: number;
  };
  players: Array<{
    id: number;
    name: string;
    willingnessToPay: number;
    driverImportance: Record<DriverKey, number> | null;
    preferencesSubmitted: boolean;
    actionSubmittedForQuarter: number;
  }>;
  currentPlayerId: number;
  myPreferencesSubmitted: boolean;
  myActionSubmittedForQuarter: number;
  myActions: Array<{
    quarter: number;
    actionId: string;
    actionName: string;
    actionCost: number;
    actionDriver: DriverKey;
  }>;
  analytics: GameAnalytics | null;
}

function PlayerContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId") ?? "";
  const [sessionToken, setSessionToken] = useState("");
  const [data, setData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Preferences form state
  const [wtp, setWtp] = useState(150);
  const [importance, setImportance] = useState<Record<DriverKey, number>>({
    growthDemand: 50,
    ageingAssets: 50,
    gridResilience: 50,
    innovation: 50,
    reliability: 50,
  });
  const [playerName, setPlayerName] = useState("");
  const [submittingPrefs, setSubmittingPrefs] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    if (gameId) {
      const token = localStorage.getItem(`pg-session-${gameId}`) ?? "";
      setSessionToken(token);
      const name = localStorage.getItem("pg-player-name") ?? "";
      setPlayerName(name);
    }
  }, [gameId]);

  const fetchState = useCallback(async () => {
    if (!gameId || !sessionToken) return;
    try {
      const params = new URLSearchParams({ gameId, sessionToken });
      const res = await fetch(`/api/game/state?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError("");
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load game");
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [gameId, sessionToken]);

  useEffect(() => {
    if (!sessionToken) return;
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState, sessionToken]);

  const submitPreferences = async () => {
    setSubmittingPrefs(true);
    try {
      const res = await fetch("/api/game/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          sessionToken,
          willingnessToPay: wtp,
          driverImportance: importance,
          name: playerName,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error);
      } else {
        fetchState();
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmittingPrefs(false);
    }
  };

  const submitAction = async (actionId: string) => {
    setSubmittingAction(true);
    try {
      const res = await fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, sessionToken, actionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error);
      } else {
        setError("");
        fetchState();
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Connecting to game...</div>
      </div>
    );
  }

  const g = data.game;
  const maxSlider = getMaxSliderValue(wtp);

  const handleWtpChange = (val: number) => {
    setWtp(val);
    const newMax = getMaxSliderValue(val);
    const updated = { ...importance };
    for (const k of Object.keys(updated) as DriverKey[]) {
      if (updated[k] > newMax) updated[k] = newMax;
    }
    setImportance(updated);
  };

  // ===== LOBBY =====
  if (g.phase === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Waiting for Game to Start
          </h1>
          <p className="text-slate-400 mb-6">
            You&apos;re in game{" "}
            <span className="font-mono text-amber-400">{gameId}</span>.
            The admin will start the preferences phase soon.
          </p>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-2">Players joined:</div>
            <div className="space-y-1">
              {data.players.map((p) => (
                <div
                  key={p.id}
                  className={`text-sm rounded-lg px-3 py-1.5 ${
                    p.id === data.currentPlayerId
                      ? "bg-amber-500/20 text-amber-300 font-semibold"
                      : "bg-slate-700/50 text-slate-300"
                  }`}
                >
                  {p.name} {p.id === data.currentPlayerId && "(you)"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== PREFERENCES =====
  if (g.phase === "preferences") {
    if (data.myPreferencesSubmitted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Preferences Submitted
            </h1>
            <p className="text-slate-400">
              Waiting for other players to submit their preferences...
            </p>
            <div className="mt-6 bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <div className="space-y-1">
                {data.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm px-3 py-1.5 bg-slate-700/30 rounded-lg"
                  >
                    <span className="text-slate-300">{p.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.preferencesSubmitted
                          ? "bg-emerald-400"
                          : "bg-slate-600"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">⚡</div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Your Preferences
            </h1>
            <p className="text-slate-400 text-sm">
              As a customer of the Western Sydney power grid, what matters most
              to you?
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-4">
            {/* Name */}
            <div className="mb-6">
              <label className="block text-slate-300 text-sm mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* WTP */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-semibold">
                  Willingness to Pay
                </h3>
                <span className="text-amber-400 font-bold text-2xl">
                  ${wtp}
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-3">
                How much per quarter for network services? This determines your
                influence and slider range.
              </p>
              <input
                type="range"
                min={50}
                max={500}
                step={10}
                value={wtp}
                onChange={(e) => handleWtpChange(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
              />
              <div className="flex justify-between text-slate-500 text-xs mt-1">
                <span>$50</span>
                <span>Max slider: {maxSlider}</span>
                <span>$500</span>
              </div>
            </div>

            {/* Drivers */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4">
                Investment Priorities
              </h3>
              <div className="space-y-5">
                {DRIVERS.map((d) => (
                  <div key={d.key}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span>{d.icon}</span>
                        <span className="text-white text-sm font-medium">
                          {d.label}
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold tabular-nums">
                        {importance[d.key]}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mb-1 ml-7">
                      {d.description}
                    </p>
                    <div className="ml-7">
                      <input
                        type="range"
                        min={0}
                        max={maxSlider}
                        value={importance[d.key]}
                        onChange={(e) =>
                          setImportance({
                            ...importance,
                            [d.key]: parseInt(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={submitPreferences}
              disabled={submittingPrefs}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-bold rounded-xl transition-all"
            >
              {submittingPrefs ? "Submitting..." : "Submit Preferences"}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== RESULTS =====
  if (g.phase === "results") {
    const totalWeight = g.weightedScores
      ? Object.values(g.weightedScores).reduce((a, b) => a + b, 0)
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">📊</div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Community Priorities
            </h1>
            <p className="text-slate-400 text-sm">
              The admin will start the game shortly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-slate-400 text-xs uppercase mb-1">
                Avg Willingness
              </div>
              <div className="text-3xl font-bold text-amber-400">
                ${g.averageWillingness}
              </div>
              <div className="text-slate-500 text-xs">/qtr</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-slate-400 text-xs uppercase mb-1">
                Grid Revenue
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                $
                {(
                  data.players.length * g.averageWillingness
                ).toLocaleString()}
              </div>
              <div className="text-slate-500 text-xs">/qtr</div>
            </div>
          </div>

          {g.weightedScores && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 mb-4">
              <h2 className="text-white font-semibold mb-4">
                Weighted Priority Scores
              </h2>
              <div className="space-y-3">
                {DRIVERS.map((d) => {
                  const val = g.weightedScores![d.key];
                  const pct = totalWeight > 0 ? (val / totalWeight) * 100 : 0;
                  return (
                    <div key={d.key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white text-sm">
                          {d.icon} {d.label}
                        </span>
                        <span className="text-amber-400 font-bold">
                          {val}{" "}
                          <span className="text-slate-500 text-xs">
                            ({pct.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== PLAYING =====
  if (g.phase === "playing") {
    const alreadySubmitted =
      data.myActionSubmittedForQuarter === g.quarter;
    const capacityMargin = g.gridState
      ? ((g.gridState.capacity - g.gridState.demand) / g.gridState.capacity) * 100
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <div className="text-white font-bold text-sm">
                  Q{g.quarter}/{g.maxQuarters}
                </div>
                <div className="text-slate-400 text-xs">
                  Year {Math.ceil(g.quarter / 4)}
                </div>
              </div>
            </div>
            {g.gridState && (
              <div className="flex gap-2">
                <span className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs">
                  <span className="text-slate-400">Budget: </span>
                  <span
                    className={`font-bold ${g.gridState.budget < g.gridState.quarterlyRevenue * 0.3 ? "text-red-400" : "text-emerald-400"}`}
                  >
                    ${g.gridState.budget.toLocaleString()}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Scenario Card — the core behavioural test */}
          {g.activeScenario && (
            <div className="bg-gradient-to-br from-red-900/40 to-orange-900/30 border border-red-500/40 rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">{g.activeScenario.icon}</span>
                <div className="flex-1">
                  <div className="text-red-200 font-bold text-base">
                    {g.activeScenario.name}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                      g.activeScenario.severity === "catastrophic"
                        ? "bg-red-600 text-white"
                        : g.activeScenario.severity === "severe"
                          ? "bg-orange-600 text-white"
                          : g.activeScenario.severity === "moderate"
                            ? "bg-yellow-600 text-slate-900"
                            : "bg-blue-600 text-white"
                    }`}
                  >
                    {g.activeScenario.severity}
                  </span>
                </div>
              </div>

              <p className="text-red-100/90 text-sm mb-3 leading-relaxed">
                {g.activeScenario.headline}
              </p>

              <div className="bg-black/20 rounded-xl p-3 mb-3">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-1">
                  Impact on You
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {g.activeScenario.customerImpact}
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-300 text-sm font-medium italic">
                  &ldquo;{g.activeScenario.decisionPrompt}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Grid Status Mini */}
          {g.gridState && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              <MiniStat
                label="Demand"
                value={`${g.gridState.demand} MW`}
                warn={g.gridState.demand > g.gridState.capacity * 0.9}
              />
              <MiniStat
                label="Capacity"
                value={`${g.gridState.capacity} MW`}
              />
              <MiniStat
                label="Margin"
                value={`${capacityMargin.toFixed(0)}%`}
                warn={capacityMargin < 10}
              />
              <MiniStat
                label="Reliability"
                value={`${g.gridState.reliability}%`}
                warn={g.gridState.reliability < 70}
              />
            </div>
          )}

          {/* Driver Health */}
          {g.driverHealth && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 mb-4">
              <div className="grid grid-cols-5 gap-2">
                {DRIVERS.map((d) => {
                  const val = g.driverHealth![d.key];
                  return (
                    <div key={d.key} className="text-center">
                      <div className="text-sm mb-0.5">{d.icon}</div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            val > 60
                              ? "bg-emerald-500"
                              : val > 30
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <div
                        className={`text-xs mt-0.5 font-bold ${
                          val > 60
                            ? "text-emerald-400"
                            : val > 30
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {val}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Selection or Waiting */}
          {alreadySubmitted ? (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">⏳</div>
              <h2 className="text-white font-bold text-lg mb-1">
                Action Submitted
              </h2>
              <p className="text-slate-400 text-sm">
                Waiting for other players and the admin to advance the
                quarter...
              </p>
              <div className="mt-4 space-y-1">
                {data.players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm px-3 py-1 bg-slate-700/30 rounded-lg"
                  >
                    <span className="text-slate-300">{p.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.actionSubmittedForQuarter === g.quarter
                          ? "bg-emerald-400"
                          : "bg-slate-600"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3">
                Choose Your Action
              </h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {g.availableActions.map((action) => {
                  const canAfford =
                    g.gridState && g.gridState.budget >= action.cost;
                  const driverConfig = DRIVERS.find(
                    (d) => d.key === action.driver
                  );
                  return (
                    <button
                      key={action.id}
                      onClick={() => submitAction(action.id)}
                      disabled={submittingAction || !canAfford}
                      className={`w-full text-left rounded-xl p-3 border transition-all ${
                        canAfford
                          ? "bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/60 hover:border-amber-500/30"
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
                      <p className="text-slate-400 text-xs mb-1.5">
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
              <button
                onClick={() => submitAction("skip")}
                disabled={submittingAction}
                className="w-full mt-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl transition-all text-sm"
              >
                Skip Turn (Save Budget)
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-900/50 border border-red-500/50 rounded-xl p-2 text-red-300 text-xs text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== GAME OVER =====
  if (g.phase === "game-over") {
    const myAnalytics = data.analytics?.players.find(
      (p) => p.playerId === data.currentPlayerId
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⚡</div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Game Complete
            </h1>
            <div className="text-4xl font-black text-amber-400 mb-1">
              Score: {g.score}
            </div>
            <p className="text-slate-400 text-sm">
              {g.quarter} quarters of Western Sydney grid management
            </p>
          </div>

          {/* My Personal Analytics */}
          {myAnalytics && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Your Profile</h2>
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    backgroundColor: myAnalytics.segmentColor + "30",
                    color: myAnalytics.segmentColor,
                  }}
                >
                  {myAnalytics.segment}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-slate-400 text-xs">WTP</div>
                  <div className="text-amber-400 font-bold">
                    ${myAnalytics.willingnessToPay}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-xs">Total Spent</div>
                  <div className="text-emerald-400 font-bold">
                    ${myAnalytics.totalSpent.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400 text-xs">Actions</div>
                  <div className="text-blue-400 font-bold">
                    {myAnalytics.actionsTaken}
                  </div>
                </div>
              </div>

              <h3 className="text-slate-300 text-sm font-semibold mb-2">
                Stated vs Revealed Priorities
              </h3>
              <div className="space-y-2">
                {DRIVERS.map((d) => {
                  const stated = myAnalytics.statedPriorities[d.key];
                  const revealed = myAnalytics.revealedPriorities[d.key];
                  const totalStated = Object.values(
                    myAnalytics.statedPriorities
                  ).reduce((a, b) => a + b, 0);
                  const statedNorm =
                    totalStated > 0
                      ? Math.round((stated / totalStated) * 100)
                      : 0;
                  return (
                    <div key={d.key}>
                      <div className="flex items-center gap-2 text-xs mb-0.5">
                        <span>{d.icon}</span>
                        <span className="text-slate-300">{d.label}</span>
                        <span className="ml-auto text-blue-400">
                          S:{statedNorm}
                        </span>
                        <span className="text-purple-400">R:{revealed}</span>
                      </div>
                      <div className="flex gap-0.5 h-2">
                        <div
                          className="bg-blue-500 rounded-l"
                          style={{ width: `${statedNorm}%` }}
                        />
                        <div
                          className="bg-purple-500 rounded-r"
                          style={{ width: `${revealed}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-3 text-xs text-slate-500">
                  <span>
                    <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1" />
                    Stated
                  </span>
                  <span>
                    <span className="inline-block w-2 h-2 rounded-sm bg-purple-500 mr-1" />
                    Revealed (spend)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scenario Responsiveness */}
          {data.analytics && (() => {
            const myResp = data.analytics!.playerResponsiveness.find(
              (p) => p.playerId === data.currentPlayerId
            );
            if (!myResp || myResp.totalScenarios === 0) return null;
            return (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 mb-4">
                <h2 className="text-white font-semibold mb-3">
                  Your Scenario Responsiveness
                </h2>
                <p className="text-slate-400 text-xs mb-3">
                  When presented with a crisis scenario, did you invest in actions that
                  directly addressed it?
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center bg-slate-700/40 rounded-lg p-3">
                    <div className="text-2xl font-black text-emerald-400">
                      {Math.round(myResp.responsivenessRate * 100)}%
                    </div>
                    <div className="text-slate-400 text-xs">Responsive</div>
                  </div>
                  <div className="text-center bg-slate-700/40 rounded-lg p-3">
                    <div className="text-2xl font-bold text-emerald-400">
                      {myResp.responsiveCount}
                    </div>
                    <div className="text-slate-400 text-xs">Addressed</div>
                  </div>
                  <div className="text-center bg-slate-700/40 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-400">
                      {myResp.unresponsiveCount}
                    </div>
                    <div className="text-slate-400 text-xs">Unrelated</div>
                  </div>
                </div>
                {Object.keys(myResp.byCategory).length > 0 && (
                  <div>
                    <div className="text-slate-300 text-xs font-semibold mb-2">
                      By Scenario Type
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(myResp.byCategory).map(([cat, data]) => (
                        <div
                          key={cat}
                          className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-1.5"
                        >
                          <span className="text-slate-300 text-xs capitalize">
                            {cat}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs">
                              {data.responsive}/{data.total}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                data.rate >= 0.7
                                  ? "text-emerald-400"
                                  : data.rate >= 0.4
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {Math.round(data.rate * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Segments */}
          {data.analytics && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 mb-4">
              <h2 className="text-white font-semibold mb-3">
                Customer Segments
              </h2>
              <div className="space-y-2">
                {data.analytics.segments.map((seg) => (
                  <div
                    key={seg.name}
                    className="bg-slate-700/40 rounded-lg p-3 border-l-4"
                    style={{ borderColor: seg.color }}
                  >
                    <div className="flex justify-between">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: seg.color }}
                      >
                        {seg.name}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {seg.playerCount} player
                        {seg.playerCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {seg.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid final state */}
          {g.gridState && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3">
                Final Grid State
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-xs">Population</span>
                  <div className="text-white font-bold">
                    {g.gridState.population.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Reliability</span>
                  <div className="text-white font-bold">
                    {g.gridState.reliability}%
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">
                    Capacity Margin
                  </span>
                  <div className="text-white font-bold">
                    {(
                      ((g.gridState.capacity - g.gridState.demand) /
                        g.gridState.capacity) *
                      100
                    ).toFixed(0)}
                    %
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Satisfaction</span>
                  <div className="text-white font-bold">
                    {g.gridState.customerSatisfaction}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function MiniStat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`bg-slate-800/80 border rounded-lg p-2 text-center ${
        warn ? "border-red-500/50" : "border-slate-700"
      }`}
    >
      <div className="text-slate-400 text-xs">{label}</div>
      <div
        className={`font-bold text-sm ${warn ? "text-red-400" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      }
    >
      <PlayerContent />
    </Suspense>
  );
}
