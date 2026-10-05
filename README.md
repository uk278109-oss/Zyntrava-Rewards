# Ludo Party – Desi Dhamaka

Compact Next.js offline-first Ludo project.

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Optional sounds
Put these files in `public/sounds/`:
- dice-roll.mp3
- kill-ouch.mp3
- win-yeeha.mp3
- six-haha.mp3
- oops.mp3

The game will still run if sounds are missing.

## Notes
- No backend or API is required for the current game.
- Progress is stored in browser localStorage.
- Premium is represented as a local demo toggle only; real payments/verification require a later integration.
- The board is a compact visual implementation intended as the foundation for expanding full Ludo path visuals and additional modes.
