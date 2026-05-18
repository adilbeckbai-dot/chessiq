"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

type Puzzle = {
  id: number;
  title: string;
  description: string;
  fen: string;
  solution: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
};

const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: "Fork the King and Queen",
    description: "Найди ход конём, который атакует короля и ферзя одновременно.",
    fen: "r1bq1rk1/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 1",
    solution: "Nxe5",
    difficulty: "Easy",
    category: "Tactical Fork",
  },
  {
    id: 2,
    title: "Back Rank Mate in 1",
    description: "Чёрный король заблокирован — поставь мат одним ходом.",
    fen: "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1",
    solution: "Ra8#",
    difficulty: "Easy",
    category: "Mate in 1",
  },
  {
    id: 3,
    title: "Discovered Attack",
    description: "Открытое нападение — двинь коня и открой атаку слона на ферзя.",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    solution: "Ng5",
    difficulty: "Medium",
    category: "Discovered Attack",
  },
  {
    id: 4,
    title: "Pin the Queen",
    description: "Связка — атакуй ферзя, который защищает короля.",
    fen: "rnb1k2r/pppp1ppp/5n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1",
    solution: "Nd5",
    difficulty: "Medium",
    category: "Pin Tactic",
  },
  {
    id: 5,
    title: "Sacrifice for Mate",
    description: "Пожертвуй ферзя, чтобы поставить мат в 2 хода.",
    fen: "6k1/5ppp/8/8/8/5Q2/5PPP/6K1 w - - 0 1",
    solution: "Qf8+",
    difficulty: "Hard",
    category: "Sacrifice",
  },
];

export default function Puzzles({ onClose }: { onClose: () => void }) {
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [game, setGame] = useState(new Chess(PUZZLES[0].fen));
  const [position, setPosition] = useState(PUZZLES[0].fen);
  const [feedback, setFeedback] = useState<string>("");
  const [solved, setSolved] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  function onDrop(sourceSquare: string, targetSquare: string) {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) return false;

      setPosition(game.fen());

      // Шешімін тексеру
      const puzzle = PUZZLES[currentPuzzle];
      const moveSan = move.san;

      if (moveSan === puzzle.solution || moveSan.replace("+", "").replace("#", "") === puzzle.solution.replace("+", "").replace("#", "")) {
        setFeedback("🎉 Правильно! Отличное решение!");
        if (!solved.includes(currentPuzzle)) {
          setSolved((prev) => [...prev, currentPuzzle]);
          const points = puzzle.difficulty === "Easy" ? 10 : puzzle.difficulty === "Medium" ? 20 : 30;
          setScore((prev) => prev + points);
        }
      } else {
        setFeedback(`❌ Не совсем... Попробуй еще! Подсказка: ${puzzle.category}`);
        // Артқа қайтару
        setTimeout(() => {
          const newGame = new Chess(puzzle.fen);
          setGame(newGame);
          setPosition(puzzle.fen);
          setFeedback("");
        }, 1500);
      }

      return true;
    } catch {
      return false;
    }
  }

  function selectPuzzle(index: number) {
    setCurrentPuzzle(index);
    const newGame = new Chess(PUZZLES[index].fen);
    setGame(newGame);
    setPosition(PUZZLES[index].fen);
    setFeedback("");
  }

  function resetPuzzle() {
    const puzzle = PUZZLES[currentPuzzle];
    const newGame = new Chess(puzzle.fen);
    setGame(newGame);
    setPosition(puzzle.fen);
    setFeedback("");
  }

  function showHint() {
    const puzzle = PUZZLES[currentPuzzle];
    setFeedback(`💡 Подсказка: ${puzzle.category}. Это ход типа "${puzzle.title}".`);
  }

  const puzzle = PUZZLES[currentPuzzle];

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 max-w-4xl w-full border-2 border-orange-500 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              🧩 <span className="text-orange-500">Chess</span> for Engineers
            </h2>
            <p className="text-zinc-400 text-sm">BigTech interview prep · Tactical puzzles</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-orange-900/30 border border-orange-700/50 px-3 py-1 rounded-full">
              <span className="text-orange-400 font-bold text-sm">⭐ {score} pts</span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Puzzle list */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-white text-sm font-semibold mb-2">📚 Puzzles</h3>
            {PUZZLES.map((p, i) => (
              <button
                key={p.id}
                onClick={() => selectPuzzle(i)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  currentPuzzle === i
                    ? "bg-orange-600 text-white shadow-lg"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">
                    {solved.includes(i) ? "✅" : `#${i + 1}`}
                  </span>
                  <span className={`text-xs ${
                    p.difficulty === "Easy" ? "text-green-400" :
                    p.difficulty === "Medium" ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {p.difficulty}
                  </span>
                </div>
                <p className="text-sm font-semibold">{p.title}</p>
              </button>
            ))}
          </div>

          {/* Board + info */}
          <div className="md:col-span-2">
            <div className="bg-zinc-900 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold">{puzzle.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  puzzle.difficulty === "Easy" ? "bg-green-900/50 text-green-400" :
                  puzzle.difficulty === "Medium" ? "bg-yellow-900/50 text-yellow-400" : "bg-red-900/50 text-red-400"
                }`}>
                  {puzzle.difficulty}
                </span>
              </div>
              <p className="text-zinc-400 text-sm mb-3">{puzzle.description}</p>
              <p className="text-orange-400 text-xs">📂 {puzzle.category}</p>
            </div>

            <div className="bg-zinc-800 rounded-xl p-3 mb-3">
              <Chessboard
                options={{
                  position: position,
                  onPieceDrop: ({ sourceSquare, targetSquare }) => {
                    if (!targetSquare) return false;
                    return onDrop(sourceSquare, targetSquare);
                  },
                }}
              />
            </div>

            {feedback && (
              <div className={`p-3 rounded-lg mb-3 text-sm font-semibold ${
                feedback.startsWith("🎉") ? "bg-green-900/30 border border-green-700/50 text-green-300" :
                feedback.startsWith("💡") ? "bg-blue-900/30 border border-blue-700/50 text-blue-300" :
                "bg-red-900/30 border border-red-700/50 text-red-300"
              }`}>
                {feedback}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={resetPuzzle}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                🔄 Reset
              </button>
              <button
                onClick={showHint}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                💡 Hint
              </button>
              {currentPuzzle < PUZZLES.length - 1 && (
                <button
                  onClick={() => selectPuzzle(currentPuzzle + 1)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Next →
                </button>
              )}
            </div>

            <div className="mt-4 text-xs text-zinc-500 text-center">
              🎯 Solved: {solved.length}/{PUZZLES.length} · Earn points by solving puzzles!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}