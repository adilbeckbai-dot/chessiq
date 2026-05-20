import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Room = {
  id: string;
  fen: string;
  moves: string[];
  white_player: string | null;
  black_player: string | null;
  status: "waiting" | "playing" | "finished";
};
export type Game = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  opponent: string;
  difficulty: string | null;
  result: string;
  moves: string[];
  accuracy: number;
  total_moves: number;
  pgn: string | null;
  created_at: string;
};