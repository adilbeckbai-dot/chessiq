"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { supabase, Room } from "../../lib/supabase";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [status, setStatus] = useState("Loading...");
  const gameRef = useRef(game);

  useEffect(() => { gameRef.current = game; }, [game]);

  // Бөлмеге қосылу
  useEffect(() => {
    if (!nameSet) return;

    async function joinRoom() {
      let { data: existing } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (!existing) {
        const { data: created } = await supabase
          .from("rooms")
          .insert({ id: roomId, white_player: playerName })
          .select()
          .single();
        existing = created;
        setPlayerColor("white");
        setStatus("⏳ Waiting for opponent...");
      } else {
        if (existing.white_player === playerName) {
          setPlayerColor("white");
        } else if (existing.black_player === playerName) {
          setPlayerColor("black");
        } else if (!existing.black_player) {
          await supabase
            .from("rooms")
            .update({ black_player: playerName, status: "playing" })
            .eq("id", roomId);
          setPlayerColor("black");
        } else {
          setStatus("👀 Spectator mode");
        }
      }

      if (existing) {
        setRoom(existing);
        const newGame = new Chess(existing.fen);
        setGame(newGame);
        setPosition(existing.fen);
        if (existing.status === "playing") setStatus("🎮 Game in progress!");
      }
    }

    joinRoom();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.fen !== gameRef.current.fen()) {
            const newGame = new Chess(updated.fen);
            setGame(newGame);
            setPosition(updated.fen);
          }
          if (updated.status === "playing" && updated.black_player) {
            setStatus("🎮 Game in progress!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, nameSet, playerName]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (!playerColor || !room) return false;

    const myTurn =
      (playerColor === "white" && game.turn() === "w") ||
      (playerColor === "black" && game.turn() === "b");
    if (!myTurn) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      if (move === null) return false;

      const newFen = game.fen();
      setPosition(newFen);

      supabase
        .from("rooms")
        .update({
          fen: newFen,
          moves: [...(room.moves || []), move.san],
        })
        .eq("id", roomId)
        .then(() => {});

      return true;
    } catch {
      return false;
    }
  }

  function copyLink() {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    alert("📋 Link copied! Send it to your friend.");
  }

  if (!nameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-8 flex items-center justify-center">
        <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-8 max-w-md w-full border border-zinc-700">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">
            ♟ <span className="text-orange-500">Multiplayer</span>
          </h1>
          <p className="text-zinc-400 mb-4 text-center">Enter your name to join the game</p>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-zinc-700 text-white px-4 py-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={() => playerName.trim() && setNameSet(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg"
          >
            Join Room {roomId}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-wrap items-center justify-between mb-4 gap-3">
          <h1 className="text-3xl font-bold text-white">
            ♟ <span className="text-orange-500">Chess</span>IQ Multiplayer
          </h1>
          <div className="flex items-center gap-2">
            <span className="bg-zinc-800 text-orange-400 text-sm font-mono px-3 py-1 rounded-full">
              Room: {roomId}
            </span>
            <button
              onClick={copyLink}
              className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-3 py-1.5 rounded-full"
            >
              📋 Copy Link
            </button>
            
              <a href="/"
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full"
            >
              ← Main
            </a>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-4 border border-zinc-700">
              <Chessboard
                options={{
                  position: position,
                  boardOrientation: playerColor === "black" ? "black" : "white",
                  onPieceDrop: ({ sourceSquare, targetSquare }) => {
                    if (!targetSquare) return false;
                    return onDrop(sourceSquare, targetSquare);
                  },
                }}
              />
            </div>
          </div>

          <div className="md:col-span-1 space-y-4">
            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-4 border border-zinc-700">
              <h3 className="text-white font-semibold mb-3">📊 Status</h3>
              <p className="text-orange-400 font-semibold text-sm mb-3">{status}</p>
              {playerColor && (
                <p className="text-zinc-300 text-sm">
                  You are: <span className="font-bold text-white">{playerColor === "white" ? "♔ White" : "♚ Black"}</span>
                </p>
              )}
            </div>

            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-4 border border-zinc-700">
              <h3 className="text-white font-semibold mb-3">👥 Players</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-300">
                  <span>♔ White:</span>
                  <span className="text-white font-bold">{room?.white_player || "—"}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>♚ Black:</span>
                  <span className="text-white font-bold">{room?.black_player || "Waiting..."}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 backdrop-blur rounded-2xl p-4 border border-zinc-700">
              <h3 className="text-white font-semibold mb-2 text-sm">📜 Moves</h3>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {(room?.moves || []).map((m, i) => (
                  <span key={i} className="bg-zinc-700 px-2 py-0.5 rounded text-xs text-zinc-300">
                    {Math.floor(i / 2) + 1}{i % 2 === 0 ? "." : "..."} {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}