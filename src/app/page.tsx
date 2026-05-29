"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Game config for admin creation
  const [maxQuarters, setMaxQuarters] = useState(16);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [showCreate, setShowCreate] = useState(false);

  const handleJoin = async () => {
    if (!joinCode.trim() || !playerName.trim()) {
      setError("Enter a game code and your name");
      return;
    }
    setJoining(true);
    setError("");
    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: joinCode.trim(), name: playerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to join");
        return;
      }
      // Store session
      localStorage.setItem(`pg-session-${data.gameId}`, data.sessionToken);
      localStorage.setItem(`pg-player-name`, playerName.trim());
      router.push(`/play?gameId=${data.gameId}`);
    } catch {
      setError("Network error");
    } finally {
      setJoining(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxQuarters, maxPlayers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create game");
        return;
      }
      localStorage.setItem(`pg-admin-${data.gameId}`, data.adminToken);
      router.push(`/admin?gameId=${data.gameId}`);
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">⚡</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Power
            <span className="text-amber-400"> Grid</span>
          </h1>
          <p className="text-slate-400 text-base max-w-md mx-auto">
            A multiplayer resource management game exploring what customers
            truly value in their electricity network.
          </p>
        </div>

        {/* Join Game */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-4">
          <h2 className="text-white font-semibold text-lg mb-4">Join a Game</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Game Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-bold rounded-xl transition-all"
            >
              {joining ? "Joining..." : "Join Game"}
            </button>
          </div>
        </div>

        {/* Create Game */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full text-left flex items-center justify-between"
          >
            <h2 className="text-white font-semibold text-lg">
              Create New Game (Admin)
            </h2>
            <span className="text-slate-400 text-xl">
              {showCreate ? "−" : "+"}
            </span>
          </button>

          {showCreate && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Game Duration (Quarters)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={4}
                    max={32}
                    step={4}
                    value={maxQuarters}
                    onChange={(e) => setMaxQuarters(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-amber-400 font-bold w-24 text-right">
                    {maxQuarters} qtrs ({maxQuarters / 4}y)
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-xs mt-1">
                  <span>4 (1 year)</span>
                  <span>32 (8 years)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Maximum Players
                </label>
                <div className="flex gap-2">
                  {[2, 4, 6, 8, 10, 15, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxPlayers(n)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        maxPlayers === n
                          ? "bg-amber-500 text-slate-900"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white font-bold rounded-xl transition-all"
              >
                {creating ? "Creating..." : "Create Game"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-900/50 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">
          A behavioural economics experiment in resource management
        </p>
      </div>
    </div>
  );
}
