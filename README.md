# Ludo Party – Desi Dhamaka (V3 Offline Core)

This build upgrades the V2 starter with:
- Proper 15×15-style Ludo board layout
- Four colored home zones and 52-cell track
- Dice animation and Howler audio hooks
- Token movement rules and AI bots
- Mobile-first futuristic UI
- Offline/local coin persistence
- Mode screen and online placeholder

## Audio
Place licensed `.mp3` files in `public/sounds/`:
- dice-roll.mp3
- kill-ouch.mp3
- win-yeeha.mp3
- six-haha.mp3
- oops.mp3

The app is tolerant of missing audio files, but the ZIP does not ship copyrighted audio.

## Run
npm install
npm run dev

## Note
Online multiplayer still requires a realtime server and server-authoritative game state. This build does not pretend client-only online play is complete.
