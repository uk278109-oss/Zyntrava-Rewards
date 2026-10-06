# Ludo Party – V6 Fixed

Fixes in this build:
- A 6 now automatically launches the first home token onto the starting square.
- Once a token is on the path, normal dice values let the player click/move it.
- Home token deadlock removed.
- Added install button using the browser's PWA install prompt when supported.
- Added `manifest.webmanifest`, service worker and 192/512 PWA icons.
- Existing loading screen, BGM and SFX remain included.

Important: PWA install prompt requires HTTPS (Vercel is fine) and a supported browser. If the browser does not expose the install prompt, the button gives the platform's manual install instructions.
