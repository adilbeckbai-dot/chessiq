import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { fen, lastMove, bestMove, moveHistory } = await req.json();

    const prompt = `You are a chess coach for STEM students. Analyze this position briefly (max 3 sentences in Russian).

Current position (FEN): ${fen}
Player's last move: ${lastMove}
Best move according to Stockfish: ${bestMove}
Recent moves: ${moveHistory.slice(-6).join(", ")}

Format your response in Russian:
1. Rate the move: 🟢 Brilliant / 🟡 Good / 🟠 Inaccuracy / 🔴 Blunder
2. Explain briefly why (1 sentence)
3. Suggest improvement if needed (1 sentence)

Be encouraging and educational. Use a friendly tone like a mentor for engineering students.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 250,
    });

    const analysis = completion.choices[0]?.message?.content || "Анализ недоступен";

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { analysis: "⚠️ Ошибка анализа. Попробуй еще раз." },
      { status: 500 }
    );
  }
}