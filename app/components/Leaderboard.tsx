"use client";

import { useState, useEffect } from "react";

type LeaderEntry = {
  name: string;
  city: string;
  accuracy: number;
  wins: number;
  date: string;
};

const DEFAULT_LEADERBOARD: LeaderEntry[] = [
  { name: "Aibek K.", city: "Almaty (KazNU)", accuracy: 94, wins: 47, date: "2026-05-15" },
  { name: "Dana M.", city: "Astana (NU)", accuracy: 91, wins: 42, date: "2026-05-14" },
  { name: "Timur S.", city: "Almaty (KBTU)", accuracy: 88, wins: 38, date: "2026-05-16" },
  { name: "Aiman T.", city: "Shymkent (SKU)", accuracy: 86, wins: 35, date: "2026-05-13" },
  { name: "Bauyrzhan Z.", city: "Almaty (KazNU)", accuracy: 84, wins: 31, date: "2026-05-12" },
];

export default function Leaderboard({
  myAccuracy,
  myWins,
  onClose,
}: {
  myAccuracy: number;
  myWins: number;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "almaty" | "kaznu">("all");

  useEffect(() => {
    const saved = localStorage.getItem("chessiq_leaderboard");
    const baseEntries = saved ? JSON.parse(saved) : DEFAULT_LEADERBOARD;
    setEntries(baseEntries);
  }, []);

  function saveMyScore() {
    const name = prompt("Enter your name for the leaderboard:");
    if (!name) return;
    const newEntry: LeaderEntry = {
      name: name + " (You)",
      city: "Almaty (KazNU)",
      accuracy: myAccuracy,
      wins: myWins,
      date: new Date().toISOString().split("T")[0],
    };
    const updated = [...entries, newEntry].sort((a, b) => b.accuracy - a.accuracy).slice(0, 10);
    setEntries(updated);
    localStorage.setItem("chessiq_leaderboard", JSON.stringify(updated));
  }

  const filtered = entries.filter((e) => {
    if (filter === "almaty") return e.city.includes("Almaty");
    if (filter === "kaznu") return e.city.includes("KazNU");
    return true;
  });

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 max-w-lg w-full border-2 border-orange-500 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            🏆 <span className="text-orange-500">Kazakhstan</span> Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs rounded-full font-semibold transition-colors ${
              filter === "all"
                ? "bg-orange-600 text-white"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            🌍 All
          </button>
          <button
            onClick={() => setFilter("almaty")}
            className={`px-3 py-1 text-xs rounded-full font-semibold transition-colors ${
              filter === "almaty"
                ? "bg-orange-600 text-white"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            🏙 Almaty
          </button>
          <button
            onClick={() => setFilter("kaznu")}
            className={`px-3 py-1 text-xs rounded-full font-semibold transition-colors ${
              filter === "kaznu"
                ? "bg-orange-600 text-white"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            🎓 KazNU
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg ${
                entry.name.includes("(You)")
                  ? "bg-orange-900/30 border border-orange-700/50"
                  : "bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0
                      ? "bg-yellow-500 text-black"
                      : i === 1
                      ? "bg-zinc-400 text-black"
                      : i === 2
                      ? "bg-orange-700 text-white"
                      : "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{entry.name}</p>
                  <p className="text-zinc-500 text-xs">{entry.city}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-400 font-bold">{entry.accuracy}%</p>
                <p className="text-zinc-500 text-xs">{entry.wins} wins</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveMyScore}
          className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
        >
          📊 Add My Score ({myAccuracy}% accuracy)
        </button>

        <p className="text-xs text-zinc-500 mt-3 text-center">
          🇰🇿 Compete with top players from Kazakhstan
        </p>
      </div>
    </div>
  );
}