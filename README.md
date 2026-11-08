# G CHESS

G CHESS is a mobile-friendly premium chess web app designed for GitHub Pages deployment. It includes a playable classic chess board, AI difficulty levels, profile and economy screens, missions, shop, rewards, settings, and offline support.

## Features

- Classic chess gameplay with legal move validation via chess.js
- Human-vs-AI and local multiplayer modes
- Adjustable AI difficulty levels
- Premium black-and-gold UI with multiple themes
- Responsive board and mobile-first layout
- Stars economy, shop, missions, daily rewards, and mystery boxes
- Firebase-ready setup with config guard and security rule examples
- Offline support via service worker

## Run locally

Because this project is static HTML/CSS/JS, the simplest local launch is:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## GitHub Pages

Push this repository to GitHub and enable Pages from the default branch root folder.

## Firebase note

The frontend includes Firebase hooks but will only activate when a valid Firebase configuration is supplied in `js/firebase.js`. This avoids hardcoding secrets in frontend files.

## Project structure

```text
/index.html
/css/style.css
/js/app.js
/js/chess-engine.js
/js/firebase.js
/firebase/firestore.rules
/manifest.json
/service-worker.js
/README.md
```
