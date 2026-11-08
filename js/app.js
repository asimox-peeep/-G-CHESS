const appState = {
  player: {
    username: 'Commander',
    profilePicture: 'C',
    stars: 420,
    elo: 1285,
    level: 12,
    wins: 18,
    losses: 12,
    draws: 4,
    winStreak: 2,
    achievements: [],
    inventory: { skins: ['classic'], boards: ['classic'], backgrounds: ['night'], music: [] },
    settings: { language: 'en', theme: 'dark', volume: 70, sfxVolume: 65, boardOrientation: 'white', animations: true }
  },
  ui: {
    activeSection: 'home',
    selectedTab: 'home',
    difficulty: 5,
    mode: 'classic',
    playerColor: 'w',
    aiEnabled: true,
    localMultiplayer: false,
    orientation: 'white',
    stockfishReady: false,
    missionSelected: null
  },
  shop: [
    { id: 'golden', category: 'skins', name: 'Golden', price: 150, kind: 'skin' },
    { id: 'diamond', category: 'skins', name: 'Diamond', price: 220, kind: 'skin' },
    { id: 'royal-board', category: 'boards', name: 'Black and Gold', price: 170, kind: 'board' },
    { id: 'space-board', category: 'boards', name: 'Space', price: 210, kind: 'board' },
    { id: 'galaxy-bg', category: 'backgrounds', name: 'Galaxy', price: 180, kind: 'background' },
    { id: 'classical-piano', category: 'music', name: 'Classical Piano', price: 160, kind: 'music' }
  ],
  missions: [
    { id: 'm1', title: 'Play 3 Matches', description: 'Complete three games to keep the streak alive.', difficulty: 'Easy', progress: 2, total: 3, reward: 30, claimable: true },
    { id: 'm2', title: 'Win 2 Blitz Games', description: 'Fight fast and finish with a crisp attack.', difficulty: 'Normal', progress: 1, total: 2, reward: 60, claimable: true },
    { id: 'm3', title: 'Solve 5 Puzzles', description: 'Improve your tactics and pattern recognition.', difficulty: 'Hard', progress: 3, total: 5, reward: 90, claimable: false }
  ],
  achievements: [
    { id: 'a1', name: 'First Victory', reward: 25, unlocked: true },
    { id: 'a2', name: '10 Wins', reward: 40, unlocked: true },
    { id: 'a3', name: 'Chess Master', reward: 100, unlocked: false }
  ],
  leaderboard: [
    { name: 'Alden', rating: 1604, wins: 92, stars: 4200 },
    { name: 'Yara', rating: 1568, wins: 88, stars: 3900 },
    { name: 'Kaito', rating: 1510, wins: 75, stars: 3450 },
    { name: 'Commander', rating: 1285, wins: 18, stars: 1340 }
  ],
  dailyRewardDay: 3,
  lastMysteryBox: null,
  dailyRewards: [
    { day: 1, label: 'Starter Pack', stars: 20 },
    { day: 2, label: 'Silver Bonus', stars: 35 },
    { day: 3, label: 'Gold Boost', stars: 60 },
    { day: 4, label: 'Mystery Box', stars: 80 },
    { day: 5, label: 'Elite Skin', stars: 110 },
    { day: 6, label: 'Rare Background', stars: 150 },
    { day: 7, label: 'Legendary Bonus', stars: 220 }
  ],
  rewards: {
    stars: [10, 25, 50, 100, 250, 500],
    cosmetics: ['golden', 'galaxy-bg', 'classical-piano', 'royal-board']
  }
};

const gameState = {
  chess: new Chess(),
  selectedSquare: null,
  moveHistory: [],
  lastMove: null,
  aiDelay: 500,
  gameStartedAt: Date.now(),
  playerColor: 'w',
  aiColor: 'b'
};

const STORAGE_KEY = 'g_chess_state_v1';
const PIECE_ICONS = {
  w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
  b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(appState, parsed);
  } catch (error) {
    console.warn('Unable to restore local game state.', error);
  }
}

function applyTheme() {
  document.body.classList.toggle('light', appState.player.settings.theme === 'light');
  document.body.classList.toggle('rtl', appState.player.settings.language === 'ar');
  document.body.classList.toggle('dark', appState.player.settings.theme === 'dark');
}

function createNavTabs() {
  const nav = document.getElementById('navTabs');
  const tabs = ['home', 'play', 'challenges', 'shop', 'collection', 'missions', 'leaderboard', 'profile', 'settings'];
  tabs.forEach((tab) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (tab === appState.ui.activeSection ? ' active' : '');
    btn.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
    btn.addEventListener('click', () => showSection(tab));
    nav.appendChild(btn);
  });
}

function showSection(sectionName) {
  appState.ui.activeSection = sectionName;
  document.querySelectorAll('.section').forEach((section) => {
    section.classList.toggle('active', section.id === sectionName);
  });

  document.querySelectorAll('.tab-btn').forEach((button) => {
    button.classList.toggle('active', button.textContent.toLowerCase() === sectionName);
  });
}

function renderHome() {
  const heroStats = document.getElementById('heroStats');
  heroStats.innerHTML = `
    <div class="metric"><span class="small-muted">Stars</span><strong>${appState.player.stars}</strong></div>
    <div class="metric"><span class="small-muted">Elo</span><strong>${appState.player.elo}</strong></div>
    <div class="metric"><span class="small-muted">Matches</span><strong>${appState.player.wins + appState.player.losses + appState.player.draws}</strong></div>
    <div class="metric"><span class="small-muted">Level</span><strong>${appState.player.level}</strong></div>
  `;

  const recentList = document.getElementById('recentAchievements');
  recentList.innerHTML = appState.achievements.map((achievement) => `
    <div class="item-card">
      <div class="status-pill">${achievement.unlocked ? 'Unlocked' : 'Locked'}</div>
      <h4>${achievement.name}</h4>
      <div class="small-muted">Reward: ${achievement.reward} Stars</div>
    </div>
  `).join('');
}

function renderProfile() {
  const profile = document.getElementById('profileCard');
  profile.innerHTML = `
    <div class="profile-card">
      <div class="avatar" style="width:72px;height:72px;font-size:2rem;">${appState.player.profilePicture}</div>
      <h3>${appState.player.username}</h3>
      <div class="small-muted">Player Level ${appState.player.level}</div>
      <div class="stat-row" style="margin-top:16px;">
        <div class="metric"><span class="small-muted">Wins</span><strong>${appState.player.wins}</strong></div>
        <div class="metric"><span class="small-muted">Stars</span><strong>${appState.player.stars}</strong></div>
      </div>
    </div>
  `;
}

function renderLeaderboard() {
  const leaderboard = document.getElementById('leaderboardList');
  leaderboard.innerHTML = appState.leaderboard.map((player, index) => `
    <div class="leader-card">
      <div class="small-muted">#${index + 1}</div>
      <h4>${player.name}</h4>
      <div>Rating: ${player.rating}</div>
      <div>Wins: ${player.wins}</div>
      <div>Stars: ${player.stars}</div>
    </div>
  `).join('');
}

function renderShop() {
  const shop = document.getElementById('shopList');
  shop.innerHTML = appState.shop.map((item) => `
    <div class="item-card">
      <h4>${item.name}</h4>
      <div class="small-muted">${item.category}</div>
      <div class="price">${item.price} Stars</div>
      <div class="button-row" style="margin-top:14px;">
        <button class="btn secondary" data-buy="${item.id}">Buy</button>
        <button class="btn ghost" data-equip="${item.id}">Equip</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('[data-buy]').forEach((button) => {
    button.addEventListener('click', () => buyItem(button.dataset.buy));
  });

  document.querySelectorAll('[data-equip]').forEach((button) => {
    button.addEventListener('click', () => equipItem(button.dataset.equip));
  });
}

function buyItem(itemId) {
  const item = appState.shop.find((entry) => entry.id === itemId);
  if (!item) return;
  if (appState.player.stars < item.price) {
    alert('Not enough stars.');
    return;
  }

  appState.player.stars -= item.price;
  if (!appState.player.inventory[item.category]) {
    appState.player.inventory[item.category] = [];
  }

  if (!appState.player.inventory[item.category].includes(item.id)) {
    appState.player.inventory[item.category].push(item.id);
  }

  saveState();
  renderAll();
}

function equipItem(itemId) {
  const item = appState.shop.find((entry) => entry.id === itemId);
  if (!item) return;
  const bucket = item.category;
  if (!appState.player.inventory[bucket] || !appState.player.inventory[bucket].includes(itemId)) {
    alert('This item is not purchased yet.');
    return;
  }

  if (bucket === 'skins') {
    appState.player.inventory.skins = [itemId];
  }
  if (bucket === 'boards') {
    appState.player.inventory.boards = [itemId];
  }
  if (bucket === 'backgrounds') {
    appState.player.inventory.backgrounds = [itemId];
  }
  if (bucket === 'music') {
    appState.player.inventory.music = [itemId];
  }

  saveState();
  renderAll();
}

function renderMissionBoard() {
  const missionList = document.getElementById('missionList');
  missionList.innerHTML = appState.missions.map((mission) => `
    <div class="mission-card">
      <div class="status-pill">${mission.difficulty}</div>
      <h4>${mission.title}</h4>
      <p class="small-muted">${mission.description}</p>
      <div class="progress"><span style="width:${(mission.progress / mission.total) * 100}%"></span></div>
      <div class="small-muted">${mission.progress}/${mission.total}</div>
      <div class="button-row" style="margin-top:14px;">
        <button class="btn primary" data-claim="${mission.id}">${mission.claimable ? 'Claim Reward' : 'In Progress'}</button>
      </div>
      <div class="small-muted">Reward: ${mission.reward} Stars</div>
    </div>
  `).join('');

  document.querySelectorAll('[data-claim]').forEach((button) => {
    button.addEventListener('click', () => claimMission(button.dataset.claim));
  });
}

function claimMission(missionId) {
  const mission = appState.missions.find((entry) => entry.id === missionId);
  if (!mission || !mission.claimable || mission.progress < mission.total) return;

  appState.player.stars += mission.reward;
  mission.claimable = false;
  mission.progress = mission.total;
  saveState();
  renderAll();
}

function renderSettings() {
  const settings = document.getElementById('settingsList');
  settings.innerHTML = `
    <div class="setting-card">
      <h4>Language</h4>
      <select id="langSelect" class="select">
        <option value="en" ${appState.player.settings.language === 'en' ? 'selected' : ''}>English</option>
        <option value="ar" ${appState.player.settings.language === 'ar' ? 'selected' : ''}>Arabic</option>
        <option value="fr" ${appState.player.settings.language === 'fr' ? 'selected' : ''}>French</option>
      </select>
    </div>
    <div class="setting-card">
      <h4>Theme</h4>
      <select id="themeSelect" class="select">
        <option value="dark" ${appState.player.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
        <option value="light" ${appState.player.settings.theme === 'light' ? 'selected' : ''}>Light</option>
      </select>
    </div>
    <div class="setting-card">
      <h4>Board Orientation</h4>
      <select id="orientationSelect" class="select">
        <option value="white" ${appState.player.settings.boardOrientation === 'white' ? 'selected' : ''}>White</option>
        <option value="black" ${appState.player.settings.boardOrientation === 'black' ? 'selected' : ''}>Black</option>
      </select>
    </div>
  `;

  document.getElementById('langSelect').addEventListener('change', (event) => {
    appState.player.settings.language = event.target.value;
    applyTheme();
    saveState();
  });

  document.getElementById('themeSelect').addEventListener('change', (event) => {
    appState.player.settings.theme = event.target.value;
    applyTheme();
    saveState();
  });

  document.getElementById('orientationSelect').addEventListener('change', (event) => {
    appState.player.settings.boardOrientation = event.target.value;
    appState.ui.orientation = event.target.value;
    renderBoard();
    saveState();
  });
}

function renderRewardCalendar() {
  const rewards = document.getElementById('rewardCalendar');
  rewards.innerHTML = appState.dailyRewards.map((reward, index) => `
    <div class="item-card">
      <div class="small-muted">Day ${index + 1}</div>
      <h4>${reward.label}</h4>
      <div>${reward.stars} Stars</div>
      <button class="btn secondary" data-daily-reward="${index + 1}">Claim</button>
    </div>
  `).join('');

  document.querySelectorAll('[data-daily-reward]').forEach((button) => {
    button.addEventListener('click', () => claimDailyReward(parseInt(button.dataset.dailyReward, 10)));
  });
}

function claimDailyReward(day) {
  if (day > appState.dailyRewardDay) {
    alert('This reward is not available yet.');
    return;
  }
  const reward = appState.dailyRewards[day - 1];
  if (!reward) return;
  appState.player.stars += reward.stars;
  saveState();
  renderAll();
}

function openMysteryBox() {
  const rewards = [
    { type: 'stars', value: 10 },
    { type: 'stars', value: 25 },
    { type: 'stars', value: 50 },
    { type: 'stars', value: 100 },
    { type: 'skin', value: 'golden' },
    { type: 'board', value: 'royal-board' },
    { type: 'background', value: 'galaxy-bg' }
  ];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  if (reward.type === 'stars') {
    appState.player.stars += reward.value;
    alert(`Mystery box reward: ${reward.value} Stars`);
  } else {
    const bucket = reward.type === 'skin' ? 'skins' : reward.type === 'board' ? 'boards' : 'backgrounds';
    if (!appState.player.inventory[bucket]) {
      appState.player.inventory[bucket] = [];
    }
    if (!appState.player.inventory[bucket].includes(reward.value)) {
      appState.player.inventory[bucket].push(reward.value);
    }
    alert(`Mystery box reward: ${reward.value}`);
  }

  saveState();
  renderAll();
}

function renderCollection() {
  const collection = document.getElementById('collectionList');
  const inventory = appState.player.inventory;
  const flatInventory = [
    ...inventory.skins.map((id) => ({ kind: 'Skin', id })),
    ...inventory.boards.map((id) => ({ kind: 'Board', id })),
    ...inventory.backgrounds.map((id) => ({ kind: 'Background', id }))
  ];

  collection.innerHTML = flatInventory.length ? flatInventory.map((item) => `
    <div class="item-card">
      <div class="status-pill">Unlocked</div>
      <h4>${item.id}</h4>
      <div class="small-muted">${item.kind}</div>
    </div>
  `).join('') : '<div class="item-card"><h4>No items unlocked yet</h4></div>';
}

function renderBoard() {
  const board = document.getElementById('chess-board');
  board.innerHTML = '';

  const orientation = appState.ui.orientation || appState.player.settings.boardOrientation || 'white';
  const rows = orientation === 'black' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = orientation === 'black' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const boardState = gameState.chess.board();

  for (let rIndex = 0; rIndex < rows.length; rIndex += 1) {
    const row = rows[rIndex];
    for (let cIndex = 0; cIndex < cols.length; cIndex += 1) {
      const file = cols[cIndex];
      const square = `${String.fromCharCode(97 + file)}${8 - row}`;
      const piece = boardState[row][file];
      const squareEl = document.createElement('div');
      squareEl.className = `square ${(rIndex + cIndex) % 2 === 0 ? 'light' : 'dark'}`;
      squareEl.dataset.square = square;

      const legalMoves = getLegalMovesForSquare(square);
      if (legalMoves.length) {
        squareEl.classList.add('legal');
      }

      if (gameState.selectedSquare === square) {
        squareEl.classList.add('selected');
      }

      if (piece) {
        squareEl.innerHTML = `<span>${PIECE_ICONS[piece.color][piece.type]}</span>`;
      }

      if (gameState.lastMove && (gameState.lastMove.from === square || gameState.lastMove.to === square)) {
        squareEl.style.filter = 'brightness(1.12)';
      }

      squareEl.addEventListener('click', () => handleSquareClick(square));
      board.appendChild(squareEl);
    }
  }

  document.getElementById('statusLabel').textContent = gameState.chess.turn() === 'w' ? 'White to move' : 'Black to move';
  document.getElementById('moveHistory').innerHTML = gameState.moveHistory.length ? gameState.moveHistory.map((move) => `<span class="move-pill">${move}</span>`).join('') : '<span class="small-muted">No moves yet</span>';
}

function getLegalMovesForSquare(square) {
  if (!gameState.chess.get(square)) return [];
  const moves = gameState.chess.moves({ square, verbose: true });
  return moves;
}

function handleSquareClick(square) {
  const currentTurn = gameState.chess.turn();
  const activePlayer = appState.ui.localMultiplayer ? currentTurn : (appState.ui.playerColor || 'w');

  if (!appState.ui.localMultiplayer && currentTurn !== appState.ui.playerColor) {
    return;
  }

  if (gameState.selectedSquare) {
    const move = gameState.chess.move({ from: gameState.selectedSquare, to: square, promotion: 'q' });
    if (move) {
      gameState.moveHistory.push(`${move.from} → ${move.to}`);
      gameState.lastMove = { from: move.from, to: move.to };
      gameState.selectedSquare = null;
      renderBoard();
      if (!gameState.chess.isGameOver()) {
        const aiTurn = appState.ui.aiEnabled && !appState.ui.localMultiplayer && gameState.chess.turn() !== appState.ui.playerColor;
        if (aiTurn) {
          setTimeout(() => performAiMove(), gameState.aiDelay);
        }
      }
      return;
    }
  }

  const piece = gameState.chess.get(square);
  if (piece && piece.color === activePlayer) {
    gameState.selectedSquare = square;
    renderBoard();
  }
}

function performAiMove() {
  const moves = gameState.chess.moves({ verbose: true });
  if (!moves.length) return;

  const chosen = chooseAiMove(moves);
  gameState.chess.move(chosen);
  gameState.lastMove = { from: chosen.from, to: chosen.to };
  gameState.moveHistory.push(`${chosen.from} → ${chosen.to}`);
  gameState.selectedSquare = null;
  renderBoard();
}

function chooseAiMove(moves) {
  const difficulty = clamp(Number(appState.ui.difficulty) || 5, 1, 10);
  if (difficulty <= 2) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const scored = moves.map((move) => {
    let score = 0;
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    if (move.captured) score += pieceValues[move.captured] || 0;
    if (move.promotion) score += 800;
    const nextBoard = new Chess(gameState.chess.fen());
    nextBoard.move({ from: move.from, to: move.to, promotion: 'q' });
    const enemyMoves = nextBoard.moves({ verbose: true });
    const danger = enemyMoves.reduce((sum, nextMove) => sum + (pieceValues[nextMove.captured] || 0), 0);
    score += (Math.random() * 25) - danger * 0.04 + (difficulty * 12);
    return { move, score };
  });

  return scored.sort((a, b) => b.score - a.score)[0].move;
}

function bindPlayControls() {
  document.getElementById('restartBtn').addEventListener('click', () => {
    gameState.chess = new Chess();
    gameState.selectedSquare = null;
    gameState.moveHistory = [];
    gameState.lastMove = null;
    renderBoard();
  });

  document.getElementById('resignBtn').addEventListener('click', () => {
    alert('You resigned the game.');
    gameState.chess = new Chess();
    gameState.moveHistory = [];
    renderBoard();
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    if (appState.ui.localMultiplayer || appState.ui.aiEnabled) {
      const history = gameState.moveHistory.pop();
      if (history) {
        gameState.chess.undo();
        renderBoard();
      }
    }
  });

  document.getElementById('difficultySelect').addEventListener('change', (event) => {
    appState.ui.difficulty = Number(event.target.value);
    saveState();
  });

  document.getElementById('modeSelect').addEventListener('change', (event) => {
    appState.ui.localMultiplayer = event.target.value === 'local';
    appState.ui.aiEnabled = event.target.value !== 'local';
    saveState();
  });

  document.getElementById('colorSelect').addEventListener('change', (event) => {
    appState.ui.playerColor = event.target.value === 'black' ? 'b' : 'w';
    gameState.playerColor = appState.ui.playerColor;
    saveState();
  });

  document.getElementById('mysteryBoxBtn').addEventListener('click', openMysteryBox);
  document.getElementById('dailyRewardBtn').addEventListener('click', () => claimDailyReward(appState.dailyRewardDay));
}

function renderChallenges() {
  const list = document.getElementById('challengeList');
  list.innerHTML = [
    { title: 'Blitz Sprint', detail: 'Win 3 blitz games' },
    { title: 'Puzzle Master', detail: 'Solve 5 tactical puzzles' },
    { title: 'Royal Defense', detail: 'Win without losing a rook' }
  ].map((challenge) => `
    <div class="item-card">
      <h4>${challenge.title}</h4>
      <div class="small-muted">${challenge.detail}</div>
      <button class="btn secondary" style="margin-top:12px;">Start</button>
    </div>
  `).join('');
}

function renderAll() {
  renderHome();
  renderProfile();
  renderLeaderboard();
  renderShop();
  renderCollection();
  renderMissionBoard();
  renderChallenges();
  renderSettings();
  renderRewardCalendar();
  renderBoard();
  applyTheme();
  saveState();
}

function initApp() {
  loadState();
  createNavTabs();
  bindPlayControls();
  applyTheme();
  renderAll();
  showSection(appState.ui.activeSection);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(console.error);
  }
}

window.addEventListener('DOMContentLoaded', initApp);
