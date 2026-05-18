import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const LANG_PROMPTS = {
  kz: {
    system: "You are a chess coach for STEM students. Respond in Kazakh language.",
    format: `Format your response in Kazakh (қазақша):
1. Жүрісті бағала: 🟢 Тамаша / 🟡 Жақсы / 🟠 Дәл емес / 🔴 Қате
2. Неге екенін қысқа түсіндір (1 сөйлем)
3. Қажет болса жақсарту ұсын (1 сөйлем)

Дос ретінде, инженер стилінде сөйле.`,
  },
  ru: {
    system: "You are a chess coach for STEM students. Respond in Russian.",
    format: `Format your response in Russian:
1. Rate the move: 🟢 Brilliant / 🟡 Good / 🟠 Inaccuracy / 🔴 Blunder
2. Explain briefly why (1 sentence)
3. Suggest improvement if needed (1 sentence)

Be friendly, like a mentor for engineering students.`,
  },
  en: {
    system: "You are a chess coach for STEM students. Respond in English.",
    format: `Format your response:
1. Rate the move: 🟢 Brilliant / 🟡 Good / 🟠 Inaccuracy / 🔴 Blunder
2. Explain briefly why (1 sentence)
3. Suggest improvement if needed (1 sentence)

Be friendly, like a mentor for engineering students.`,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { fen, lastMove, bestMove, moveHistory, lang = "ru" } = await req.json();
    const langConfig = LANG_PROMPTS[lang as keyof typeof LANG_PROMPTS] || LANG_PROMPTS.ru;

    const prompt = `${langConfig.system}

Analyze this chess position briefly (max 3 sentences).

Current position (FEN): ${fen}
Player's last move: ${lastMove}
Best move according to Stockfish: ${bestMove}
Recent moves: ${moveHistory.slice(-6).join(", ")}

${langConfig.format}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 250,
    });

    const analysis = completion.choices[0]?.message?.content || "Analysis unavailable";

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { analysis: "⚠️ Analysis error. Try again." },
      { status: 500 }
    );
  }
}