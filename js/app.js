(() => {
  'use strict';

  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const STORAGE_KEY = 'gchess-classic-v1';
  const VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20000 };
  const state = {
    chess: new Chess(),
    selected: null,
    legal: [],
    orientation: 'white',
    mode: 'ai',
    playerColor: 'w',
    difficulty: 5,
    gameOver: false,
    history: [],
    stats: { games: 0, wins: 0, losses: 0, draws: 0 }
  };
  const $ = (id) => document.getElementById(id);

  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.stats) state.stats = { ...state.stats, ...saved.stats };
      if (saved.theme === 'light') document.body.classList.add('light');
    } catch (error) { console.warn('Could not load local stats.', error); }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: state.stats, theme: document.body.classList.contains('light') ? 'light' : 'dark' }));
    } catch (error) { console.warn('Could not save local stats.', error); }
  }

  function renderBoard() {
    const boardEl = $('chess-board');
    if (!boardEl) return;
    boardEl.replaceChildren();
    const board = state.chess.board();
    const rows = state.orientation === 'black' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
    const cols = state.orientation === 'black' ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
    const icons = { w: { p:'♙', r:'♖', n:'♘', b:'♗', q:'♕', k:'♔' }, b: { p:'♟', r:'♜', n:'♞', b:'♝', q:'♛', k:'♚' } };
    rows.forEach((row, ri) => cols.forEach((file, ci) => {
      const square = `${String.fromCharCode(97 + file)}${8 - row}`;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `square ${(ri + ci) % 2 ? 'dark' : 'light'}`;
      cell.dataset.square = square;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${square}${board[row][file] ? ` ${board[row][file].color === 'w' ? 'white' : 'black'} ${board[row][file].type}` : ''}`);
      if (state.selected === square) cell.classList.add('selected');
      const targetMove = state.legal.find((move) => move.to === square);
      if (targetMove) cell.classList.add(state.chess.get(square) ? 'capture' : 'legal');
      if (state.history.length) {
        const last = state.history[state.history.length - 1];
        if (last.from === square || last.to === square) cell.classList.add('last-move');
      }
      if (board[row][file]) {
        const piece = document.createElement('span');
        piece.className = `piece ${board[row][file].color === 'w' ? 'white-piece' : 'black-piece'}`;
        piece.textContent = icons[board[row][file].color][board[row][file].type];
        cell.append(piece);
      }
      if ((state.orientation === 'white' && ri === 7) || (state.orientation === 'black' && ri === 7)) {
        const coord = document.createElement('span'); coord.className = 'coord file'; coord.textContent = String.fromCharCode(97 + file); cell.append(coord);
      }
      if (ci === 0) { const coord = document.createElement('span'); coord.className = 'coord rank'; coord.textContent = String(8 - row); cell.append(coord); }
      cell.addEventListener('click', () => onSquare(square));
      boardEl.append(cell);
    }));
    updateStatus();
    renderMoves();
  }

  function updateStatus() {
    const status = $('statusLabel');
    const message = $('gameMessage');
    const turn = state.chess.turn() === 'w' ? 'White' : 'Black';
    let text = `${turn} to move`;
    if (state.chess.in_checkmate()) text = `Checkmate — ${turn === 'White' ? 'Black' : 'White'} wins`;
    else if (state.chess.in_draw()) text = 'Draw';
    else if (state.chess.in_check()) text += ' · Check';
    if (status) status.textContent = text;
    if (message && !state.gameOver) message.textContent = state.chess.in_check() ? `${turn} is in check.` : 'Select a piece to see its legal moves.';
    if (state.chess.game_over() && !state.gameOver) finishGame();
  }

  function renderMoves() {
    const holder = $('moveHistory');
    if (!holder) return;
    if (!state.history.length) { holder.innerHTML = '<span class="small-muted">No moves yet</span>'; return; }
    holder.replaceChildren();
    state.history.forEach((move, index) => {
      if (index % 2 === 0) { const number = document.createElement('span'); number.className = 'move-number'; number.textContent = `${Math.floor(index / 2) + 1}.`; holder.append(number); }
      const pill = document.createElement('span'); pill.className = 'move-pill'; pill.textContent = move.san; holder.append(pill);
    });
    holder.scrollTop = holder.scrollHeight;
  }

  function isHumanTurn() { return state.mode === 'local' || state.chess.turn() === state.playerColor; }

  function onSquare(square) {
    if (state.gameOver || !isHumanTurn()) return;
    const piece = state.chess.get(square);
    if (state.selected && state.legal.some((move) => move.to === square)) {
      makeMove(state.selected, square);
      return;
    }
    if (piece && piece.color === state.chess.turn()) {
      state.selected = square;
      state.legal = state.chess.moves({ square, verbose: true });
    } else { state.selected = null; state.legal = []; }
    renderBoard();
  }

  function makeMove(from, to, promotion = 'q') {
    let move;
    try { move = state.chess.move({ from, to, promotion }); } catch (_) { move = null; }
    if (!move) return false;
    state.history.push(move);
    state.selected = null;
    state.legal = [];
    renderBoard();
    if (!state.chess.game_over() && state.mode === 'ai' && state.chess.turn() !== state.playerColor) {
      setTimeout(makeAiMove, 120);
    }
    return true;
  }

  function evaluate(chess) {
    if (chess.in_checkmate()) return chess.turn() === 'w' ? -100000 : 100000;
    if (chess.in_draw()) return 0;
    let score = 0;
    chess.board().forEach((row, r) => row.forEach((piece, f) => {
      if (!piece) return;
      const sign = piece.color === 'w' ? 1 : -1;
      const centerBonus = piece.type === 'k' ? 0 : (3.5 - (Math.abs(3.5 - r) + Math.abs(3.5 - f)) / 2) * 4;
      score += sign * (VALUES[piece.type] + centerBonus);
    }));
    return score;
  }

  function search(chess, depth, alpha, beta, maximizingWhite) {
    if (depth === 0 || chess.game_over()) return evaluate(chess);
    const moves = chess.moves({ verbose: true });
    if (maximizingWhite) {
      let best = -Infinity;
      for (const move of moves) {
        const next = new Chess(chess.fen()); next.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
        best = Math.max(best, search(next, depth - 1, alpha, beta, false)); alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = Infinity;
    for (const move of moves) {
      const next = new Chess(chess.fen()); next.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      best = Math.min(best, search(next, depth - 1, alpha, beta, true)); beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  function makeAiMove() {
    if (state.gameOver || state.chess.game_over()) return;
    const moves = state.chess.moves({ verbose: true });
    if (!moves.length) return;
    const level = Number(state.difficulty);
    const depth = level >= 8 ? 2 : 1;
    const candidates = moves.map((move) => {
      const next = new Chess(state.chess.fen()); next.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      let score = search(next, depth - 1, -Infinity, Infinity, next.turn() === 'w');
      if (state.chess.turn() === 'b') score = -score;
      if (level < 6) score += (Math.random() - 0.5) * (7 - level) * 90;
      return { move, score };
    }).sort((a, b) => b.score - a.score);
    const shortlist = candidates.slice(0, Math.max(1, 11 - level));
    const choice = shortlist[Math.floor(Math.random() * shortlist.length)].move;
    makeMove(choice.from, choice.to, choice.promotion || 'q');
  }

  function finishGame() {
    state.gameOver = true;
    state.stats.games += 1;
    const result = state.chess.in_draw() ? 'draw' : (state.chess.turn() === state.playerColor ? 'loss' : 'win');
    if (state.mode === 'local') {
      if (result === 'draw') state.stats.draws += 1;
    } else if (result === 'win') state.stats.wins += 1;
    else if (result === 'loss') state.stats.losses += 1;
    else state.stats.draws += 1;
    save(); renderStats();
    const message = $('gameMessage');
    if (message) message.textContent = result === 'draw' ? 'Game drawn.' : result === 'win' ? 'You won!' : 'Game over.';
  }

  function newGame() {
    state.chess = new Chess(START_FEN); state.selected = null; state.legal = []; state.gameOver = false; state.history = [];
    if (state.mode === 'ai' && state.playerColor === 'b') setTimeout(makeAiMove, 180);
    renderBoard(); updatePlayerLabels();
  }

  function updatePlayerLabels() {
    const white = state.mode === 'local' ? 'White' : (state.playerColor === 'w' ? 'You' : 'Computer');
    const black = state.mode === 'local' ? 'Black' : (state.playerColor === 'b' ? 'You' : 'Computer');
    const bottomIsWhite = state.orientation === 'white';
    $('topPlayerLabel').textContent = bottomIsWhite ? black : white;
    $('bottomPlayerLabel').textContent = bottomIsWhite ? white : black;
    $('topClockLabel').textContent = bottomIsWhite ? 'Black' : 'White';
    $('bottomClockLabel').textContent = bottomIsWhite ? 'White' : 'Black';
  }

  function renderStats() {
    const stats = $('heroStats');
    if (stats) stats.innerHTML = `<div class="metric"><span class="small-muted">Games</span><strong>${state.stats.games}</strong></div><div class="metric"><span class="small-muted">Wins</span><strong>${state.stats.wins}</strong></div><div class="metric"><span class="small-muted">Losses</span><strong>${state.stats.losses}</strong></div><div class="metric"><span class="small-muted">Draws</span><strong>${state.stats.draws}</strong></div>`;
    const profile = $('profileCard');
    if (profile) profile.innerHTML = `<p>Games: ${state.stats.games} · Wins: ${state.stats.wins} · Losses: ${state.stats.losses} · Draws: ${state.stats.draws}</p>`;
  }

  function setSection(name) {
    document.querySelectorAll('.section').forEach((section) => section.classList.toggle('active', section.id === name));
    document.querySelectorAll('.tab-btn').forEach((button) => button.classList.toggle('active', button.dataset.section === name));
  }

  function initialize() {
    loadSaved();
    const nav = $('navTabs');
    ['home','play','challenges','shop','collection','missions','leaderboard','profile','settings'].forEach((name) => {
      const button = document.createElement('button'); button.className = 'tab-btn'; button.dataset.section = name; button.textContent = name[0].toUpperCase() + name.slice(1);
      button.addEventListener('click', () => setSection(name)); nav.append(button);
    });
    document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => { setSection(button.dataset.go); if (button.dataset.newGame) newGame(); }));
    $('restartBtn').addEventListener('click', newGame);
    $('modeSelect').addEventListener('change', (event) => { state.mode = event.target.value; newGame(); });
    $('colorSelect').addEventListener('change', (event) => { state.playerColor = event.target.value === 'black' ? 'b' : 'w'; newGame(); });
    $('difficultySelect').addEventListener('change', (event) => { state.difficulty = Number(event.target.value); });
    $('orientationSelect').addEventListener('change', (event) => { state.orientation = event.target.value; updatePlayerLabels(); renderBoard(); });
    $('themeSelect').addEventListener('change', (event) => { document.body.classList.toggle('light', event.target.value === 'light'); save(); });
    $('undoBtn').addEventListener('click', () => {
      if (!state.history.length || state.gameOver) return;
      state.chess.undo(); state.history.pop();
      if (state.mode === 'ai' && state.history.length) { state.chess.undo(); state.history.pop(); }
      state.selected = null; state.legal = []; renderBoard();
    });
    $('hintBtn').addEventListener('click', () => {
      if (state.gameOver || !isHumanTurn()) return;
      const moves = state.chess.moves({ verbose: true });
      if (!moves.length) return;
      const move = moves[Math.floor(Math.random() * moves.length)];
      state.selected = move.from; state.legal = state.chess.moves({ square: move.from, verbose: true }); renderBoard();
      $('gameMessage').textContent = `Hint: consider moving from ${move.from} to ${move.to}.`;
    });
    $('resignBtn').addEventListener('click', () => {
      if (state.gameOver) return;
      if (!window.confirm('Resign this game?')) return;
      state.gameOver = true; state.stats.games += 1;
      if (state.mode === 'ai') state.stats.losses += 1;
      save(); renderStats(); $('gameMessage').textContent = 'You resigned. Start a new game to play again.';
    });
    renderStats(); updatePlayerLabels(); renderBoard();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('Offline support unavailable.', error));
  }

  window.addEventListener('DOMContentLoaded', initialize);
})();
