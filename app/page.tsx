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
  const [currentAnalysis, setCurrentAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [moveCount, setMoveCount] = useState({ good: 0, total: 0 });

  // 2 Stockfish — біреу ойнайды, біреу талдайды
  const playEngineRef = useRef<Worker | null>(null);
  const analysisEngineRef = useRef<Worker | null>(null);

  const gameRef = useRef(game);
  const lastPlayerMoveRef = useRef<string>("");
  const moveHistoryRef = useRef<string[]>([]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    moveHistoryRef.current = moveHistory;
  }, [moveHistory]);

  // Play engine — AI ойнайды
  useEffect(() => {
    if (typeof window === "undefined") return;

    const playSf = new Worker("/stockfish.js");
    playEngineRef.current = playSf;

    playSf.onmessage = (e: MessageEvent) => {
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
              updateStatus(currentGame);
            }
          } catch {
            // skip
          }
          setIsThinking(false);
        }
      }
    };

    playSf.postMessage("uci");
    playSf.postMessage("isready");

    return () => {
      playSf.terminate();
    };
  }, []);

  // Analysis engine — талдау жасайды
  useEffect(() => {
    if (typeof window === "undefined") return;

    const analysisSf = new Worker("/stockfish.js");
    analysisEngineRef.current = analysisSf;

    analysisSf.onmessage = (e: MessageEvent) => {
      const message = typeof e.data === "string" ? e.data : "";

      if (message.startsWith("bestmove")) {
        const parts = message.split(" ");
        const bestMove = parts[1];

        if (bestMove && bestMove !== "(none)") {
          analyzeMove(bestMove);
        }
      }
    };

    analysisSf.postMessage("uci");
    analysisSf.postMessage("isready");

    return () => {
      analysisSf.terminate();
    };
  }, []);

  function updateStatus(g: Chess) {
    if (g.isCheckmate()) {
      setGameStatus(g.turn() === "w" ? "🏆 AI Wins!" : "🎉 You Win!");
    } else if (g.isDraw()) {
      setGameStatus("🤝 Draw");
    } else if (g.isCheck()) {
      setGameStatus("⚠️ Check! Your turn");
    } else {
      setGameStatus(g.turn() === "w" ? "Your turn ♔" : "AI thinking... 🤔");
    }
  }

  async function analyzeMove(bestMove: string) {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: gameRef.current.fen(),
          lastMove: lastPlayerMoveRef.current,
          bestMove: bestMove,
          moveHistory: moveHistoryRef.current,
        }),
      });

      const data = await response.json();
      setCurrentAnalysis(data.analysis);

      const wasGood =
        data.analysis.includes("🟢") || data.analysis.includes("🟡");
      setMoveCount((prev) => {
        const newTotal = prev.total + 1;
        const newGood = wasGood ? prev.good + 1 : prev.good;
        setAccuracy(Math.round((newGood / newTotal) * 100));
        return { good: newGood, total: newTotal };
      });
    } catch {
      setCurrentAnalysis("⚠️ Не удалось получить анализ. Проверь подключение.");
    }
    setIsAnalyzing(false);
  }

  function requestAIMove(fen: string) {
    if (!playEngineRef.current) return;
    setIsThinking(true);
    setGameStatus("AI thinking... 🤔");

    const depth = difficulty === "easy" ? 2 : difficulty === "medium" ? 8 : 15;
    playEngineRef.current.postMessage("position fen " + fen);
    playEngineRef.current.postMessage("go depth " + depth);
  }

  function requestAnalysis(fenBeforeMove: string) {
    if (!analysisEngineRef.current) return;
    analysisEngineRef.current.postMessage("position fen " + fenBeforeMove);
    analysisEngineRef.current.postMessage("go depth 12");
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (game.turn() !== "w" || isThinking) return false;

    try {
      const fenBeforeMove = game.fen();

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) return false;

      const newFen = game.fen();
      setPosition(newFen);
      setMoveHistory((prev) => [...prev, move.san]);
      lastPlayerMoveRef.current = move.san;

      if (game.isCheckmate()) {
        setGameStatus("🎉 You Win!");
        return true;
      } else if (game.isDraw()) {
        setGameStatus("🤝 Draw");
        return true;
      }

      // Талдау сұраймыз (ходтан бұрынғы позицияға)
      setTimeout(() => requestAnalysis(fenBeforeMove), 100);

      // AI жауап беретін уақыт
      setTimeout(() => requestAIMove(newFen), 1500);

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
    setCurrentAnalysis("");
    setAccuracy(100);
    setMoveCount({ good: 0, total: 0 });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">
            ♟ <span className="text-orange-500">Chess</span>IQ
          </h1>
          <p className="text-zinc-400 text-lg">
            Chess + AI Coach for STEM Students · Powered by Stockfish & Llama 3.3
          </p>
        </header>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Сол жақ — Settings */}
          <div className="lg:col-span-1 space-y-4">
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
                📊 Performance
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Accuracy</span>
                    <span className="text-orange-400 font-bold">{accuracy}%</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Good moves:</span>
                  <span className="text-white">{moveCount.good}/{moveCount.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Total moves:</span>
                  <span className="text-white">{moveHistory.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-6 border border-zinc-700">
              <h2 className="text-white font-semibold mb-3 text-lg">
                📊 Status
              </h2>
              <p className="text-orange-400 font-semibold text-base">
                {gameStatus}
              </p>
            </div>

            <button
              onClick={resetGame}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-orange-600/30"
            >
              🔄 New Game
            </button>
          </div>

          {/* Орта — Тақта */}
          <div className="lg:col-span-2">
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

          {/* Оң жақ — AI Coach */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-orange-900/30 to-zinc-800/50 backdrop-blur rounded-2xl p-6 border border-orange-700/30 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🧠</span>
                <h2 className="text-white font-semibold text-lg">
                  AI Coach
                </h2>
              </div>

              {isAnalyzing && (
                <div className="flex items-center gap-2 text-orange-400 mb-3">
                  <div className="animate-spin h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Analyzing your move...</span>
                </div>
              )}

              {currentAnalysis ? (
                <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {currentAnalysis}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm italic">
                  Сделай ход — AI Coach проанализирует и даст совет в стиле инженера.
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-zinc-700/50">
                <p className="text-xs text-zinc-500">
                  💡 Совет: думай о ходах как о PID-контроллере — каждое решение должно вести к стабильности.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center mt-8 text-zinc-500 text-sm">
          <p>Built by Akzhol Adil · KazNU · nFactorial Incubator 2026</p>
          <p className="text-xs mt-1">
            Published author in Eurasian Science Review · Stanford ML Certified
          </p>
        </footer>
      </div>
    </div>
  );
}