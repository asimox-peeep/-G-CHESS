# G CHESS

G Chess is a responsive, GitHub Pages-compatible chess web app. The current release focuses on a playable classic chess game against a local AI or a second local player. The game uses chess.js for legal move generation and standard rules (including castling, en passant, promotion, check, and draw/checkmate detection).

## Run locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>. The rules library is currently loaded from a public CDN, so the first page load requires internet access. Once the app assets and library have been loaded, browser caching may support repeat offline use; a complete offline engine bundle is not included yet.

## Deploy to GitHub Pages

In repository Settings → Pages, select the `main` branch and `/ (root)` as the publishing source. The site entry point is `index.html`.

## Current scope

Implemented: classic chess, legal move highlighting, move history, player color selection, local two-player, adjustable heuristic AI, undo, hint, resignation, board orientation, light/dark theme, and device-local game statistics.

Not yet implemented: chess variants, Stockfish analysis, Firebase authentication/cloud sync, secure server-side economy, shop, missions/rewards, leaderboards, and seasonal events. The navigation labels for those areas currently explain their status; they do not simulate backend functionality or award Stars. Firebase remains inactive until a real project is configured.

## Firebase security

Never put Firebase Admin credentials in frontend files. Configure client Firebase settings only for public client initialization, deploy Cloud Functions for sensitive operations, and use restrictive Firestore rules before enabling accounts or economy features.
