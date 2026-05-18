"use client";

import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

type Difficulty = "easy" | "medium" | "hard";

export default function Home() {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isThinking, setIsThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState("Your turn ♔");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const stockfishRef = useRef<Worker | null>(null);
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Stockfish-ті іске қосу
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sf = new Worker("/stockfish.js");
    stockfishRef.current = sf;

    sf.onmessage = (e: MessageEvent) => {
      const message = typeof e.data === "string" ? e.data : "";

      if (message.startsWith("bestmove")) {
        const parts = message.split(" ");
        const move = parts[1];

        if (move && move !== "(none)") {
          const from = move.substring(0, 2);
          const to = move.substring(2, 4);
          const promotion = move.length > 4 ? move.substring(4, 5) : "q";

          const currentGame = gameRef.current;
          try {
            const result = currentGame.move({ from, to, promotion });
            if (result) {
              setPosition(currentGame.fen());
              setMoveHistory((prev) => [...prev, result.san]);

              if (currentGame.isCheckmate()) {
                setGameStatus("🏆 AI Wins!");
              } else if (currentGame.isDraw()) {
                setGameStatus("🤝 Draw");
              } else if (currentGame.isCheck()) {
                setGameStatus("⚠️ Check! Your turn");
              } else {
                setGameStatus("Your turn ♔");
              }
            }
          } catch {
            // skip
          }
          setIsThinking(false);
        }
      }
    };

    sf.postMessage("uci");
    sf.postMessage("isready");

    return () => {
      sf.terminate();
    };
  }, []);

  function requestAIMove(fen: string) {
    if (!stockfishRef.current) return;
    setIsThinking(true);
    setGameStatus("AI thinking... 🤔");

    const depth = difficulty === "easy" ? 2 : difficulty === "medium" ? 8 : 15;
    stockfishRef.current.postMessage("position fen " + fen);
    stockfishRef.current.postMessage("go depth " + depth);
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (game.turn() !== "w" || isThinking) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) return false;

      const newFen = game.fen();
      setPosition(newFen);
      setMoveHistory((prev) => [...prev, move.san]);

      if (game.isCheckmate()) {
        setGameStatus("🎉 You Win!");
        return true;
      } else if (game.isDraw()) {
        setGameStatus("🤝 Draw");
        return true;
      }

      // AI ход жасайды
      setTimeout(() => requestAIMove(newFen), 300);

      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setPosition(newGame.fen());
    setMoveHistory([]);
    setGameStatus("Your turn ♔");
    setIsThinking(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">
            ♟ <span className="text-orange-500">Chess</span>IQ
          </h1>
          <p className="text-zinc-400 text-lg">
            Chess + AI for Engineers · Powered by Stockfish
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-6 border border-zinc-700">
              <h2 className="text-white font-semibold mb-4 text-lg">
                ⚙️ Difficulty
              </h2>
              <div className="space-y-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                      difficulty === level
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                        : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                    }`}
                  >
                    {level === "easy"
                      ? "🟢 Easy"
                      : level === "medium"
                      ? "🟡 Medium"
                      : "🔴 Hard"}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-6 border border-zinc-700">
              <h2 className="text-white font-semibold mb-3 text-lg">
                📊 Status
              </h2>
              <p className="text-orange-400 font-semibold text-lg">
                {gameStatus}
              </p>
              <p className="text-zinc-500 text-sm mt-2">
                Moves: {moveHistory.length}
              </p>
            </div>

            <button
              onClick={resetGame}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-orange-600/30"
            >
              🔄 New Game
            </button>
          </div>

          <div className="md:col-span-2">
            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-4 md:p-6 border border-zinc-700 shadow-2xl">
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

            <div className="mt-4 bg-zinc-800/50 backdrop-blur rounded-2xl p-4 border border-zinc-700">
              <h3 className="text-white font-semibold mb-2 text-sm">
                📜 Move History
              </h3>
              <div className="text-zinc-400 text-sm max-h-20 overflow-y-auto">
                {moveHistory.length === 0 ? (
                  <p className="text-zinc-600 italic">No moves yet...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {moveHistory.map((move, i) => (
                      <span
                        key={i}
                        className="bg-zinc-700 px-2 py-1 rounded text-xs"
                      >
                        {Math.floor(i / 2) + 1}
                        {i % 2 === 0 ? "." : "..."} {move}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-8 text-zinc-500 text-sm">
          <p>Built by Akzhol Adil · KazNU · nFactorial Incubator 2026</p>
        </footer>
      </div>
    </div>
  );
}