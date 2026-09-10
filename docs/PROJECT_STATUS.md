# Guess The Frame — Project Status Index

## Project identity
- Current version: V2 (Online Multiplayer Integrated)
- Current phase: V2 Testing / Polish
- Last verified date: 2026-09-10

## Architecture
- Frontend: React 19, Vite, Zustand, Tailwind CSS (via inline styles or custom CSS), Framer Motion
- Backend: Node.js, Express, Socket.IO (Server-authoritative)
- State management: Zustand (gameStore.ts for local, onlineGameStore.ts for multiplayer)
- Storage: localStorage for Admin custom questions and Playing Sequence
- Multiplayer transport: Socket.IO events (room_state_update, game_action, etc.)
- Deployment target: Free-tier capable (Node + static frontend)

## Current game roster
1. Hollywood
2. Indian Movies
3. Distorted Frame
4. Guess The Eyes
5. Guess The Dialogues
6. Guess Release Year
7. Bollywood In English
8. Hollywood In Hindi
9. This and That (Poster Duels)

## Question types
- `frame`: Show an image, guess the movie.
- `eye`: Show a cropped eye, guess the actor/character.
- `dialogue`: Show text dialogue, guess the movie.

## Playing Sequence
- Supported locally via `PlayingSequencePage.tsx`.
- V2: Sent to the server as part of `SessionSnapshot.ts` when starting an online game.

## Admin Panel
- Accessible and persists via localStorage.
- Supports JSON Import/Export.
- Verified: Overrides hardcoded questions properly (Requires correct JSON schemas, e.g., `type: 'eye'` for Level 4).

## Multiplayer status

| Subsystem | Status | Notes |
|---|---|---|
| Server | VERIFIED | Express + Socket.io running. |
| Socket connection | VERIFIED | Handles player IDs properly. |
| Rooms | VERIFIED | RoomManager handles join/create. |
| Lobby | VERIFIED | OnlineLobbyPage implemented. |
| Ready | VERIFIED | Syncs across clients. |
| Host migration | IMPLEMENTED | Logic in GameRoom.ts. |
| Reconnection | IMPLEMENTED | via player IDs in join_server. |
| Session snapshot | VERIFIED | SessionSnapshot.ts captures games and questions. |
| Images | IMPLEMENTED | Base64 transmitted securely to players. |
| Timer | VERIFIED | Server-controlled (ONLINE_ROUND_DURATION_MS). |
| Guessing | VERIFIED | Implemented with guess cooldown. |
| Matching | VERIFIED | AnswerMatcher implements fuzzy matching and aliases. |
| Scoring | VERIFIED | Speed and streak bonuses included. |
| Streak | VERIFIED | Resets on wrong guess, tracks longest streak. |
| Reveal | VERIFIED | First correct gives 5s window. |
| Results | VERIFIED | Final results calculate ranks and awards. |

## User-Made / Unconfirmed Changes
- The user has prepared a set of custom images for `Level 4: Guess The Eyes` in `E:\Guess they frame\IMAGES for games\eyes\`.
- A custom JSON export was made, which was updated to include base64 images properly since the original export missed Level 4.
- Multiple project reference prompts have been uploaded to `E:\Guess they frame\user-uploaded-data\`.

## Known bugs / Risks
- Custom image uploads through the Admin Panel JSON must strictly match the `QuestionType` of the level (e.g., Level 4 must have `type: 'eye'` and `imageData`), otherwise it falls back to the default hardcoded data or breaks the UI.

## Recommended Next Step
- User tests the newly imported custom JSON for Guess The Eyes in the Admin Panel and runs a test match in Online Mode to verify the entire V2 multiplayer flow with custom questions.
