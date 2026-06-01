/**
 * NEON GRID: Tic-Tac-Toe
 * Premium single page game with synthetic Audio FX, adaptive particle grids,
 * custom SVG path drawing animations, an unbeatable Minimax AI Bot,
 * and a fully integrated Firebase Realtime Online Multiplayer lobby system
 * with custom vector SVG avatars (no emojis) and connection presences.
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
  serverTimestamp,
  update
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

// Custom Vector SVG Avatar Map representation
const AVATARS_SVG = {
  'cyber-ninja': `
    <svg class="avatar-svg cyan" viewBox="0 0 100 100" style="width:100%; height:100%;">
      <path d="M50 15 L58 42 L85 50 L58 58 L50 85 L42 58 L15 50 L42 42 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" stroke-width="4"/>
    </svg>
  `,
  'synth-wave': `
    <svg class="avatar-svg magenta" viewBox="0 0 100 100" style="width:100%; height:100%;">
      <path d="M25 65 A25 25 0 1 1 75 65 Z" fill="none" stroke="currentColor" stroke-width="6"/>
      <line x1="20" y1="65" x2="80" y2="65" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <line x1="25" y1="75" x2="75" y2="75" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="35" y1="83" x2="65" y2="83" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `,
  'byte-hex': `
    <svg class="avatar-svg yellow" viewBox="0 0 100 100" style="width:100%; height:100%;">
      <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="4"/>
      <line x1="50" y1="15" x2="50" y2="34" stroke="currentColor" stroke-width="4"/>
      <line x1="50" y1="66" x2="50" y2="85" stroke="currentColor" stroke-width="4"/>
    </svg>
  `,
  'neon-hacker': `
    <svg class="avatar-svg green" viewBox="0 0 100 100" style="width:100%; height:100%;">
      <path d="M35 30 L20 50 L35 70" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M65 30 L80 50 L65 70" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="55" y1="25" x2="45" y2="75" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `,
  'laser-phoenix': `
    <svg class="avatar-svg orange" viewBox="0 0 100 100" style="width:100%; height:100%;">
      <path d="M50 25 L80 45 L50 85 L20 45 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
      <path d="M10 50 L30 50 M70 50 L90 50" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <circle cx="50" cy="55" r="10" fill="none" stroke="currentColor" stroke-width="4"/>
    </svg>
  `,
  'google-photo': `
    <svg class="avatar-svg white" viewBox="0 0 100 100" style="width:100%; height:100%;">
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="6"/>
      <path d="M20 50 H80" stroke="currentColor" stroke-width="4"/>
      <path d="M50 20 A30 30 0 0 1 50 80 A30 30 0 0 1 50 20 Z" fill="none" stroke="currentColor" stroke-width="4"/>
    </svg>
  `
};

// Active user session state
let userProfile = {
  nickname: 'Игрок',
  avatarId: 'cyber-ninja'
};
let selectedModalAvatarId = 'cyber-ninja';

// Multiplayer Lobbies State
let activeRoomCode = null;
let playerRole = null; // 'X' (P1, Creator) or 'O' (P2, Joiner)
let opponentProfile = null;
let roomListenerUnsubscribe = null;


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
let gameMode = 'bot'; // 'bot' or 'online'
let botDifficulty = 'medium'; 
let isBotThinking = false;

let scores = {
  bot: { x: 0, ties: 0, o: 0 },
  online: { x: 0, ties: 0, o: 0 }
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
const modeOnlineBtn = document.getElementById('mode-online');
const difficultyRow = document.getElementById('difficulty-row');
const difficultyBtns = document.querySelectorAll('#difficulty-row .control-btn');
const soundToggleBtn = document.getElementById('sound-toggle');
const resetBtn = document.getElementById('btn-reset');

// Lobby Elements
const lobbyPanel = document.getElementById('lobby-panel');
const waitingPanel = document.getElementById('waiting-panel');
const btnCreateLobby = document.getElementById('btn-create-lobby');
const inputLobbyCode = document.getElementById('input-lobby-code');
const btnJoinLobby = document.getElementById('btn-join-lobby');
const displayRoomCode = document.getElementById('display-room-code');
const btnCopyCode = document.getElementById('btn-copy-code');
const btnLeaveLobby = document.getElementById('btn-leave-lobby');

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
  if (gameMode === 'bot') {
    const activeName = auth.currentUser ? userProfile.nickname : "Игрок";
    p1Label.textContent = `${activeName} (X)`;
    p2Label.textContent = `Бот (O)`;
    
    const currentScores = scores.bot;
    scoreXEl.textContent = currentScores.x;
    scoreTiesEl.textContent = currentScores.ties;
    scoreOEl.textContent = currentScores.o;
  } else {
    // Online mode labels
    const p1Name = (playerRole === 'X' && auth.currentUser) ? userProfile.nickname : (opponentProfile ? opponentProfile.nickname : "Игрок 1");
    const p2Name = (playerRole === 'O' && auth.currentUser) ? userProfile.nickname : (opponentProfile ? opponentProfile.nickname : "Соперник");
    
    p1Label.textContent = `${p1Name} (X)`;
    p2Label.textContent = `${p2Name} (O)`;
    
    const currentScores = scores.online;
    scoreXEl.textContent = currentScores.x;
    scoreTiesEl.textContent = currentScores.ties;
    scoreOEl.textContent = currentScores.o;
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
      userAvatarPlaceholder.innerHTML = AVATARS_SVG[userProfile.avatarId] || AVATARS_SVG['cyber-ninja'];
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
      set(presenceRef, {
        status: "online",
        lastChanged: serverTimestamp()
      });

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

function updateConnectionUI(isOnline) {
  if (isOnline) {
    connectionStatusEl.className = "connection-status online";
    connectionStatusEl.querySelector('.status-text').textContent = "В СЕТИ";
  } else {
    connectionStatusEl.className = "connection-status offline";
    connectionStatusEl.querySelector('.status-text').textContent = "ВНЕ СЕТИ";
  }
}

function startGlobalConnectionWatch() {
  const connectedRef = ref(db, ".info/connected");
  onValue(connectedRef, (snap) => {
    updateConnectionUI(snap.val() === true);
  });
}

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
    if (activeRoomCode) {
      await leaveActiveMultiplayerRoom();
    }

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
// 7. ONLINE MULTIPLAYER ENGINE
// ==========================================

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // High legibility list
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 7.1 Create room lobby as P1 (token X)
async function createMultiplayerRoom() {
  if (!auth.currentUser) return;
  synth.play('click-x');

  const code = generateRoomCode();
  activeRoomCode = code;
  playerRole = 'X';
  opponentProfile = null;
  
  showToast("Создание комнаты...");

  const roomRef = ref(db, `rooms/${code}`);
  const initialRoomState = {
    status: 'waiting',
    board: ['', '', '', '', '', '', '', '', ''],
    turn: 'X',
    p1: {
      uid: auth.currentUser.uid,
      nickname: userProfile.nickname,
      avatarId: userProfile.avatarId,
      photoUrl: auth.currentUser.photoURL || ''
    },
    p2: null,
    scores: { x: 0, ties: 0, o: 0 },
    rematch: { p1: false, p2: false }
  };

  try {
    await set(roomRef, initialRoomState);
    
    // Automatically delete room if creator disconnects before match starts
    onDisconnect(roomRef).set(null);

    // Render Waiting room
    displayRoomCode.textContent = code;
    lobbyPanel.classList.add('hidden');
    waitingPanel.classList.remove('hidden');
    
    // Initialize real-time updates listener
    listenToActiveRoom(code);
  } catch (error) {
    console.error("Create room error: ", error);
    showToast("Ошибка создания комнаты. Проверьте сеть.");
  }
}

// 7.2 Join existing room as P2 (token O)
async function joinMultiplayerRoom() {
  if (!auth.currentUser) return;
  synth.play('click-x');

  const rawCode = inputLobbyCode.value.trim().toUpperCase();
  if (rawCode.length !== 5) {
    showToast("Код должен состоять из 5 символов!");
    return;
  }

  showToast("Подключение к комнате...");
  
  const roomRef = ref(db, `rooms/${rawCode}`);
  
  try {
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) {
      showToast("Комната не найдена! Проверьте код.");
      return;
    }

    const roomData = snapshot.val();
    
    if (roomData.status !== 'waiting' || roomData.p2 !== null) {
      showToast("Комната уже заполнена или игра началась!");
      return;
    }

    // Join room setup
    activeRoomCode = rawCode;
    playerRole = 'O';
    opponentProfile = roomData.p1;
    
    const p2ProfileData = {
      uid: auth.currentUser.uid,
      nickname: userProfile.nickname,
      avatarId: userProfile.avatarId,
      photoUrl: auth.currentUser.photoURL || ''
    };

    // Configure drop protection: flag offline room status if P2 drops out
    onDisconnect(ref(db, `rooms/${rawCode}/status`)).set('playerLeft');

    // Write join P2 profiles & trigger play status
    await set(ref(db, `rooms/${rawCode}/p2`), p2ProfileData);
    await set(ref(db, `rooms/${rawCode}/status`), 'playing');

    lobbyPanel.classList.add('hidden');
    boardEl.classList.remove('hidden');
    
    showToast("Вы успешно подключились к игре!");
    listenToActiveRoom(rawCode);
  } catch (error) {
    console.error("Join room error: ", error);
    showToast("Ошибка подключения.");
  }
}

// 7.3 Real-time updates synchronization
function listenToActiveRoom(code) {
  if (roomListenerUnsubscribe) {
    roomListenerUnsubscribe();
  }

  const roomRef = ref(db, `rooms/${code}`);
  
  roomListenerUnsubscribe = onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    
    // Check if room was deleted or opponent disconnected
    if (!data || data.status === 'playerLeft') {
      handleOpponentDisconnected();
      return;
    }

    // 1. Transition waitings screens if P2 joined
    if (data.status === 'playing' && playerRole === 'X' && !opponentProfile) {
      opponentProfile = data.p2;
      waitingPanel.classList.add('hidden');
      boardEl.classList.remove('hidden');
      showToast("Соперник присоединился! Игра начинается.");
      
      // Update drop protection: if creator leaves now, set state to playerLeft instead of deleting entire node
      onDisconnect(roomRef).update({ status: 'playerLeft' });
    }

    // 2. Synchronize Board Cells
    syncBoardState(data.board);

    // 3. Synchronize Turn Indication
    currentPlayer = data.turn;
    updateTurnIndicator();

    // 4. Synchronize Multi-score points
    scores.online.x = data.scores.x;
    scores.online.ties = data.scores.ties;
    scores.online.o = data.scores.o;
    updateScoreboardDisplay();

    // 5. Synchronize End-Game Evaluations
    evaluateOnlineWinner(data);

    // 6. Synchronize Dual Rematch validations
    if (data.rematch && data.rematch.p1 && data.rematch.p2) {
      // Both clicked rematch: trigger clean reboot
      resetOnlineBoardState();
    } else {
      // Partial updates on rematch click status
      updateRematchBtnStatus(data.rematch);
    }
  });
}

function syncBoardState(dbBoard) {
  for (let i = 0; i < 9; i++) {
    const val = dbBoard[i];
    if (boardState[i] !== val) {
      boardState[i] = val;
      const cell = cells[i];
      
      if (val === '') {
        cell.innerHTML = '';
        cell.className = 'cell';
      } else {
        cell.classList.add('filled');
        if (val === 'X') {
          cell.innerHTML = SVG_X;
          cell.classList.add('filled-x');
          synth.play('click-x');
        } else {
          cell.innerHTML = SVG_O;
          cell.classList.add('filled-o');
          synth.play('click-o');
        }
      }
    }
  }
}

function evaluateOnlineWinner(data) {
  let roundWon = false;
  let winningCombo = null;
  let winnerToken = null;

  for (let combo of WIN_COMBINATIONS) {
    const [a, b, c] = combo;
    if (boardState[a] !== '' && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
      roundWon = true;
      winningCombo = combo;
      winnerToken = boardState[a];
      break;
    }
  }

  if (roundWon && gameActive) {
    gameActive = false;
    // Highlight local grid highlights
    const winClass = winnerToken === 'X' ? 'winning-cell-x' : 'winning-cell-o';
    winningCombo.forEach(idx => {
      cells[idx].classList.add(winClass);
    });

    // Score writing authority: only the local winning player increments score DB
    if (winnerToken === playerRole) {
      const nextScores = { ...data.scores };
      if (playerRole === 'X') nextScores.x++;
      else nextScores.o++;
      
      set(ref(db, `rooms/${activeRoomCode}/scores`), nextScores);
    }

    setTimeout(() => {
      if (winnerToken === playerRole) {
        synth.play('win');
        showEndgameModal('player-win'); // Win popup
      } else {
        synth.play('lose');
        showEndgameModal('bot-win'); // Lose popup
      }
    }, 600);
    return;
  }

  // Draw detection
  const isDraw = boardState.every(cell => cell !== '');
  if (isDraw && gameActive) {
    gameActive = false;
    
    // Draw writing authority: only P1 handles draw points
    if (playerRole === 'X') {
      const nextScores = { ...data.scores };
      nextScores.ties++;
      set(ref(db, `rooms/${activeRoomCode}/scores`), nextScores);
    }

    setTimeout(() => {
      synth.play('tie');
      showEndgameModal('draw');
    }, 600);
  }
}

// Write rematch requests
function requestOnlineRematch() {
  if (!activeRoomCode) return;
  
  synth.play('click-x');
  const path = `rooms/${activeRoomCode}/rematch/${playerRole === 'X' ? 'p1' : 'p2'}`;
  set(ref(db, path), true);
  
  showToast("Запрос на реванш отправлен!");
  rematchBtn.textContent = "Ожидание соперника...";
  rematchBtn.disabled = true;
}

function updateRematchBtnStatus(rematchData) {
  if (!rematchData) return;
  
  const ourClicked = playerRole === 'X' ? rematchData.p1 : rematchData.p2;
  const oppClicked = playerRole === 'X' ? rematchData.p2 : rematchData.p1;

  if (ourClicked && !oppClicked) {
    rematchBtn.textContent = "Ожидание соперника...";
    rematchBtn.disabled = true;
  } else if (!ourClicked) {
    rematchBtn.textContent = "Реванш";
    rematchBtn.disabled = false;
  }
}

// Reset boards across online connections
async function resetOnlineBoardState() {
  gameActive = true;
  boardState = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  
  cells.forEach(cell => {
    cell.innerHTML = '';
    cell.className = 'cell';
  });

  hideEndgameModal();
  rematchBtn.textContent = "Реванш";
  rematchBtn.disabled = false;

  // Sync P1 reset database variables
  if (playerRole === 'X') {
    await update(ref(db, `rooms/${activeRoomCode}`), {
      board: ['', '', '', '', '', '', '', '', ''],
      turn: 'X',
      rematch: { p1: false, p2: false }
    });
  }
}

// Handle sudden disconnects
function handleOpponentDisconnected() {
  showToast("Соперник покинул игру!");
  resetBoard();
  leaveActiveMultiplayerRoom();
}

// Clean room database references and unsubscribe on leave
async function leaveActiveMultiplayerRoom() {
  if (roomListenerUnsubscribe) {
    roomListenerUnsubscribe();
    roomListenerUnsubscribe = null;
  }

  if (activeRoomCode) {
    const roomRef = ref(db, `rooms/${activeRoomCode}`);
    try {
      if (playerRole === 'X') {
        // Creator deletes the entire room
        await set(roomRef, null);
      } else {
        // Participant flags escape status
        await set(ref(db, `rooms/${activeRoomCode}/status`), 'playerLeft');
      }
    } catch (e) {
      console.warn("Lobby cleanup error: ", e);
    }
  }

  // Clear session room state variables
  activeRoomCode = null;
  playerRole = null;
  opponentProfile = null;
  
  // Revert layout
  boardEl.classList.add('hidden');
  waitingPanel.classList.add('hidden');
  
  if (gameMode === 'online') {
    lobbyPanel.classList.remove('hidden');
  } else {
    boardEl.classList.remove('hidden');
  }

  updateTurnIndicator();
  updateScoreboardDisplay();
  hideEndgameModal();
}


// ==========================================
// 8. UNBEATABLE BOT AI ALGORITHM (MINIMAX)
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
// 9. CORE GAME LOGIC CONTROLLER
// ==========================================

function handleCellClick(e) {
  const cell = e.target.closest('.cell');
  if (!cell || !gameActive || isBotThinking) return;

  const index = parseInt(cell.getAttribute('data-index'));
  if (boardState[index] !== '') return;

  if (gameMode === 'online') {
    if (!activeRoomCode) return;
    
    if (currentPlayer !== playerRole) {
      showToast("Сейчас ход соперника!");
      return;
    }

    // Write selected move online
    const nextBoard = [...boardState];
    nextBoard[index] = playerRole;
    const nextTurn = playerRole === 'X' ? 'O' : 'X';
    
    set(ref(db, `rooms/${activeRoomCode}/board`), nextBoard);
    set(ref(db, `rooms/${activeRoomCode}/turn`), nextTurn);
    return;
  }

  // Vs Bot mode move execution
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
      if (currentPlayer === 'X') {
        synth.play('win');
        showEndgameModal('player-win');
      } else {
        synth.play('lose');
        showEndgameModal('bot-win');
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

  if (currentPlayer === 'O') {
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
  
  if (gameMode === 'online') {
    if (!activeRoomCode) {
      turnText.textContent = "В лобби ожидания";
      return;
    }
    
    if (currentPlayer === playerRole) {
      turnIndicator.classList.add(playerRole === 'X' ? 'x-turn' : 'o-turn');
      turnText.textContent = "Ваш ход! Выберите клетку";
    } else {
      turnIndicator.classList.add(playerRole === 'X' ? 'o-turn' : 'x-turn');
      turnText.textContent = "Ход соперника...";
    }
    return;
  }

  // VS BOT Turn Updates
  if (isBotThinking) {
    turnIndicator.classList.add('o-turn');
    turnText.textContent = "Бот думает...";
    return;
  }

  const activeName = auth.currentUser ? userProfile.nickname : "Игрок";

  if (currentPlayer === 'X') {
    turnIndicator.classList.add('x-turn');
    turnText.textContent = `Ваш ход (${activeName})`;
  } else {
    turnIndicator.classList.add('o-turn');
    turnText.textContent = "Ход Бота (O)";
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
// 10. CUSTOM POPUP SYSTEM & MODALS
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
    body = `Поздравляем, ${activeName}! Вы продемонстрировали превосходный интеллект и одержали победу.`;
    svgMarkup = `
      <line x1="25" y1="25" x2="75" y2="75" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
      <line x1="75" y1="25" x2="25" y2="75" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    `;
  } else if (resultType === 'bot-win') {
    modalContainer.classList.add('winner-o');
    modalIconWrapper.classList.add('winner-o');
    title = 'ПОРАЖЕНИЕ';
    body = 'Оппонент оказался сильнее в этой битве. Попробуйте еще раз!';
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
// 11. PROFILE MODAL CONTROLLER
// ==========================================

function openProfileSetupModal() {
  if (!auth.currentUser) return;
  
  inputNickname.value = userProfile.nickname;
  selectedModalAvatarId = userProfile.avatarId;
  
  if (auth.currentUser.photoURL) {
    googleAvatarOpt.innerHTML = `<img src="${auth.currentUser.photoURL}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`;
  }

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
// 12. INTERACTIVE RESET & REBOOT CONTROLS
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
  if (gameMode === 'online') {
    showToast("Невозможно сбросить счет онлайн соперника!");
    return;
  }
  scores.bot = { x: 0, ties: 0, o: 0 };
  saveScores();
  updateScoreboardDisplay();
  showToast("Счет против бота успешно сброшен!");
}


// ==========================================
// 13. CONFIGURATION & INTERACTIVE LISTENER INITIALIZATION
// ==========================================

// Handle Grid Board Click Events
boardEl.addEventListener('click', handleCellClick);

// Handle Game Mode Switches (vs Bot / Online Lobby)
modeBotBtn.addEventListener('click', async () => {
  if (gameMode === 'bot') return;
  
  if (activeRoomCode) {
    await leaveActiveMultiplayerRoom();
  }

  gameMode = 'bot';
  modeBotBtn.classList.add('active');
  modeOnlineBtn.classList.remove('active');
  difficultyRow.style.display = 'flex';
  lobbyPanel.classList.add('hidden');
  boardEl.classList.remove('hidden');
  
  showToast("Режим игры против Бота!");
  updateScoreboardDisplay();
  resetBoard();
});

modeOnlineBtn.addEventListener('click', () => {
  if (gameMode === 'online') return;

  // Enforce authentication barrier for online playing
  if (!auth.currentUser) {
    showToast("Пожалуйста, сначала войдите через Google!");
    return;
  }

  gameMode = 'online';
  modeOnlineBtn.classList.add('active');
  modeBotBtn.classList.remove('active');
  difficultyRow.style.display = 'none';
  boardEl.classList.add('hidden');
  lobbyPanel.classList.remove('hidden');

  showToast("Режим онлайн игры (1v1)!");
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
  if (gameMode === 'online') {
    requestOnlineRematch();
  } else {
    resetBoard();
  }
});

closeModalBtn.addEventListener('click', () => {
  hideEndgameModal();
  if (gameMode === 'online') {
    leaveActiveMultiplayerRoom();
  }
});

// Multiplayer Lobby Click Triggers
btnCreateLobby.addEventListener('click', createMultiplayerRoom);
btnJoinLobby.addEventListener('click', joinMultiplayerRoom);
btnLeaveLobby.addEventListener('click', leaveActiveMultiplayerRoom);

btnCopyCode.addEventListener('click', () => {
  if (!activeRoomCode) return;
  navigator.clipboard.writeText(activeRoomCode)
    .then(() => {
      showToast("Код комнаты скопирован в буфер! 📋");
      synth.play('click-x');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
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
    syncUserProfile(user);
    setupPresenceTracking(user);
  } else {
    userProfile = { nickname: 'Игрок', avatarId: 'cyber-ninja' };
    updateProfileUI();
    startGlobalConnectionWatch();
    
    // Automatically boot back to vs bot if logged out while online mode selected
    if (gameMode === 'online') {
      gameMode = 'bot';
      modeBotBtn.classList.add('active');
      modeOnlineBtn.classList.remove('active');
      difficultyRow.style.display = 'flex';
      boardEl.classList.remove('hidden');
      lobbyPanel.classList.add('hidden');
      updateScoreboardDisplay();
      resetBoard();
    }
  }
});

// Initialize Game configurations
loadScores();
updateTurnIndicator();
