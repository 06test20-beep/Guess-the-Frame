# Guess the Frame

> A polished offline PC-based movie quiz game — play in the same room!

## What is it?

**Guess the Frame** is a local multiplayer quiz game where players guess movies from frames, eyes, and dialogues. A human judge controls all scoring — no internet, no server required.

## Levels

| # | Level | Task |
|---|---|---|
| 1 | 🎬 Bollywood Frames | Guess the Bollywood movie from a movie frame |
| 2 | 🎬 Hollywood Frames | Guess the Hollywood movie from a movie frame |
| 3 | 👁️ Guess the Eye | Guess the celebrity from a cropped eye image |
| 4 | 💬 Guess the Dialogue | Guess the movie from a famous dialogue |

**40 questions total — 10 per level.**

## Scoring

| Event | Points |
|---|---|
| Contestant correct answer | **+10** |
| Contestant wrong answer | **−5** |
| Judge correct after timeout | **+20** |
| Judge wrong | **0** (no penalty) |

## Judge System

- One player is randomly selected as judge per level
- Judge rotates fairly — no player repeats until everyone has judged
- Judge controls: scoring, answer reveal, round progression
- The app never auto-detects who answered first

## Running Locally

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
guess-the-frame/
├── frontend/               ← React + Vite + TypeScript
│   ├── public/assets/
│   │   └── levels/
│   │       ├── level-1-bollywood/   ← Drop q01.jpg … q10.jpg here
│   │       ├── level-2-hollywood/   ← Drop q01.jpg … q10.jpg here
│   │       ├── level-3-eyes/        ← Drop q01.jpg … q10.jpg here
│   │       └── level-4-dialogues/   ← No images needed
│   └── src/
│       ├── components/   ← Reusable UI components
│       ├── pages/        ← Screen-level components
│       ├── store/        ← Zustand game state
│       ├── data/         ← Questions + avatars
│       ├── types/        ← TypeScript interfaces
│       ├── utils/        ← Judge rotation logic
│       └── constants/    ← Scoring values, level metadata
├── backend/               ← Future backend skeleton
└── docs/                  ← Technical documentation
```

## Adding Your Images

1. Put your movie frame images in `frontend/public/assets/levels/level-1-bollywood/`
2. Name them `q01.jpg`, `q02.jpg` … `q10.jpg`
3. Update the `answer` field in `frontend/src/data/questions.ts`
4. Repeat for other levels

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **State**: Zustand
- **Styling**: Vanilla CSS with design tokens
- **Offline**: 100% — no server needed for V1

## Future Expansion

- Dynamic question database
- Admin panel to manage questions
- Online multiplayer
- Randomized questions
- More levels and categories
- User accounts + leaderboards
