# Guess the Frame 🎬

> A polished movie quiz game — play locally in the same room, or online with friends!

## What is it?

**Guess the Frame** is a multiplayer quiz game where players guess movies from frames, eyes, and dialogues. It supports two main modes:

1. **Local Party Mode**: A couch co-op style game where a human "Judge" controls all scoring and progression.
2. **Online Multiplayer (New!)**: A real-time, Scribble.io-style online game where up to 10 players type their guesses, and a Node.js server automatically fuzzy-matches answers and handles scoring.

---

## Features

### Online Multiplayer (Node.js + Socket.IO)
- **Real-Time Synchronized Gameplay**: All players see the timer and image reveal simultaneously.
- **Fuzzy Matching**: Server-side Levenshtein distance matching forgives minor typos (e.g., "The Dark Knight" vs "Dark Knight").
- **Speed Bonus**: Players who answer faster get more points.
- **5-Second Continuation**: Once the first player guesses correctly, a 5-second countdown begins for remaining players.
- **Live Activity Feed**: See others' wrong guesses and "near miss" indicators in real time.
- **Custom Game Uploads**: The host can create completely custom games using the built-in Admin Panel, which sync seamlessly to the server for online play.

### Local Party Mode (Offline)
- **Judge System**: One player acts as the Judge per round, managing points and answers manually.
- **Fair Rotation**: The Judge rotates automatically so everyone gets a turn.
- **Undo System**: Built-in undo history in case the Judge makes a mistake.

### Admin Panel
- Access via the gear icon on the main menu.
- Upload your own images, answers, aliases, and hints.
- Export/Import entire game sets as JSON files.

---

## Levels

| # | Level | Task |
|---|---|---|
| 1 | 🎬 Bollywood Frames | Guess the Bollywood movie from a movie frame |
| 2 | 🎬 Hollywood Frames | Guess the Hollywood movie from a movie frame |
| 3 | 👁️ Guess the Eye | Guess the celebrity from a cropped eye image |
| 4 | 💬 Guess the Dialogue | Guess the movie from a famous dialogue |

---

## Running Locally

### 1. Start the Backend (Online Mode Server)
```bash
cd backend
npm install
npm run dev
```
The Socket.IO server will start on `http://localhost:3001`.

### 2. Start the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
guess-the-frame/
├── frontend/               ← React + Vite + TypeScript (Zustand state)
│   ├── public/assets/      ← Default images
│   ├── src/components/     ← Reusable UI
│   ├── src/pages/          ← Offline & Online screens
│   ├── src/store/          ← gameStore (offline) & onlineGameStore
│   └── src/utils/          ← LocalStorage persistence, Question Admin
│
└── backend/                ← Node.js + Socket.IO server
    ├── src/gameEngine/     ← Authoritative game logic
    │   ├── AnswerMatcher.ts  ← Levenshtein distance & fuzzy matching
    │   ├── RoundEngine.ts    ← Timers, scoring, state machine
    │   ├── SessionSnapshot.ts← Host custom payload deduplication
    │   └── GameRoom.ts       ← Room management
    └── src/server.ts       ← Socket entrypoint
```

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Zustand, Vanilla CSS (Glassmorphism)
- **Backend**: Node.js, Express, Socket.IO
- **Deployment**: Designed to run cleanly on free-tier services (Render, Railway). Gracefully handles server sleep/restarts via stateless recovery.
