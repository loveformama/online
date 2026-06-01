/**
 * NEON GRID: Tic-Tac-Toe
 * Premium single page game with synthetic Audio FX, adaptive particle grids,
 * custom SVG path drawing animations, an unbeatable Minimax AI Bot,
 * and a fully integrated Firebase Authentication (Google Auth), Profiles,
 * and Realtime Presence tracking system.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  onDisconnect, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ==========================================
// 1. FIREBASE INITIALIZATION & DB SETUP
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCUN4coxW6yb7MwoTkbDDHa3URIDGDWuw8",
  authDomain: "math-project-8195b.firebaseapp.com",
  databaseURL: "https://math-project-8195b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "math-project-8195b",
  storageBucket: "math-project-8195b.firebasestorage.app",
  messagingSenderId: "947622423521",
  appId: "1:947622423521:web:3038ae8b6be7d8c9f740a0",
  measurementId: "G-J8JX4XPGHS"
};

// Initialize Firebase SDK
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Custom Cyberpunk Avatars Map representation
const AVATARS = {
  'cyber-ninja': '🥷',
  'synth-wave': '🌅',
  'byte-hex': '🤖',
  'neon-hacker': '💻',
  'laser-phoenix': '🐦',
  'google-photo': '🌐'
};

// Active user session state
let userProfile = {
  nickname: 'Игрок',
  avatarId: 'cyber-ninja'
};
let selectedModalAvatarId = 'cyber-ninja';


// ==========================================
// 2. BACKGROUND PARTICLES SYSTEM
// ==========================================
const canvas = document.getElementById('canvas-particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.color = Math.random() > 0.5 ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 0, 127, 0.12)';
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Generate particles
for (let i = 0; i < 35; i++) {
  particles.push(new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();


// ==========================================
// 3. AUDIO SYNTHESIZER (WEB AUDIO API)
// ==========================================
class SoundSynth {
  constructor() {
    this.audioCtx = null;
    this.muted = localStorage.getItem('game_muted') === 'true';
    this.updateSoundButtonState();
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('game_muted', this.muted);
    this.updateSoundButtonState();
    return this.muted;
  }

  updateSoundButtonState() {
    const btn = document.getElementById('sound-toggle');
    if (btn) {
      if (this.muted) {
        btn.classList.add('muted');
      } else {
        btn.classList.remove('muted');
      }
    }
  }

  play(type) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const now = this.audioCtx.currentTime;

    switch (type) {
      case 'click-x': {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'click-o': {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.08); // E4

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'win': {
        const notes = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
        notes.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          
          gain.gain.setValueAtTime(0, now + idx * 0.07);
          gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.07 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.4);
        });
        break;
      }
      case 'lose': {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180.00, now); 
        osc.frequency.exponentialRampToValueAtTime(45.00, now + 0.5);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.5);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
      case 'tie': {
        [293.66, 293.66].forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);

          gain.gain.setValueAtTime(0, now + idx * 0.14);
          gain.gain.linearRampToValueAtTime(0.035, now + idx * 0.14 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.09);

          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.09);
        });
        break;
      }
    }
  }
}

const synth = new SoundSynth();


// ==========================================
// 4. CORE GAME ENGINE STATE
// ==========================================
let boardState = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X'; 
let gameActive = true;
let gameMode = 'bot'; 
let botDifficulty = 'medium'; 
let isBotThinking = false;

let scores = {
  bot: { x: 0, ties: 0, o: 0 },
  local: { x: 0, ties: 0, o: 0 }
};

const WIN_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], 
  [0, 3, 6], [1, 4, 7], [2, 5, 8], 
  [0, 4, 8], [2, 4, 6]             
];

const SVG_X = `
  <svg class="token-svg" viewBox="0 0 100 100">
    <line x1="22" y1="22" x2="78" y2="78" class="path-x"></line>
    <line x1="78" y1="22" x2="22" y2="78" class="path-x path-x-2"></line>
  </svg>
`;

const SVG_O = `
  <svg class="token-svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="28" class="path-o"></circle>
  </svg>
`;


// ==========================================
// 5. UI ELEMENT CACHING & INTERACTIVE HOOKS
// ==========================================
const boardEl = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const turnIndicator = document.getElementById('turn-indicator');
const turnText = document.getElementById('turn-text');
const scoreXEl = document.getElementById('score-x');
const scoreTiesEl = document.getElementById('score-ties');
const scoreOEl = document.getElementById('score-o');
const p1Label = document.getElementById('p1-label');
const p2Label = document.getElementById('p2-label');

const modeBotBtn = document.getElementById('mode-bot');
const modeLocalBtn = document.getElementById('mode-local');
const difficultyRow = document.getElementById('difficulty-row');
const difficultyBtns = document.querySelectorAll('#difficulty-row .control-btn');
const soundToggleBtn = document.getElementById('sound-toggle');
const resetBtn = document.getElementById('btn-reset');

// Modal Elements
const endgameModal = document.getElementById('endgame-modal');
const modalContainer = document.getElementById('modal-container');
const modalIconWrapper = document.getElementById('modal-icon-wrapper');
const modalIcon = document.getElementById('modal-icon');
const modalResultTitle = document.getElementById('modal-result-title');
const modalResultBody = document.getElementById('modal-result-body');
const rematchBtn = document.getElementById('btn-rematch');
const closeModalBtn = document.getElementById('btn-close-modal');

// Toast Notification
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
let toastTimeout = null;

// Firebase & Presence UI Elements
const connectionStatusEl = document.getElementById('connection-status');
const btnLoginGoogle = document.getElementById('btn-login-google');
const userProfileWidget = document.getElementById('user-profile');
const userNameEl = document.getElementById('user-name');
const userAvatarImg = document.getElementById('user-avatar-img');
const userAvatarPlaceholder = document.getElementById('user-avatar-placeholder');
const btnOpenProfile = document.getElementById('btn-open-profile');

// Profile modal components
const profileModal = document.getElementById('profile-modal');
const inputNickname = document.getElementById('input-nickname');
const avatarGrid = document.getElementById('avatar-grid');
const googleAvatarOpt = document.getElementById('google-avatar-opt');
const btnSaveProfile = document.getElementById('btn-save-profile');
const btnLogout = document.getElementById('btn-logout');
const btnCloseProfile = document.getElementById('btn-close-profile');

function loadScores() {
  const savedScores = localStorage.getItem('neongrid_scores');
  if (savedScores) {
    try {
      scores = JSON.parse(savedScores);
    } catch (e) {
      console.warn("Failed to load local storage scores. Resetting default values.");
    }
  }
  updateScoreboardDisplay();
}

function saveScores() {
  localStorage.setItem('neongrid_scores', JSON.stringify(scores));
}

function showToast(message) {
  clearTimeout(toastTimeout);
  toastMessage.textContent = message;
  toast.classList.add('active');
  
  toastTimeout = setTimeout(() => {
    toast.classList.remove('active');
  }, 2500);
}

function updateScoreboardDisplay() {
  const currentScores = scores[gameMode];
  scoreXEl.textContent = currentScores.x;
  scoreTiesEl.textContent = currentScores.ties;
  scoreOEl.textContent = currentScores.o;

  const activeName = auth.currentUser ? userProfile.nickname : "Игрок";

  if (gameMode === 'bot') {
    p1Label.textContent = `${activeName} (X)`;
    p2Label.textContent = `Бот (O)`;
  } else {
    p1Label.textContent = `${activeName} 1 (X)`;
    p2Label.textContent = "Игрок 2 (O)";
  }
}


// ==========================================
// 6. FIREBASE PRESENCE & PROFILE ENGINE
// ==========================================

// Load user settings profile record from Database
async function syncUserProfile(user) {
  if (!user) return;

  const profileRef = ref(db, `users/${user.uid}/profile`);
  
  try {
    const snapshot = await get(profileRef);
    if (snapshot.exists()) {
      userProfile = snapshot.val();
    } else {
      // Create new profile record using Google info
      const initialNickname = user.displayName ? user.displayName.split(' ')[0].slice(0, 12) : 'Игрок';
      userProfile = {
        nickname: initialNickname,
        avatarId: 'google-photo'
      };
      // Write database entry
      await set(profileRef, userProfile);
    }
  } catch (err) {
    console.error("Firebase sync error: ", err);
  }

  updateProfileUI();
}

// Render dynamic profile assets in Top Bar
function updateProfileUI() {
  if (auth.currentUser) {
    userNameEl.textContent = userProfile.nickname;
    
    if (userProfile.avatarId === 'google-photo' && auth.currentUser.photoURL) {
      userAvatarImg.src = auth.currentUser.photoURL;
      userAvatarImg.classList.remove('hidden');
      userAvatarPlaceholder.classList.add('hidden');
    } else {
      userAvatarImg.classList.add('hidden');
      userAvatarPlaceholder.classList.remove('hidden');
      userAvatarPlaceholder.textContent = AVATARS[userProfile.avatarId] || '🥷';
    }
    
    btnLoginGoogle.classList.add('hidden');
    userProfileWidget.classList.remove('hidden');
  } else {
    btnLoginGoogle.classList.remove('hidden');
    userProfileWidget.classList.add('hidden');
  }
  
  updateScoreboardDisplay();
}

// Handle Realtime Database presence tracking setup
function setupPresenceTracking(user) {
  if (!user) return;

  const presenceRef = ref(db, `users/${user.uid}/presence`);
  const connectedRef = ref(db, ".info/connected");

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // Authenticated client is fully online to database
      set(presenceRef, {
        status: "online",
        lastChanged: serverTimestamp()
      });

      // Clear record cleanly on disconnect callback
      onDisconnect(presenceRef).set({
        status: "offline",
        lastChanged: serverTimestamp()
      });
      
      updateConnectionUI(true);
    } else {
      updateConnectionUI(false);
    }
  });
}

// Update connection status glow indicators
function updateConnectionUI(isOnline) {
  if (isOnline) {
    connectionStatusEl.className = "connection-status online";
    connectionStatusEl.querySelector('.status-text').textContent = "В СЕТИ";
  } else {
    connectionStatusEl.className = "connection-status offline";
    connectionStatusEl.querySelector('.status-text').textContent = "ВНЕ СЕТИ";
  }
}

// Watch Connection status globally when not signed in
function startGlobalConnectionWatch() {
  const connectedRef = ref(db, ".info/connected");
  onValue(connectedRef, (snap) => {
    updateConnectionUI(snap.val() === true);
  });
}

// Handle Google Auth Action Flow
async function handleLogin() {
  try {
    synth.init();
    const result = await signInWithPopup(auth, googleProvider);
    showToast(`Вход выполнен! Добро пожаловать, ${result.user.displayName}`);
  } catch (error) {
    console.error("Auth popup error: ", error);
    showToast("Ошибка авторизации. Попробуйте еще раз.");
  }
}

async function handleLogout() {
  try {
    // Flag offline state before disconnecting auth session
    if (auth.currentUser) {
      const presenceRef = ref(db, `users/${auth.currentUser.uid}/presence`);
      await set(presenceRef, {
        status: "offline",
        lastChanged: serverTimestamp()
      });
    }
    
    await signOut(auth);
    profileModal.classList.remove('active');
    
    userProfile = { nickname: 'Игрок', avatarId: 'cyber-ninja' };
    updateProfileUI();
    showToast("Вы вышли из системы.");
  } catch (error) {
    console.error("Logout error: ", error);
  }
}


// ==========================================
// 7. UNBEATABLE BOT AI ALGORITHM (MINIMAX)
// ==========================================

function checkWinnerSimulated(board) {
  for (let combo of WIN_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]; 
    }
  }
  if (board.every(cell => cell !== '')) return 'draw';
  return null;
}

function minimax(board, depth, isMaximizing) {
  let winner = checkWinnerSimulated(board);
  
  if (winner === 'O') return 10 - depth; 
  if (winner === 'X') return depth - 10; 
  if (winner === 'draw') return 0;       

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        let score = minimax(board, depth + 1, false);
        board[i] = '';
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        let score = minimax(board, depth + 1, true);
        board[i] = '';
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function computeBotMove() {
  const emptyCells = boardState.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
  
  if (emptyCells.length === 0) return null;

  if (botDifficulty === 'easy') {
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  if (botDifficulty === 'medium') {
    if (Math.random() > 0.5) {
      return getOptimalMinimaxMove();
    }
    
    const winningMove = findStrategicMove('O');
    if (winningMove !== null) return winningMove;
    
    const blockingMove = findStrategicMove('X');
    if (blockingMove !== null) return blockingMove;

    if (boardState[4] === '') return 4;

    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  return getOptimalMinimaxMove();
}

function getOptimalMinimaxMove() {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (boardState[i] === '') {
      boardState[i] = 'O';
      let score = minimax(boardState, 0, false);
      boardState[i] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

function findStrategicMove(playerToken) {
  for (let combo of WIN_COMBINATIONS) {
    const [a, b, c] = combo;
    const vals = [boardState[a], boardState[b], boardState[c]];
    const playerCount = vals.filter(v => v === playerToken).length;
    const emptyCount = vals.filter(v => v === '').length;

    if (playerCount === 2 && emptyCount === 1) {
      if (boardState[a] === '') return a;
      if (boardState[b] === '') return b;
      if (boardState[c] === '') return c;
    }
  }
  return null;
}


// ==========================================
// 8. CORE GAME LOGIC CONTROLLER
// ==========================================

function handleCellClick(e) {
  const cell = e.target.closest('.cell');
  if (!cell || !gameActive || isBotThinking) return;

  const index = parseInt(cell.getAttribute('data-index'));
  if (boardState[index] !== '') return;

  makeMove(index);
}

function makeMove(index) {
  boardState[index] = currentPlayer;
  const cell = cells[index];
  cell.classList.add('filled');
  
  if (currentPlayer === 'X') {
    cell.innerHTML = SVG_X;
    cell.classList.add('filled-x');
    synth.play('click-x');
  } else {
    cell.innerHTML = SVG_O;
    cell.classList.add('filled-o');
    synth.play('click-o');
  }

  checkGameStatus();
}

function checkGameStatus() {
  let roundWon = false;
  let winningCombo = null;

  for (let combo of WIN_COMBINATIONS) {
    const [a, b, c] = combo;
    if (boardState[a] !== '' && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      roundWon = true;
      winningCombo = combo;
      break;
    }
  }

  if (roundWon) {
    gameActive = false;
    highlightWinners(winningCombo);
    
    scores[gameMode][currentPlayer.toLowerCase()]++;
    saveScores();
    updateScoreboardDisplay();

    setTimeout(() => {
      if (gameMode === 'bot') {
        if (currentPlayer === 'X') {
          synth.play('win');
          showEndgameModal('player-win');
        } else {
          synth.play('lose');
          showEndgameModal('bot-win');
        }
      } else {
        synth.play('win');
        showEndgameModal(currentPlayer === 'X' ? 'p1-win' : 'p2-win');
      }
    }, 600);
    return;
  }

  const isDraw = boardState.every(cell => cell !== '');
  if (isDraw) {
    gameActive = false;
    scores[gameMode].ties++;
    saveScores();
    updateScoreboardDisplay();

    setTimeout(() => {
      synth.play('tie');
      showEndgameModal('draw');
    }, 600);
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateTurnIndicator();

  if (gameMode === 'bot' && currentPlayer === 'O' && gameActive) {
    triggerBotCycle();
  }
}

function highlightWinners(combo) {
  const winClass = currentPlayer === 'X' ? 'winning-cell-x' : 'winning-cell-o';
  combo.forEach(idx => {
    cells[idx].classList.add(winClass);
  });
}

function updateTurnIndicator() {
  turnIndicator.className = 'turn-status';
  
  if (isBotThinking) {
    turnIndicator.classList.add('o-turn');
    turnText.textContent = "Бот думает...";
    return;
  }

  const activeName = auth.currentUser ? userProfile.nickname : "Игрок";

  if (currentPlayer === 'X') {
    turnIndicator.classList.add('x-turn');
    turnText.textContent = gameMode === 'bot' ? "Ваш ход (X)" : `Ход ${activeName} 1 (X)`;
  } else {
    turnIndicator.classList.add('o-turn');
    turnText.textContent = gameMode === 'bot' ? "Ход Бота (O)" : "Ход Игрока 2 (O)";
  }
}

function triggerBotCycle() {
  isBotThinking = true;
  updateTurnIndicator();

  const simulatedDelay = 400 + Math.random() * 400;
  
  setTimeout(() => {
    if (!gameActive) return; 
    const botIndex = computeBotMove();
    
    isBotThinking = false;
    if (botIndex !== null) {
      makeMove(botIndex);
    }
  }, simulatedDelay);
}


// ==========================================
// 9. CUSTOM POPUP SYSTEM & MODALS
// ==========================================

function showEndgameModal(resultType) {
  modalContainer.className = 'modal-content';
  modalIconWrapper.className = 'modal-icon-container';
  modalIcon.innerHTML = '';

  let title = '';
  let body = '';
  let svgMarkup = '';

  const activeName = auth.currentUser ? userProfile.nickname : "Игрок";

  if (resultType === 'player-win') {
    modalContainer.classList.add('winner-x');
    modalIconWrapper.classList.add('winner-x');
    title = 'ПОБЕДА!';
    body = `Поздравляем, ${activeName}! Вы продемонстрировали превосходный интеллект и обыграли ИИ-бота.`;
    svgMarkup = `
      <line x1="25" y1="25" x2="75" y2="75" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="75" y1="25" x2="25" y2="75" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `;
  } else if (resultType === 'bot-win') {
    modalContainer.classList.add('winner-o');
    modalIconWrapper.classList.add('winner-o');
    title = 'ПОРАЖЕНИЕ';
    body = 'Искусственный интеллект оказался сильнее в этой битве. Попробуйте еще раз!';
    svgMarkup = `
      <circle cx="50" cy="50" r="25" stroke="currentColor" stroke-width="8" fill="none"/>
    `;
  } else if (resultType === 'p1-win') {
    modalContainer.classList.add('winner-x');
    modalIconWrapper.classList.add('winner-x');
    title = `${activeName.toUpperCase()} 1 ВЫИГРАЛ!`;
    body = `Игрок 1 (${activeName}) одержал уверенную победу в локальном поединке. Прекрасная игра!`;
    svgMarkup = `
      <line x1="25" y1="25" x2="75" y2="75" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="75" y1="25" x2="25" y2="75" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `;
  } else if (resultType === 'p2-win') {
    modalContainer.classList.add('winner-o');
    modalIconWrapper.classList.add('winner-o');
    title = 'ИГРОК 2 ВЫИГРАЛ!';
    body = 'Игрок 2 (O) побеждает в упорной битве. Реванш расставит все на свои места!';
    svgMarkup = `
      <circle cx="50" cy="50" r="25" stroke="currentColor" stroke-width="8" fill="none"/>
    `;
  } else if (resultType === 'draw') {
    modalContainer.classList.add('draw');
    modalIconWrapper.classList.add('draw');
    title = 'НИЧЬЯ';
    body = 'Силы равны! Никто не уступил ни дюйма территории. Абсолютное равновесие.';
    svgMarkup = `
      <path d="M25 40 H75 M25 60 H75" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `;
  }

  modalIcon.innerHTML = svgMarkup;
  modalResultTitle.textContent = title;
  modalResultBody.textContent = body;
  endgameModal.classList.add('active');
}

function hideEndgameModal() {
  endgameModal.classList.remove('active');
}


// ==========================================
// 10. PROFILE MODAL CONTROLLER
// ==========================================

function openProfileSetupModal() {
  if (!auth.currentUser) return;
  
  // Populate current values
  inputNickname.value = userProfile.nickname;
  selectedModalAvatarId = userProfile.avatarId;
  
  // Set up google avatar option preview photo if available
  if (auth.currentUser.photoURL) {
    googleAvatarOpt.querySelector('.avatar-opt-char').innerHTML = `<img src="${auth.currentUser.photoURL}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`;
  }

  // Highlight active avatar option
  highlightSelectedAvatarInModal(selectedModalAvatarId);
  
  profileModal.classList.add('active');
}

function closeProfileSetupModal() {
  profileModal.classList.remove('active');
}

function highlightSelectedAvatarInModal(avatarId) {
  const avatarOpts = avatarGrid.querySelectorAll('.avatar-opt');
  avatarOpts.forEach(opt => {
    if (opt.getAttribute('data-avatar-id') === avatarId) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

// Write selected changes back to DB
async function saveUserProfileData() {
  if (!auth.currentUser) return;

  const rawNickname = inputNickname.value.trim();
  if (rawNickname.length < 2 || rawNickname.length > 12) {
    showToast("Никнейм должен быть от 2 до 12 символов!");
    return;
  }

  userProfile.nickname = rawNickname;
  userProfile.avatarId = selectedModalAvatarId;

  const profileRef = ref(db, `users/${auth.currentUser.uid}/profile`);
  
  try {
    await set(profileRef, userProfile);
    showToast("Профиль успешно сохранен!");
    updateProfileUI();
    closeProfileSetupModal();
  } catch (error) {
    console.error("Save profile error: ", error);
    showToast("Не удалось сохранить профиль.");
  }
}


// ==========================================
// 11. INTERACTIVE RESET & REBOOT CONTROLS
// ==========================================

function resetBoard() {
  boardState = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;
  isBotThinking = false;
  
  cells.forEach(cell => {
    cell.innerHTML = '';
    cell.className = 'cell';
  });

  updateTurnIndicator();
  hideEndgameModal();
}

function resetEntireScores() {
  scores[gameMode] = { x: 0, ties: 0, o: 0 };
  saveScores();
  updateScoreboardDisplay();
  showToast("Счет текущего режима полностью сброшен!");
}


// ==========================================
// 12. CONFIGURATION & INTERACTIVE LISTENER INITIALIZATION
// ==========================================

// Handle Grid Board Click Events
boardEl.addEventListener('click', handleCellClick);

// Handle Game Mode Switches (vs Bot / Local)
modeBotBtn.addEventListener('click', () => {
  if (gameMode === 'bot') return;
  gameMode = 'bot';
  modeBotBtn.classList.add('active');
  modeLocalBtn.classList.remove('active');
  difficultyRow.style.display = 'flex';
  
  showToast("Переключено в режим игры с Ботом!");
  updateScoreboardDisplay();
  resetBoard();
});

modeLocalBtn.addEventListener('click', () => {
  if (gameMode === 'local') return;
  gameMode = 'local';
  modeLocalBtn.classList.add('active');
  modeBotBtn.classList.remove('active');
  difficultyRow.style.display = 'none';

  showToast("Переключено в локальный режим (2P)!");
  updateScoreboardDisplay();
  resetBoard();
});

// Handle Bot Difficulty Buttons Clicking
difficultyBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    difficultyBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    botDifficulty = btn.getAttribute('data-diff');
    let readableDiff = "Средне";
    if (botDifficulty === 'easy') readableDiff = "Легко";
    if (botDifficulty === 'hard') readableDiff = "Нереально";
    
    showToast(`Сложность Бота: ${readableDiff}`);
    resetBoard();
  });
});

// Sound Toggle Click Hook
soundToggleBtn.addEventListener('click', () => {
  const isMuted = synth.toggleMute();
  showToast(isMuted ? "Звук отключен" : "Звук включен 🔊");
});

// Reset Scoreboard Hook
resetBtn.addEventListener('click', () => {
  resetEntireScores();
});

// Rematch / Modal Action Hooks
rematchBtn.addEventListener('click', () => {
  resetBoard();
});

closeModalBtn.addEventListener('click', () => {
  hideEndgameModal();
});

// Sound Init Interaction Trigger: registers Web Audio upon first click anywhere to bypass browser restrictions
document.body.addEventListener('click', () => {
  synth.init();
}, { once: true });


// Firebase Interaction listeners
btnLoginGoogle.addEventListener('click', handleLogin);
btnLogout.addEventListener('click', handleLogout);
btnOpenProfile.addEventListener('click', openProfileSetupModal);
btnCloseProfile.addEventListener('click', closeProfileSetupModal);
btnSaveProfile.addEventListener('click', saveUserProfileData);

// Avatar selection click hooks
avatarGrid.addEventListener('click', (e) => {
  const opt = e.target.closest('.avatar-opt');
  if (!opt) return;
  
  selectedModalAvatarId = opt.getAttribute('data-avatar-id');
  highlightSelectedAvatarInModal(selectedModalAvatarId);
  synth.play('click-x');
});


// Register global authentication listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User signed in
    syncUserProfile(user);
    setupPresenceTracking(user);
  } else {
    // User signed out
    userProfile = { nickname: 'Игрок', avatarId: 'cyber-ninja' };
    updateProfileUI();
    startGlobalConnectionWatch();
  }
});

// Initialize Game configurations
loadScores();
updateTurnIndicator();
