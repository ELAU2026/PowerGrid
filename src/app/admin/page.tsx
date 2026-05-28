"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { DRIVERS, type DriverKey } from "@/lib/types";
import type { GameAnalytics } from "@/lib/analytics";

interface GameStateResponse {
  game: {
    id: string;
    phase: string;
    quarter: number;
    maxQuarters: number;
    maxPlayers: number;
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
    activeDisaster: { name: string; icon: string; severity: string; description: string } | null;
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
  isAdmin: boolean;
  analytics: GameAnalytics | null;
  actionsSubmittedCount?: number;
  preferencesSubmittedCount?: number;
  totalPlayers?: number;
}

function AdminContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId") ?? "";
  const [adminToken, setAdminToken] = useState("");
  const [data, setData] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (gameId) {
      const token = localStorage.getItem(`pg-admin-${gameId}`) ?? "";
      setAdminToken(token);
    }
  }, [gameId]);

  const fetchState = useCallback(async () => {
    if (!gameId || !adminToken) return;
    try {
      const params = new URLSearchParams({ gameId, adminToken });
      const res = await fetch(`/api/game/state?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
        setError("");
      }
    } catch {
      /* ignore polling errors */
    } finally {
      setLoading(false);
    }
  }, [gameId, adminToken]);

  useEffect(() => {
    if (!adminToken) return;
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState, adminToken]);

  const adminAction = async (action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/game/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, adminToken, action }),
      });
      const result = await res.json();
      if (!res.ok) setError(result.error);
      else {
        setError("");
        fetchState();
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading admin dashboard...</div>
      </div>
    );
  }

  const g = data.game;
  const allSubmitted =
    g.phase === "playing" &&
    data.actionsSubmittedCount === data.totalPlayers;
  const allPrefsSubmitted =
    g.phase === "preferences" &&
    data.preferencesSubmittedCount === data.totalPlayers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-white font-bold text-xl">Admin Dashboard</h1>
              <div className="text-slate-400 text-sm">
                Game Code:{" "}
                <span className="font-mono text-amber-400 text-lg">
                  {gameId}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                g.phase === "lobby"
                  ? "bg-blue-600 text-white"
                  : g.phase === "preferences"
                    ? "bg-purple-600 text-white"
                    : g.phase === "results"
                      ? "bg-amber-600 text-white"
                      : g.phase === "playing"
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
              }`}
            >
              {g.phase}
            </span>
            {g.phase === "playing" && (
              <span className="text-slate-400 text-sm">
                Q{g.quarter}/{g.maxQuarters}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-3 mb-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Players */}
          <div className="space-y-4">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Players ({data.players.length}/{g.maxPlayers})
              </h2>
              {data.players.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  Waiting for players to join...
                </p>
              ) : (
                <div className="space-y-2">
                  {data.players.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-white text-sm font-medium">
                          {p.name}
                        </div>
                        {p.preferencesSubmitted && (
                          <div className="text-slate-400 text-xs">
                            ${p.willingnessToPay}/qtr
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {g.phase === "preferences" && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.preferencesSubmitted
                                ? "bg-emerald-400"
                                : "bg-slate-600"
                            }`}
                          />
                        )}
                        {g.phase === "playing" && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              p.actionSubmittedForQuarter === g.quarter
                                ? "bg-emerald-400"
                                : "bg-slate-600"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Controls */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Game Controls
              </h2>
              <div className="space-y-2">
                {g.phase === "lobby" && (
                  <button
                    onClick={() => adminAction("start-preferences")}
                    disabled={
                      actionLoading || data.players.length < 1
                    }
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-bold rounded-xl transition-all"
                  >
                    Start Preferences Phase
                  </button>
                )}
                {g.phase === "preferences" && (
                  <button
                    onClick={() => adminAction("calculate-results")}
                    disabled={actionLoading}
                    className={`w-full py-3 font-bold rounded-xl transition-all ${
                      allPrefsSubmitted
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
                        : "bg-amber-600/50 text-amber-200 hover:bg-amber-600"
                    }`}
                  >
                    {allPrefsSubmitted
                      ? "Calculate Results"
                      : `Waiting... (${data.preferencesSubmittedCount}/${data.totalPlayers})`}
                  </button>
                )}
                {g.phase === "results" && (
                  <button
                    onClick={() => adminAction("start-game")}
                    disabled={actionLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold rounded-xl transition-all"
                  >
                    Start Game
                  </button>
                )}
                {g.phase === "playing" && (
                  <>
                    <button
                      onClick={() => adminAction("advance-quarter")}
                      disabled={actionLoading}
                      className={`w-full py-3 font-bold rounded-xl transition-all ${
                        allSubmitted
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
                          : "bg-amber-600/50 text-amber-200 hover:bg-amber-600"
                      }`}
                    >
                      {allSubmitted
                        ? "Advance to Next Quarter"
                        : `Waiting... (${data.actionsSubmittedCount}/${data.totalPlayers} submitted)`}
                    </button>
                    <button
                      onClick={() => adminAction("end-game")}
                      disabled={actionLoading}
                      className="w-full py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 font-semibold rounded-xl transition-all text-sm"
                    >
                      End Game Early
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Center: Game State */}
          <div className="space-y-4">
            {/* Grid Status (during play) */}
            {g.gridState && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                  Grid Status
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    label="Revenue/qtr"
                    value={`$${g.gridState.quarterlyRevenue.toLocaleString()}`}
                    icon="💰"
                  />
                  <StatCard
                    label="Budget"
                    value={`$${g.gridState.budget.toLocaleString()}`}
                    icon="🏦"
                    warning={g.gridState.budget < g.gridState.quarterlyRevenue * 0.3}
                  />
                  <StatCard
                    label="Population"
                    value={g.gridState.population.toLocaleString()}
                    icon="👥"
                  />
                  <StatCard
                    label="Demand"
                    value={`${g.gridState.demand} MW`}
                    icon="📈"
                    warning={g.gridState.demand > g.gridState.capacity * 0.9}
                  />
                  <StatCard
                    label="Capacity"
                    value={`${g.gridState.capacity} MW`}
                    icon="🔋"
                  />
                  <StatCard
                    label="Reliability"
                    value={`${g.gridState.reliability}%`}
                    icon="💡"
                    warning={g.gridState.reliability < 70}
                  />
                </div>
              </div>
            )}

            {/* Driver Health */}
            {g.driverHealth && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                  Driver Health
                </h2>
                <div className="space-y-2">
                  {DRIVERS.map((d) => {
                    const val = g.driverHealth![d.key];
                    return (
                      <div key={d.key}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-slate-300">
                            {d.icon} {d.label}
                          </span>
                          <span
                            className={
                              val > 60
                                ? "text-emerald-400"
                                : val > 30
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }
                          >
                            {val}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              val > 60
                                ? "bg-emerald-500"
                                : val > 30
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weighted Scores (after preferences) */}
            {g.weightedScores && (g.phase === "results" || g.phase === "playing" || g.phase === "game-over") && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                <h2 className="text-white font-semibold text-sm mb-2 uppercase tracking-wide">
                  Customer Priorities (Weighted)
                </h2>
                <div className="text-center mb-3">
                  <span className="text-slate-400 text-xs">Avg WTP: </span>
                  <span className="text-amber-400 font-bold">
                    ${g.averageWillingness}
                  </span>
                  <span className="text-slate-400 text-xs">/qtr</span>
                </div>
                <div className="space-y-2">
                  {DRIVERS.map((d) => {
                    const val = g.weightedScores![d.key];
                    return (
                      <div key={d.key}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-slate-300">
                            {d.icon} {d.label}
                          </span>
                          <span className="text-amber-400">{val}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Disaster */}
            {g.activeDisaster && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{g.activeDisaster.icon}</span>
                  <span className="text-red-300 font-bold text-sm">
                    {g.activeDisaster.name}
                  </span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      g.activeDisaster.severity === "catastrophic"
                        ? "bg-red-600 text-white"
                        : g.activeDisaster.severity === "severe"
                          ? "bg-orange-600 text-white"
                          : "bg-yellow-600 text-slate-900"
                    }`}
                  >
                    {g.activeDisaster.severity}
                  </span>
                </div>
                <p className="text-red-400/80 text-xs">
                  {g.activeDisaster.description}
                </p>
              </div>
            )}
          </div>

          {/* Right: Events + Analytics */}
          <div className="space-y-4">
            {/* Analytics (game over or during play for admin) */}
            {data.analytics && (
              <AnalyticsPanel analytics={data.analytics} />
            )}

            {/* Event Log */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
              <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                Event Log
              </h2>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {[...g.events].reverse().map((ev, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-2 text-xs border ${
                      ev.type === "disaster"
                        ? "bg-red-900/30 border-red-500/30 text-red-300"
                        : ev.type === "warning"
                          ? "bg-yellow-900/30 border-yellow-500/30 text-yellow-300"
                          : ev.type === "growth"
                            ? "bg-blue-900/30 border-blue-500/30 text-blue-300"
                            : "bg-slate-700/30 border-slate-600/30 text-slate-300"
                    }`}
                  >
                    {ev.icon} {ev.description}
                    {ev.quarter > 0 && (
                      <span className="text-slate-500 ml-1">(Q{ev.quarter})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Score */}
            {g.phase === "game-over" && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-black text-amber-400 mb-1">
                  {g.score}
                </div>
                <div className="text-slate-400 text-sm">Final Score</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  warning,
}: {
  label: string;
  value: string;
  icon: string;
  warning?: boolean;
}) {
  return (
    <div className={`bg-slate-700/50 rounded-lg p-2.5 ${warning ? "border border-red-500/50" : ""}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs">{icon}</span>
        <span className="text-slate-400 text-xs uppercase">{label}</span>
      </div>
      <div className={`font-bold text-sm ${warning ? "text-red-400" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function AnalyticsPanel({ analytics }: { analytics: GameAnalytics }) {
  return (
    <>
      {/* Segments */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
          Customer Segments
        </h2>
        <div className="space-y-2">
          {analytics.segments.map((seg) => (
            <div
              key={seg.name}
              className="bg-slate-700/40 rounded-lg p-3 border-l-4"
              style={{ borderColor: seg.color }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-white text-sm font-semibold">
                  {seg.name}
                </span>
                <span className="text-slate-400 text-xs">
                  {seg.playerCount} player{seg.playerCount !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-2">{seg.description}</p>
              <div className="grid grid-cols-2 gap-x-4 text-xs">
                <div>
                  <span className="text-slate-500">Avg WTP: </span>
                  <span className="text-amber-400">
                    ${seg.avgWillingnessToPay}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Avg Spend: </span>
                  <span className="text-emerald-400">${seg.avgSpend}</span>
                </div>
                <div>
                  <span className="text-slate-500">Stated: </span>
                  <span className="text-blue-400">
                    {seg.topStatedPriority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Revealed: </span>
                  <span className="text-purple-400">
                    {seg.topRevealedPriority}
                  </span>
                </div>
              </div>
              {seg.statedVsRevealedGap > 30 && (
                <div className="mt-1 text-xs text-orange-400">
                  High stated/revealed gap ({seg.statedVsRevealedGap})
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Correlations */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
          Behavioural Insights
        </h2>
        <div className="space-y-3">
          <CorrelationRow
            label="WTP vs Action Count"
            value={analytics.correlations.willingnessVsActions}
            description="Do higher-paying customers take more actions?"
          />
          <CorrelationRow
            label="Stated vs Revealed"
            value={analytics.correlations.statedVsRevealed}
            description="Do customers act on what they said matters?"
          />
          <CorrelationRow
            label="Budget Efficiency"
            value={analytics.correlations.budgetEfficiency}
            description="Does spending align with stated priorities?"
          />
        </div>
      </div>

      {/* Per-player stated vs revealed */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
          Stated vs Revealed Preferences
        </h2>
        <div className="space-y-3">
          {analytics.players.map((p) => (
            <div key={p.playerId} className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  {p.name}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: p.segmentColor + "30",
                    color: p.segmentColor,
                  }}
                >
                  {p.segment}
                </span>
              </div>
              <div className="space-y-1">
                {DRIVERS.map((d) => {
                  const stated = p.statedPriorities[d.key] ?? 0;
                  const revealed = p.revealedPriorities[d.key] ?? 0;
                  const totalStated = Object.values(p.statedPriorities).reduce((a, b) => a + b, 0);
                  const statedNorm = totalStated > 0 ? Math.round((stated / totalStated) * 100) : 0;
                  return (
                    <div key={d.key} className="flex items-center gap-2 text-xs">
                      <span className="w-4">{d.icon}</span>
                      <div className="flex-1">
                        <div className="flex gap-0.5 h-2">
                          <div
                            className="bg-blue-500 rounded-l"
                            style={{ width: `${statedNorm}%` }}
                            title={`Stated: ${statedNorm}%`}
                          />
                          <div
                            className="bg-purple-500 rounded-r"
                            style={{ width: `${revealed}%` }}
                            title={`Revealed: ${revealed}%`}
                          />
                        </div>
                      </div>
                      <span className="text-blue-400 w-8 text-right">
                        {statedNorm}
                      </span>
                      <span className="text-slate-600">/</span>
                      <span className="text-purple-400 w-8">
                        {revealed}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-1 text-xs text-slate-500">
                <span>
                  <span className="inline-block w-2 h-2 rounded-sm bg-blue-500 mr-1" />
                  Stated
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-sm bg-purple-500 mr-1" />
                  Revealed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Popularity */}
      {analytics.actionOutcomes.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
          <h2 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
            Action Popularity
          </h2>
          <div className="space-y-1.5">
            {analytics.actionOutcomes
              .sort((a, b) => b.timesChosen - a.timesChosen)
              .map((ao) => {
                const driverConfig = DRIVERS.find((d) => d.key === ao.driver);
                return (
                  <div
                    key={ao.actionId}
                    className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs">{driverConfig?.icon}</span>
                      <span className="text-white text-xs truncate">
                        {ao.actionName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-amber-400 text-xs font-bold">
                        {ao.timesChosen}x
                      </span>
                      <span className="text-slate-500 text-xs">
                        ${ao.totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}

function CorrelationRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  const abs = Math.abs(value);
  const color =
    abs > 0.7
      ? "text-emerald-400"
      : abs > 0.4
        ? "text-yellow-400"
        : "text-slate-400";
  const strength =
    abs > 0.7 ? "Strong" : abs > 0.4 ? "Moderate" : "Weak";

  return (
    <div>
      <div className="flex justify-between items-center">
        <span className="text-white text-sm">{label}</span>
        <span className={`font-bold ${color}`}>
          {value.toFixed(2)} ({strength})
        </span>
      </div>
      <p className="text-slate-500 text-xs">{description}</p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
