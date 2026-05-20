# ♟ ChessIQ — AI Coach for STEM Students

> **The first chess platform built for engineering minds.** Practice tactical thinking, sharpen pattern recognition, and prepare for BigTech interviews — all guided by AI.

🌐 **Live Demo:** [chessiq-kappa.vercel.app](https://chessiq-kappa.vercel.app)
📦 **GitHub:** [adilbeckbai-dot/chessiq](https://github.com/adilbeckbai-dot/chessiq)
🎓 **Built for:** nFactorial Incubator 2026 · Technical Assignment

---

## 🎯 The Problem

Chess.com and Lichess are great — for casual players. But **STEM students preparing for technical interviews** at Google, Meta, or Yandex need more:

- 📊 **Pattern recognition** — the core skill in DSA problems
- 🧠 **Tactical reasoning** under time pressure
- 🎯 **Personalized feedback** — not just "good move / bad move"
- 🇰🇿 **Native language support** — for the Central Asian market

Existing platforms ignore this niche entirely.

## 💡 The Solution

**ChessIQ** is an AI-powered chess platform that thinks like an engineer:

- Plays you using **Stockfish** (the same engine top grandmasters analyze with)
- After every move, an **AI Coach** powered by **Llama 3.3** explains *why* it was brilliant, good, or a blunder — in your native language
- Tracks your **accuracy %** like a leetcode profile
- Solves tactical **puzzles** designed around BigTech interview patterns (forks, pins, sacrifices)
- Connects you with **other Kazakhstani students** via leaderboards and real-time multiplayer

## ✨ Features

### 🤖 AI Coach (the heart of ChessIQ)
- Powered by **Groq + Llama 3.3-70B** for sub-second analysis
- Rates every move: 🟢 Brilliant · 🟡 Good · 🟠 Inaccuracy · 🔴 Blunder
- Explains tactical reasoning in engineering language ("Think of it as a PID controller — every move should reduce instability")
- Available in **Kazakh, Russian, and English**

### ♟ Play Modes
- **vs AI** — Stockfish at 3 difficulty levels (depth 2/8/15)
- **vs Friend (online)** — share a link, play in real-time via **Supabase Realtime WebSockets**
- **Pass-and-play** — two players, one laptop, with clear Player 1 / Player 2 turn indicators

### 📊 Progress Tracking
- **Accuracy %** updated after every move
- **Game history** saved to Supabase — review all your past games
- **PGN export** — analyze games later on chess.com or Lichess
- **Game replay** — step through any past game move by move

### 🧩 Chess for Engineers
- **5 tactical puzzles** designed around interview-style patterns:
  - Fork the King and Queen
  - Back Rank Mate
  - Discovered Attack
  - Pin the Queen
  - Sacrifice for Mate
- Earn points by difficulty (Easy 10 · Medium 20 · Hard 30)

### 🇰🇿 Kazakhstan Leaderboard
- Compete with top players from Almaty, KazNU, NU, KBTU
- Filter by city or university
- Add your score after every win

### 💎 Monetization (Pro Plan)
- **Free tier:** 5 AI analyses per game, 2 board themes, all core features
- **Pro tier ($5/month):** Unlimited AI analyses, 3 exclusive themes (Ocean, Sakura, Midnight), priority feature access
- Stripe integration ready

### 🌐 Polish
- **3 languages:** Kazakh 🇰🇿 · Russian 🇷🇺 · English 🇬🇧 (full interface + AI Coach)
- **Dark/Light theme** switcher
- **Mobile responsive** — playable on any device
- **Sound effects** — move, capture, check, victory (from Lichess assets)
- **Google OAuth** via Supabase Auth — save your progress across devices

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS |
| **Chess Engine** | Stockfish.js (Web Worker) |
| **Chess Logic** | chess.js + react-chessboard |
| **AI Coach** | Groq SDK + Llama 3.3-70B-versatile |
| **Database** | Supabase (PostgreSQL) |
| **Real-time** | Supabase Realtime (WebSockets) |
| **Auth** | Supabase Auth + Google OAuth |
| **Hosting** | Vercel (auto-deploy on push) |
| **State** | React Hooks + LocalStorage |

---

## 🏗 Architecture
---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/adilbeckbai-dot/chessiq
cd chessiq

# Install
npm install

# Set up environment
cp .env.example .env.local
# Then add your keys:
#   GROQ_API_KEY=...
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🗺 Roadmap

### Phase 1 — MVP ✅ (Shipped)
- ✅ AI gameplay with 3 difficulty levels
- ✅ AI Coach with Llama 3.3
- ✅ Online multiplayer with friends
- ✅ Tactical puzzles
- ✅ Multilingual UI (KZ/RU/EN)
- ✅ Google OAuth
- ✅ Game history
- ✅ Pro freemium model

### Phase 2 — Q3 2026
- ⏳ **Tournament mode** with brackets
- ⏳ **Coach community** — top players share annotated lessons
- ⏳ **20+ puzzle categories** (endgames, openings, sacrifices)
- ⏳ **Real-time chat** in multiplayer rooms
- ⏳ **ELO rating system**

### Phase 3 — Q4 2026
- 📱 **Native iOS / Android apps**
- 💳 **Live Stripe billing**
- 🎓 **B2B partnerships** with KazNU, NU, KBTU — chess as part of CS curriculum
- 🏆 **University leagues** across Kazakhstan

### Vision
> Become the **#1 AI-powered chess platform for STEM students** across Central Asia and the CIS.

---

## 📈 Why This Wins

| Standard chess sites | **ChessIQ** |
|---------------------|-------------|
| Generic feedback | **AI Coach explains like an engineer** |
| English only | **Native Kazakh + Russian** |
| Global leaderboards | **Local Kazakhstan focus** |
| Random puzzles | **BigTech interview prep niche** |
| Pay $14.99/month | **Affordable $5/month for students** |

---

## 👤 About the Author

**Әділ Ақжол (Akzhol Adil)**, 3rd-year student at **al-Farabi Kazakh National University**, Industrial Electronics & Control Systems.

- 🎓 Stanford Machine Learning Certificate (Andrew Ng)
- 📄 Published "*Limitations of Derivative Path in Neuromorphic PID Controllers and Adaptive Solutions*" — Eurasian Science Review (2025), proposing the **IWTA algorithm**
- 🥉 3rd place, Farabi Alemi International Conference 2025
- 🔬 Lab assistant at KazNU researching silicon nanocrystals
- 📧 [adilbeckbai@gmail.com](mailto:adilbeckbai@gmail.com)
- 💼 [github.com/adilbeckbai-dot](https://github.com/adilbeckbai-dot)

---

## 🙏 Built With

- [Stockfish](https://stockfishchess.org/) — the strongest open-source chess engine
- [chess.js](https://github.com/jhlywa/chess.js) — chess logic
- [react-chessboard](https://github.com/Clariity/react-chessboard) — board UI
- [Groq](https://groq.com/) — blazingly fast LLM inference
- [Supabase](https://supabase.com/) — backend infrastructure
- [Vercel](https://vercel.com/) — hosting

Sounds courtesy of [Lichess](https://lichess.org/) (open-source).

---

## 📄 License

MIT © 2026 Akzhol Adil

---

<p align="center">
  <i>Built in 24 hours for nFactorial Incubator 2026.</i><br>
  <i>From a village in Sarыözek to global STEM education. 🇰🇿</i>
</p>