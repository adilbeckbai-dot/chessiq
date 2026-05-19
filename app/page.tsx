"use client";

import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Leaderboard from "./components/Leaderboard";
import Puzzles from "./components/Puzzles";
import { translations, type Language } from "./i18n/translations";

type Difficulty = "easy" | "medium" | "hard";
type GameMode = "ai" | "local";

type Theme = {
  id: string;
  name: string;
  emoji: string;
  lightSquare: string;
  darkSquare: string;
  isPro: boolean;
};

const THEMES: Theme[] = [
  { id: "classic", name: "Classic", emoji: "🟫", lightSquare: "#f0d9b5", darkSquare: "#b58863", isPro: false },
  { id: "forest", name: "Forest", emoji: "🌲", lightSquare: "#eeeed2", darkSquare: "#769656", isPro: false },
  { id: "ocean", name: "Ocean", emoji: "🌊", lightSquare: "#dee3e6", darkSquare: "#4a7faa", isPro: true },
  { id: "sakura", name: "Sakura", emoji: "🌸", lightSquare: "#fce8f0", darkSquare: "#d97aa3", isPro: true },
  { id: "midnight", name: "Midnight", emoji: "🌙", lightSquare: "#a3b4cc", darkSquare: "#3d3d6b", isPro: true },
];

export default function Home() {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [isThinking, setIsThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [moveCount, setMoveCount] = useState({ good: 0, total: 0 });

  const [showProModal, setShowProModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPuzzles, setShowPuzzles] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [aiUsesLeft, setAiUsesLeft] = useState(5);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [totalWins, setTotalWins] = useState(0);
  const [lang, setLang] = useState<Language>("ru");
  const [gameStatus, setGameStatus] = useState("Your turn ♔");

  const t = translations[lang];

  const moveSoundRef = useRef<HTMLAudioElement | null>(null);
  const captureSoundRef = useRef<HTMLAudioElement | null>(null);
  const checkSoundRef = useRef<HTMLAudioElement | null>(null);
  const victorySoundRef = useRef<HTMLAudioElement | null>(null);

  const playEngineRef = useRef<Worker | null>(null);
  const analysisEngineRef = useRef<Worker | null>(null);
  const gameRef = useRef(game);
  const lastPlayerMoveRef = useRef<string>("");
  const moveHistoryRef = useRef<string[]>([]);
  const isProRef = useRef(isPro);
  const aiUsesLeftRef = useRef(aiUsesLeft);
  const langRef = useRef(lang);
  const gameModeRef = useRef(gameMode);

  useEffect(() => {
    const saved = localStorage.getItem("chessiq_lang") as Language;
    if (saved && ["kz", "ru", "en"].includes(saved)) setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("chessiq_lang", lang);
    langRef.current = lang;
    setGameStatus(t.yourTurn);
  }, [lang]);

  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { moveHistoryRef.current = moveHistory; }, [moveHistory]);
  useEffect(() => { isProRef.current = isPro; }, [isPro]);
  useEffect(() => { aiUsesLeftRef.current = aiUsesLeft; }, [aiUsesLeft]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    moveSoundRef.current = new Audio("/sounds/Move.mp3");
    captureSoundRef.current = new Audio("/sounds/Capture.mp3");
    checkSoundRef.current = new Audio("/sounds/Check.mp3");
    victorySoundRef.current = new Audio("/sounds/Victory.mp3");
    [moveSoundRef, captureSoundRef, checkSoundRef, victorySoundRef].forEach((ref) => {
      if (ref.current) ref.current.volume = 0.4;
    });
  }, []);

  function playSound(type: "move" | "capture" | "check" | "victory") {
    const ref = type === "move" ? moveSoundRef : type === "capture" ? captureSoundRef : type === "check" ? checkSoundRef : victorySoundRef;
    if (ref.current) {
      ref.current.currentTime = 0;
      ref.current.play().catch(() => {});
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const playSf = new Worker("/stockfish.js");
    playEngineRef.current = playSf;
    playSf.onmessage = (e: MessageEvent) => {
      const message = typeof e.data === "string" ? e.data : "";
      if (message.startsWith("bestmove")) {
        const move = message.split(" ")[1];
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
              if (result.captured) playSound("capture"); else playSound("move");
              updateStatus(currentGame);
            }
          } catch {}
          setIsThinking(false);
        }
      }
    };
    playSf.postMessage("uci");
    playSf.postMessage("isready");
    return () => playSf.terminate();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const analysisSf = new Worker("/stockfish.js");
    analysisEngineRef.current = analysisSf;
    analysisSf.onmessage = (e: MessageEvent) => {
      const message = typeof e.data === "string" ? e.data : "";
      if (message.startsWith("bestmove")) {
        const bestMove = message.split(" ")[1];
        if (bestMove && bestMove !== "(none)") analyzeMove(bestMove);
      }
    };
    analysisSf.postMessage("uci");
    analysisSf.postMessage("isready");
    return () => analysisSf.terminate();
  }, []);

  function updateStatus(g: Chess) {
    const tNow = translations[langRef.current];
    if (g.isCheckmate()) {
      if (g.turn() === "b") setTotalWins((prev) => prev + 1);
      playSound("victory");
      setGameStatus(g.turn() === "w" ? tNow.aiWins : tNow.youWin);
    } else if (g.isDraw()) {
      setGameStatus(tNow.draw);
    } else if (g.isCheck()) {
      playSound("check");
      setGameStatus(tNow.checkTurn);
    } else {
      if (gameModeRef.current === "local") {
        setGameStatus(g.turn() === "w" ? tNow.whiteTurn : tNow.blackTurn);
      } else {
        setGameStatus(g.turn() === "w" ? tNow.yourTurn : tNow.aiThinking);
      }
    }
  }

  async function analyzeMove(bestMove: string) {
    if (gameModeRef.current === "local") return;
    const tNow = translations[langRef.current];
    if (!isProRef.current) {
      if (aiUsesLeftRef.current <= 0) {
        setCurrentAnalysis(tNow.limitReached);
        setShowProModal(true);
        return;
      }
      setAiUsesLeft((prev) => Math.max(0, prev - 1));
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: gameRef.current.fen(),
          lastMove: lastPlayerMoveRef.current,
          bestMove,
          moveHistory: moveHistoryRef.current,
          lang: langRef.current,
        }),
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setCurrentAnalysis(data.analysis);
      const wasGood = data.analysis.includes("🟢") || data.analysis.includes("🟡");
      setMoveCount((prev) => {
        const newTotal = prev.total + 1;
        const newGood = wasGood ? prev.good + 1 : prev.good;
        setAccuracy(Math.round((newGood / newTotal) * 100));
        return { good: newGood, total: newTotal };
      });
    } catch {
      setCurrentAnalysis(tNow.apiError);
      if (!isProRef.current) setAiUsesLeft((prev) => Math.min(5, prev + 1));
    }
    setIsAnalyzing(false);
  }

  function requestAIMove(fen: string) {
    if (!playEngineRef.current) return;
    setIsThinking(true);
    setGameStatus(t.aiThinking);
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
    if (gameMode === "ai" && (game.turn() !== "w" || isThinking)) return false;
    try {
      const newGame = new Chess(game.fen());
      const fenBeforeMove = newGame.fen();
      const move = newGame.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      if (move === null) return false;
      const newFen = newGame.fen();
      setGame(newGame);
      setPosition(newFen);
      setMoveHistory((prev) => [...prev, move.san]);
      lastPlayerMoveRef.current = move.san;
      if (move.captured) playSound("capture"); else playSound("move");
      if (newGame.isCheckmate()) {
        setGameStatus(gameMode === "local" ? (newGame.turn() === "w" ? "🎉 Player 2 Wins!" : "🎉 Player 1 Wins!") : t.youWin);
        return true;
      }
      if (newGame.isDraw()) { setGameStatus(t.draw); return true; }
      if (gameMode === "ai") {
        setTimeout(() => requestAnalysis(fenBeforeMove), 100);
        setTimeout(() => requestAIMove(newFen), 1500);
      } else {
        setGameStatus(newGame.turn() === "w" ? t.whiteTurn : t.blackTurn);
      }
      return true;
    } catch { return false; }
  }

  function exportPGN() {
    const moves = gameRef.current.history();
    const date = new Date().toISOString().split("T")[0].replace(/-/g, ".");
    const result = gameRef.current.isCheckmate()
      ? gameRef.current.turn() === "b" ? "1-0" : "0-1"
      : gameRef.current.isDraw() ? "1/2-1/2" : "*";
    let movetext = "";
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      movetext += `${moveNum}. ${moves[i]}`;
      if (moves[i + 1]) movetext += ` ${moves[i + 1]}`;
      movetext += " ";
    }
    movetext += result;
    const fullPgn = `[Event "ChessIQ Game"]
[Site "chessiq-kappa.vercel.app"]
[Date "${date}"]
[White "Player"]
[Black "${gameMode === "ai" ? `Stockfish AI (${difficulty})` : "Player 2"}"]
[Result "${result}"]
[Accuracy "${accuracy}%"]

${movetext}
`;
    const blob = new Blob([fullPgn], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chessiq-game-${date.replace(/\./g, "-")}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyPGN() {
    navigator.clipboard.writeText(gameRef.current.pgn());
    alert(t.pgnCopied);
  }

  function startReplay() {
    if (moveHistory.length === 0) { alert(t.noReplayMoves); return; }
    setReplayIndex(0);
    setShowReplay(true);
    setPosition(new Chess().fen());
  }

  function replayNext() {
    if (replayIndex >= moveHistory.length) return;
    const tempGame = new Chess();
    for (let i = 0; i <= replayIndex; i++) { try { tempGame.move(moveHistory[i]); } catch {} }
    setPosition(tempGame.fen());
    setReplayIndex((prev) => prev + 1);
  }

  function replayPrev() {
    if (replayIndex <= 0) return;
    const newIndex = replayIndex - 1;
    const tempGame = new Chess();
    for (let i = 0; i < newIndex; i++) { try { tempGame.move(moveHistory[i]); } catch {} }
    setPosition(tempGame.fen());
    setReplayIndex(newIndex);
  }

  function exitReplay() {
    setShowReplay(false);
    setPosition(gameRef.current.fen());
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setPosition(newGame.fen());
    setMoveHistory([]);
    setGameStatus(gameMode === "local" ? t.whiteTurn : t.yourTurn);
    setIsThinking(false);
    setCurrentAnalysis("");
    setAccuracy(100);
    setMoveCount({ good: 0, total: 0 });
    if (!isPro) setAiUsesLeft(5);
  }

  function selectTheme(theme: Theme) {
    if (theme.isPro && !isPro) {
      setShowThemeModal(false);
      setShowProModal(true);
      return;
    }
    setCurrentTheme(theme);
    setShowThemeModal(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              ♟ <span className="text-orange-500">Chess</span>IQ
            </h1>
            <span className="hidden md:inline text-zinc-500 text-xs">{t.subtitle}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <div className="flex bg-zinc-800 rounded-full p-1 border border-zinc-700">
              {(["kz", "ru", "en"] as Language[]).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all ${lang === l ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"}`}>
                  {l === "kz" ? "🇰🇿 KZ" : l === "ru" ? "🇷🇺 RU" : "🇬🇧 EN"}
                </button>
              ))}
            </div>

            <div className="flex bg-zinc-800 rounded-full p-1 border border-zinc-700">
              <button onClick={() => { setGameMode("ai"); resetGame(); }} className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all ${gameMode === "ai" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"}`}>
                {t.aiMode}
              </button>
              <button onClick={() => { setGameMode("local"); resetGame(); }} className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all ${gameMode === "local" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"}`}>
                {t.twoPMode}
              </button>
            </div>

            {!isPro ? (
              <button onClick={() => setShowProModal(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg shadow-orange-600/30">{t.upgrade}</button>
            ) : (
              <div className="bg-orange-500 text-white text-xs font-semibold px-3 py-2 rounded-full">{t.proMember}</div>
            )}
            <button
              onClick={() => {
                const id = Math.random().toString(36).substring(2, 8).toUpperCase();
                window.location.href = `/room/${id}`;
              }}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg shadow-green-600/30"
            >
              {t.playFriend}
            </button>
            <button onClick={() => setShowPuzzles(true)} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg shadow-purple-600/30">{t.puzzles}</button>
            <button onClick={() => setShowLeaderboard(true)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-full">{t.leaderboard}</button>
            <button onClick={exportPGN} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-full">{t.pgn}</button>
            <button onClick={startReplay} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-full">{t.replay}</button>
            <button onClick={() => setShowThemeModal(true)} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold px-3 py-2 rounded-full">{currentTheme.emoji} {t.theme}</button>
            <button onClick={() => setShowSettings(!showSettings)} className={`text-xs font-semibold px-3 py-2 rounded-full ${showSettings ? "bg-orange-600 text-white" : "bg-zinc-700 hover:bg-zinc-600 text-white"}`}>
              ⚙️ {showSettings ? t.closeSettings : t.settings}
            </button>
          </div>
        </header>

        {showSettings && (
          <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-4 border border-zinc-700 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-white font-semibold mb-2 text-sm">{t.difficulty}</h3>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
                  <button key={level} onClick={() => setDifficulty(level)} className={`flex-1 py-2 px-2 text-xs rounded-lg font-medium ${difficulty === level ? "bg-orange-600 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}>
                    {level === "easy" ? "🟢" : level === "medium" ? "🟡" : "🔴"} {level === "easy" ? t.easy : level === "medium" ? t.medium : t.hard}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2 text-sm">{t.performance}</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{t.accuracy}</span>
                  <span className="text-orange-400 font-bold">{accuracy}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full" style={{ width: `${accuracy}%` }} />
                </div>
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>{t.goodMoves}: {moveCount.good}/{moveCount.total}</span>
                  <span>{t.totalMoves}: {moveHistory.length}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2 text-sm">{t.status}</h3>
              <p className="text-orange-400 font-semibold text-sm">{gameStatus}</p>
              <button onClick={resetGame} className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold py-2 px-3 rounded-lg">{t.newGame}</button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-3 md:p-4 border border-zinc-700 shadow-2xl">
              <Chessboard options={{
                position: position,
                onPieceDrop: ({ sourceSquare, targetSquare }) => {
                  if (!targetSquare) return false;
                  return onDrop(sourceSquare, targetSquare);
                },
                lightSquareStyle: { backgroundColor: currentTheme.lightSquare },
                darkSquareStyle: { backgroundColor: currentTheme.darkSquare },
              }} />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-zinc-800/50 backdrop-blur rounded-xl p-3 border border-zinc-700">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-orange-400 font-semibold">{gameStatus}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400">{t.acc}: <span className="text-white font-bold">{accuracy}%</span></span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400">{t.movesShort}: <span className="text-white font-bold">{moveHistory.length}</span></span>
              </div>
              <button onClick={resetGame} className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg">{t.newGame}</button>
            </div>

            {moveHistory.length > 0 && (
              <div className="mt-3 bg-zinc-800/50 backdrop-blur rounded-xl p-3 border border-zinc-700">
                <h3 className="text-white text-xs font-semibold mb-2">{t.moveHistory}</h3>
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                  {moveHistory.map((move, i) => (
                    <span key={i} className="bg-zinc-700 px-2 py-0.5 rounded text-xs text-zinc-300">
                      {Math.floor(i / 2) + 1}{i % 2 === 0 ? "." : "..."} {move}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {gameMode === "ai" ? (
              <div className="bg-gradient-to-br from-orange-900/30 to-zinc-800/50 backdrop-blur rounded-2xl p-5 border border-orange-700/30 sticky top-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧠</span>
                    <h2 className="text-white font-semibold">{t.aiCoach}</h2>
                  </div>
                  {isPro ? (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">PRO ⭐</span>
                  ) : (
                    <span className="text-xs text-zinc-500">{Math.max(0, aiUsesLeft)}{t.freeUses}</span>
                  )}
                </div>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-orange-400 mb-3">
                    <div className="animate-spin h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full"></div>
                    <span className="text-sm">{t.analyzing}</span>
                  </div>
                )}
                {currentAnalysis ? (
                  <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{currentAnalysis}</div>
                ) : (
                  <p className="text-zinc-500 text-sm italic">{t.makeMove}</p>
                )}
                <div className="mt-4 pt-3 border-t border-zinc-700/50">
                  <p className="text-xs text-zinc-500">{t.proTip}</p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-5 border border-zinc-700 sticky top-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">👥</span>
                  <h2 className="text-white font-semibold">{t.local2pTitle}</h2>
                </div>
                <div className="space-y-2 mb-4">
                  <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${game.turn() === "w" ? "bg-orange-600 shadow-lg shadow-orange-600/30" : "bg-zinc-700/50"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${game.turn() === "w" ? "bg-white text-black" : "bg-zinc-600 text-zinc-400"}`}>1</div>
                      <div>
                      <p className={`text-sm font-bold ${game.turn() === "w" ? "text-white" : "text-zinc-400"}`}>{t.player1}</p>
                      <p className={`text-xs ${game.turn() === "w" ? "text-orange-100" : "text-zinc-500"}`}>{t.white}</p>
                    </div>
                    </div>
                   {game.turn() === "w" && <span className="text-white text-xs font-bold">{t.yourTurnBadge}</span>}
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${game.turn() === "b" ? "bg-orange-600 shadow-lg shadow-orange-600/30" : "bg-zinc-700/50"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${game.turn() === "b" ? "bg-zinc-900 text-white border-2 border-white" : "bg-zinc-600 text-zinc-400"}`}>2</div>
                     <div>
                      <p className={`text-sm font-bold ${game.turn() === "b" ? "text-white" : "text-zinc-400"}`}>{t.player2}</p>
                      <p className={`text-xs ${game.turn() === "b" ? "text-orange-100" : "text-zinc-500"}`}>{t.black}</p>
                    </div>
                    </div>
                   {game.turn() === "b" && <span className="text-white text-xs font-bold">{t.yourTurnBadge}</span>}
                  </div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-3">
                  <p className="text-orange-400 text-sm font-semibold mb-1">{gameStatus}</p>
                  <p className="text-xs text-zinc-500">{t.takeTurns}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showThemeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowThemeModal(false)}>
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 max-w-md w-full border-2 border-zinc-700" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-4 text-center">{t.themeTitle}</h2>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((theme) => {
                  const isSelected = currentTheme.id === theme.id;
                  const isLocked = theme.isPro && !isPro;
                  return (
                    <button key={theme.id} onClick={() => selectTheme(theme)} className={`relative p-4 rounded-xl overflow-hidden ${isSelected ? "ring-2 ring-orange-500 shadow-lg shadow-orange-600/30" : "hover:ring-2 hover:ring-zinc-500"}`} style={{ background: `linear-gradient(135deg, ${theme.lightSquare} 50%, ${theme.darkSquare} 50%)` }}>
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="relative text-center">
                        <div className="text-3xl mb-1">{theme.emoji}</div>
                        <div className="text-sm font-semibold text-white drop-shadow">{theme.name}</div>
                        {isLocked && <div className="absolute top-0 right-0 text-sm">🔒</div>}
                        {theme.isPro && isPro && <div className="absolute top-0 right-0 text-sm">⭐</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!isPro && <p className="text-xs text-zinc-500 mt-4 text-center">{t.unlockThemes}</p>}
              <button onClick={() => setShowThemeModal(false)} className="mt-4 w-full text-zinc-400 hover:text-white text-sm py-2">{t.close}</button>
            </div>
          </div>
        )}

        {showProModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProModal(false)}>
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-8 max-w-md w-full border-2 border-orange-500" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">⭐</div>
                <h2 className="text-3xl font-bold text-white mb-2">{t.proTitle} <span className="text-orange-500">Pro</span></h2>
                <p className="text-zinc-400">{t.proSubtitle}</p>
              </div>
              <div className="space-y-3 mb-6">
                {[t.feature1, t.feature2, t.feature3, t.feature4, t.feature5].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-zinc-200">
                    <span className="text-orange-500 text-xl">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl p-4 mb-6 text-center">
                <div className="text-4xl font-bold text-white">$5<span className="text-lg text-zinc-400">{t.perMonth}</span></div>
                <p className="text-xs text-zinc-500 mt-1">{t.cancelAnytime}</p>
              </div>
              <button onClick={() => { alert(t.proDemoAlert); setIsPro(true); setAiUsesLeft(999); setShowProModal(false); }} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-orange-600/30 mb-3">{t.upgradeNow}</button>
              <button onClick={() => setShowProModal(false)} className="w-full text-zinc-400 hover:text-white text-sm py-2">{t.maybeLater}</button>
            </div>
          </div>
        )}

        {showLeaderboard && <Leaderboard myAccuracy={accuracy} myWins={totalWins} onClose={() => setShowLeaderboard(false)} />}
        {showPuzzles && <Puzzles onClose={() => setShowPuzzles(false)} />}

        {showReplay && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-gradient-to-r from-zinc-900 to-zinc-800 border-2 border-orange-500 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-white font-semibold text-sm">{t.replayMove} {replayIndex}/{moveHistory.length}</span>
              <button onClick={replayPrev} disabled={replayIndex <= 0} className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white px-3 py-1 rounded-lg text-sm">{t.prev}</button>
              <button onClick={replayNext} disabled={replayIndex >= moveHistory.length} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-30 text-white px-3 py-1 rounded-lg text-sm">{t.nextReplay}</button>
              <button onClick={copyPGN} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm">{t.copy}</button>
              <button onClick={exitReplay} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm">{t.exit}</button>
            </div>
          </div>
        )}

        <footer className="text-center mt-6 text-zinc-500 text-xs">
          <p>{t.footer}</p>
        </footer>
      </div>
    </div>
  );
}