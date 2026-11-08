/* G Chess classic-game controller. Rules and legal moves are provided by chess.js. */
(() => {
  'use strict';
  if (typeof window.Chess !== 'function') {
    console.error('G Chess requires chess.js. Check the network connection and reload the page.');
    window.gChessEngineReady = false;
    return;
  }
  window.gChessEngineReady = true;
})();
