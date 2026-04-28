"use client";

import { useEffect, useRef, useState } from 'react';
import { Apple, Star, Circle, RotateCcw } from 'lucide-react';

type ItemType = 'apple' | 'star' | 'ball' | 'golden';

type FallingItem = {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  size: number;
  caught?: boolean;
};

type DifficultyMode = 'easy' | 'normal' | 'hard';

type GameStats = {
  totalCaught: number;
  totalMissed: number;
  bestCombo: number;
};

type DifficultyConfig = {
  playerSpeed: number;
  spawnIntervalBase: number;
  spawnIntervalMin: number;
  levelUpThreshold: number;
  startingLives: number;
};

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 82;
const PLAYER_HEIGHT = 28;
const PLAYER_Y = GAME_HEIGHT - 76;

const ITEM_SCORES: Record<ItemType, number> = {
  apple: 10,
  star: 20,
  ball: 5,
  golden: 50,
};

const ITEM_NAMES: Record<ItemType, string> = {
  apple: 'APPLE',
  star: 'STAR',
  ball: 'BALL',
  golden: 'GOLDEN',
};

const ITEM_COLORS: Record<ItemType, string> = {
  apple: '#00ff66',
  star: '#ff00ff',
  ball: '#ff6600',
  golden: '#ffd700',
};

const ITEM_BASE_SPEED: Record<ItemType, number> = {
  apple: 2.2,
  star: 2.8,
  ball: 2.5,
  golden: 2.0,
};

const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
  easy: {
    playerSpeed: 0.55,
    spawnIntervalBase: 1400,
    spawnIntervalMin: 800,
    levelUpThreshold: 200,
    startingLives: 5,
  },
  normal: {
    playerSpeed: 0.45,
    spawnIntervalBase: 1200,
    spawnIntervalMin: 600,
    levelUpThreshold: 150,
    startingLives: 3,
  },
  hard: {
    playerSpeed: 0.38,
    spawnIntervalBase: 1000,
    spawnIntervalMin: 400,
    levelUpThreshold: 100,
    startingLives: 2,
  },
};

// Better spawn intervals for smoother gameplay
function getSpawnInterval(level: number, difficulty: DifficultyMode) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  return Math.max(config.spawnIntervalBase - (level - 1) * 80, config.spawnIntervalMin);
}

// More balanced item distribution with golden star power-up
function randomType(): ItemType {
  const roll = Math.random();
  if (roll < 0.02) return 'golden';     // 2% - rare power-up, 50 points
  if (roll < 0.35) return 'apple';      // 33% - common, low points
  if (roll < 0.58) return 'ball';       // 23% - common, lowest points
  return 'star';                         // 42% - less common, high points
}

// Smoother level progression
function getLevelFromScore(score: number, difficulty: DifficultyMode): number {
  const config = DIFFICULTY_CONFIGS[difficulty];
  return Math.floor(score / config.levelUpThreshold) + 1;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getItemIcon(type: ItemType) {
  switch (type) {
    case 'apple':
      return <Apple size={16} fill={ITEM_COLORS.apple} stroke={ITEM_COLORS.apple} />;
    case 'star':
      return <Star size={18} fill={ITEM_COLORS.star} stroke={ITEM_COLORS.star} />;
    case 'ball':
      return <Circle size={16} fill={ITEM_COLORS.ball} stroke={ITEM_COLORS.ball} />;
    case 'golden':
      return <Star size={20} fill={ITEM_COLORS.golden} stroke={ITEM_COLORS.golden} />;
  }
}

function GameStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="scanline relative mx-auto h-[600px] w-[400px] overflow-hidden border-[3px] border-[#333333] bg-black">
      <svg viewBox="0 0 400 600" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="skyGlow" cx="50%" cy="18%" r="80%">
            <stop offset="0%" stopColor="rgba(0,255,102,0.08)" />
            <stop offset="55%" stopColor="rgba(0,0,0,0.02)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.95)" />
          </radialGradient>
        </defs>
        <rect width="400" height="600" fill="url(#skyGlow)" />
        <rect x="0" y="495" width="48" height="105" fill="#0a0a0a" opacity="0.92" />
        <rect x="56" y="455" width="58" height="145" fill="#0f0f0f" opacity="0.84" />
        <rect x="124" y="515" width="34" height="85" fill="#0a0a0a" opacity="0.95" />
        <rect x="168" y="468" width="52" height="132" fill="#0f0f0f" opacity="0.86" />
        <rect x="234" y="440" width="46" height="160" fill="#0a0a0a" opacity="0.9" />
        <rect x="286" y="478" width="42" height="122" fill="#0f0f0f" opacity="0.88" />
        <rect x="336" y="430" width="64" height="170" fill="#0a0a0a" opacity="0.94" />
      </svg>
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

function Scoreboard({ score, lives, level, combo, streak, highScore }: { 
  score: number; 
  lives: number; 
  level: number;
  combo: number;
  streak: number;
  highScore: number;
}) {
  return (
    <div className="absolute left-0 top-0 z-10 w-full px-4 py-3">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.1em] mb-2">
        <div className="border-2 border-[#00ff66] bg-black px-3 py-1.5 text-[#00ff66]">SCORE: {score}</div>
        <div className="border-2 border-[#ff0066] bg-black px-3 py-1.5 text-[#ff0066]">LIVES: {lives}</div>
        <div className="border-2 border-[#00ccff] bg-black px-3 py-1.5 text-[#00ccff]">LVL: {level}</div>
      </div>
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.1em]">
        <div className="border-2 border-[#ffd700] bg-black px-3 py-1.5 text-[#ffd700]">HIGH: {highScore}</div>
        {combo > 1 && (
          <div className="border-2 border-[#ff00ff] bg-black px-3 py-1.5 text-[#ff00ff] animate-pulse">
            COMBO: x{combo}
          </div>
        )}
        {streak > 0 && (
          <div className="border-2 border-[#00ff66] bg-black px-3 py-1.5 text-[#00ff66]">
            STREAK: {streak}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerContainer({ x }: { x: number }) {
  return (
    <div 
      className="absolute z-20 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${PLAYER_Y}px`,
        width: `${PLAYER_WIDTH}px`,
        height: `${PLAYER_HEIGHT}px`,
      }}
    >
      {/* Brutalist basket design */}
      <div className="relative w-full h-full">
        {/* Main basket body */}
        <div 
          className="absolute inset-0 border-[3px] border-[#00ff66] bg-black"
          style={{
            boxShadow: '0 0 20px rgba(0, 255, 102, 0.4), inset 0 0 10px rgba(0, 255, 102, 0.1)'
          }}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-[3px] border border-[#00ff66]/30 bg-gradient-to-b from-[#00ff66]/10 to-transparent" />
          
          {/* Star icon in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Star size={14} className="text-[#00ff66]" fill="#00ff66" opacity={0.6} />
          </div>
        </div>
        
        {/* Corner accents */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#00ff66]" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00ff66]" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#00ccff]" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#00ccff]" />
      </div>
    </div>
  );
}

function FallingItems({ items }: { items: FallingItem[] }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            width: `${item.size}px`,
            height: `${item.size}px`,
          }}
        >
          <div className="flex items-center justify-center w-full h-full rounded-full border-2" style={{ 
            borderColor: ITEM_COLORS[item.type],
            backgroundColor: `${ITEM_COLORS[item.type]}20`,
            boxShadow: `0 0 15px ${ITEM_COLORS[item.type]}40`
          }}>
            {getItemIcon(item.type)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatchTheFallingObjectsGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyMode>('normal');
  const [playerX, setPlayerX] = useState((GAME_WIDTH - PLAYER_WIDTH) / 2);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({ totalCaught: 0, totalMissed: 0, bestCombo: 0 });
  const [lastCatch, setLastCatch] = useState<{ type: ItemType; points: number; x: number; y: number } | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  
  const nextId = useRef(1);
  const particleId = useRef(1);
  const keysPressed = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const lastFrame = useRef<number | null>(null);
  const spawnTimer = useRef(0);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const comboRef = useRef(0);
  const streakRef = useRef(0);
  const playerXRef = useRef((GAME_WIDTH - PLAYER_WIDTH) / 2);
  const catchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scoredItemsRef = useRef<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context and load high score
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('catchGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Sound effect functions
  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  };

  const playCatchSound = (type: ItemType) => {
    switch (type) {
      case 'apple':
        playSound(523.25, 0.1, 'sine'); // C5
        break;
      case 'star':
        playSound(659.25, 0.15, 'triangle'); // E5
        setTimeout(() => playSound(783.99, 0.1, 'triangle'), 50); // G5
        break;
      case 'ball':
        playSound(392.00, 0.1, 'square'); // G4
        break;
      case 'golden':
        playSound(880.00, 0.1, 'sine'); // A5
        setTimeout(() => playSound(1046.50, 0.1, 'sine'), 50); // C6
        setTimeout(() => playSound(1318.51, 0.15, 'sine'), 100); // E6
        break;
    }
  };

  const playMissSound = () => {
    playSound(130.81, 0.2, 'sawtooth'); // C3
  };

  const playLevelUpSound = () => {
    playSound(523.25, 0.1, 'sine');
    setTimeout(() => playSound(659.25, 0.1, 'sine'), 100);
    setTimeout(() => playSound(783.99, 0.2, 'sine'), 200);
  };

  const playGameOverSound = () => {
    playSound(392.00, 0.15, 'sawtooth');
    setTimeout(() => playSound(329.63, 0.15, 'sawtooth'), 150);
    setTimeout(() => playSound(261.63, 0.3, 'sawtooth'), 300);
  };

  // Create particle effect
  const createParticles = (x: number, y: number, color: string) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: particleId.current++,
      x: x + Math.random() * 20 - 10,
      y: y + Math.random() * 20 - 10,
      color,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 500);
  };

  const resetGame = () => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    setPlayerX((GAME_WIDTH - PLAYER_WIDTH) / 2);
    playerXRef.current = (GAME_WIDTH - PLAYER_WIDTH) / 2;
    setItems([]);
    setScore(0);
    setLives(config.startingLives);
    setLevel(1);
    setCombo(0);
    setStreak(0);
    setGameOver(false);
    setPaused(false);
    setLastCatch(null);
    setParticles([]);
    setGameStats({ totalCaught: 0, totalMissed: 0, bestCombo: 0 });
    scoreRef.current = 0;
    levelRef.current = 1;
    comboRef.current = 0;
    streakRef.current = 0;
    scoredItemsRef.current.clear();
    keysPressed.current = { left: false, right: false };
    lastFrame.current = null;
    spawnTimer.current = 0;
    if (catchTimeoutRef.current) {
      clearTimeout(catchTimeoutRef.current);
    }
  };

  const startGame = (selectedDifficulty: DifficultyMode) => {
    setDifficulty(selectedDifficulty);
    setGameStarted(true);
    const config = DIFFICULTY_CONFIGS[selectedDifficulty];
    setLives(config.startingLives);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        keysPressed.current.left = true;
      }
      if (event.key === 'ArrowRight') {
        keysPressed.current.right = true;
      }
      if (event.key === 'Enter' && gameOver) {
        resetGame();
      }
      if ((event.key === 'p' || event.key === 'P') && gameStarted && !gameOver) {
        setPaused(prev => !prev);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        keysPressed.current.left = false;
      }
      if (event.key === 'ArrowRight') {
        keysPressed.current.right = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameOver, gameStarted]);

  useEffect(() => {
    if (gameOver || !gameStarted || paused) {
      return;
    }

    const config = DIFFICULTY_CONFIGS[difficulty];
    let animationFrameId = 0;
    let isRunning = true;

    const loop = (timestamp: number) => {
      if (!isRunning) {
        return;
      }

      if (lastFrame.current === null) {
        lastFrame.current = timestamp;
      }

      const delta = timestamp - lastFrame.current;
      lastFrame.current = timestamp;

      setPlayerX((currentX) => {
        const speed = config.playerSpeed * delta;
        let nextX = currentX;
        if (keysPressed.current.left) {
          nextX -= speed;
        }
        if (keysPressed.current.right) {
          nextX += speed;
        }
        const clampedX = clamp(nextX, 0, GAME_WIDTH - PLAYER_WIDTH);
        playerXRef.current = clampedX;
        return clampedX;
      });

      setItems((currentItems) => {
        const currentLevel = levelRef.current;
        const speedMultiplier = 1 + (currentLevel - 1) * 0.15;
        const nextItems: FallingItem[] = [];
        let scoreDelta = 0;
        let lifeDelta = 0;
        let caughtItem: { type: ItemType; points: number; x: number; y: number } | null = null;
        const processedIds = new Set<number>();
        let itemsCaught = 0;
        let itemsMissed = 0;

        for (const item of currentItems) {
          if (processedIds.has(item.id)) {
            continue;
          }
          
          if (scoredItemsRef.current.has(item.id)) {
            continue;
          }
          
          processedIds.add(item.id);

          const fallSpeed = ITEM_BASE_SPEED[item.type] * speedMultiplier * (delta / 16.67);
          const nextY = item.y + fallSpeed;
          const playerLeft = playerXRef.current;
          const playerRight = playerLeft + PLAYER_WIDTH;
          const playerTop = PLAYER_Y;
          const playerBottom = PLAYER_Y + PLAYER_HEIGHT;
          const itemLeft = item.x;
          const itemRight = item.x + item.size;
          const itemBottom = nextY + item.size;
          const isCaught =
            itemBottom >= playerTop &&
            nextY <= playerBottom &&
            itemRight >= playerLeft &&
            itemLeft <= playerRight;

          if (isCaught) {
            const basePoints = ITEM_SCORES[item.type];
            const comboMultiplier = Math.min(comboRef.current + 1, 5);
            const points = basePoints * comboMultiplier;
            scoreDelta += points;
            caughtItem = { type: item.type, points, x: item.x + item.size / 2, y: nextY };
            
            scoredItemsRef.current.add(item.id);
            itemsCaught++;
            
            // Increment combo and streak
            comboRef.current = comboMultiplier;
            streakRef.current++;
            
            playCatchSound(item.type);
            createParticles(item.x + item.size / 2, nextY, ITEM_COLORS[item.type]);
            
            continue;
          }

          if (nextY > GAME_HEIGHT) {
            lifeDelta -= 1;
            itemsMissed++;
            
            // Reset combo on miss
            comboRef.current = 0;
            
            playMissSound();
            continue;
          }

          nextItems.push({ ...item, y: nextY });
        }

        if (scoreDelta > 0) {
          const newScore = scoreRef.current + scoreDelta;
          scoreRef.current = newScore;
          setScore(newScore);
          setCombo(comboRef.current);
          setStreak(streakRef.current);
          
          // Update high score
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('catchGameHighScore', newScore.toString());
          }
          
          const nextLevel = getLevelFromScore(newScore, difficulty);
          if (nextLevel !== levelRef.current) {
            levelRef.current = nextLevel;
            setLevel(nextLevel);
            playLevelUpSound();
          }
          
          if (caughtItem) {
            setLastCatch(caughtItem);
            if (catchTimeoutRef.current) {
              clearTimeout(catchTimeoutRef.current);
            }
            catchTimeoutRef.current = setTimeout(() => {
              setLastCatch(null);
            }, 800);
          }
        }

        if (itemsCaught > 0 || itemsMissed > 0) {
          setGameStats(prev => ({
            totalCaught: prev.totalCaught + itemsCaught,
            totalMissed: prev.totalMissed + itemsMissed,
            bestCombo: Math.max(prev.bestCombo, comboRef.current),
          }));
        }

        if (lifeDelta < 0) {
          // Trigger screen shake
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);
          
          setLives((currentLives) => {
            const updatedLives = currentLives + lifeDelta;
            if (updatedLives <= 0) {
              setGameOver(true);
              playGameOverSound();
              return 0;
            }
            return updatedLives;
          });
        }

        return nextItems;
      });

      spawnTimer.current += delta;
      if (spawnTimer.current >= getSpawnInterval(levelRef.current, difficulty)) {
        spawnTimer.current = 0;
        const type = randomType();
        const size = 24 + (type === 'star' ? 4 : 0) + (type === 'golden' ? 6 : 0);
        const x = Math.random() * (GAME_WIDTH - size - 12) + 6;
        setItems((currentItems) => [
          ...currentItems,
          {
            id: nextId.current++,
            type,
            x,
            y: -size,
            size,
          },
        ]);
      }

      if (!gameOver && isRunning && !paused) {
        animationFrameId = window.requestAnimationFrame(loop);
      }
    };

    animationFrameId = window.requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [gameOver, gameStarted, paused, difficulty, highScore]);

  return (
    <section className="flex h-screen w-screen items-center justify-center bg-black font-mono overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'JetBrains Mono', monospace !important;
        }
        
        body {
          overflow: hidden;
        }
        
        .neon-green {
          color: #00ff66;
          text-shadow: 0 0 20px rgba(0, 255, 102, 0.5);
        }
        
        .neon-cyan {
          color: #00ffff;
          text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }
        
        .neon-pink {
          color: #ff0066;
          text-shadow: 0 0 20px rgba(255, 0, 102, 0.5);
        }
        
        .neon-gold {
          color: #ffd700;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }
        
        .brutalist-btn {
          background: #00ff66;
          color: #000000;
          border: 3px solid #00ff66;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.2s ease;
        }
        
        .brutalist-btn:hover {
          box-shadow: 0 0 30px rgba(0, 255, 102, 0.6);
          transform: translateY(-2px);
        }
        
        .brutalist-btn-secondary {
          background: #ff00ff;
          color: #000000;
          border: 3px solid #ff00ff;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.2s ease;
        }
        
        .brutalist-btn-secondary:hover {
          box-shadow: 0 0 30px rgba(255, 0, 255, 0.6);
          transform: translateY(-2px);
        }
        
        .brutalist-btn-danger {
          background: #ff6600;
          color: #000000;
          border: 3px solid #ff6600;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.2s ease;
        }
        
        .brutalist-btn-danger:hover {
          box-shadow: 0 0 30px rgba(255, 102, 0, 0.6);
          transform: translateY(-2px);
        }
        
        .scanline {
          position: relative;
          overflow: hidden;
        }
        
        .scanline::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          pointer-events: none;
          z-index: 10;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .screen-shake {
          animation: shake 0.5s;
        }
      `}</style>

      {!gameStarted ? (
        <div className="border-[3px] border-[#00ff66] bg-black p-12 text-center">
          <h1 className="mb-8 text-5xl font-black neon-green">CATCH THE FALLING OBJECTS</h1>
          <p className="mb-8 text-sm uppercase tracking-wider text-[#aaaaaa]">SELECT DIFFICULTY</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => startGame('easy')}
              className="brutalist-btn px-12 py-4 text-lg"
            >
              EASY - 5 LIVES
            </button>
            <button
              onClick={() => startGame('normal')}
              className="brutalist-btn-secondary px-12 py-4 text-lg"
            >
              NORMAL - 3 LIVES
            </button>
            <button
              onClick={() => startGame('hard')}
              className="brutalist-btn-danger px-12 py-4 text-lg"
            >
              HARD - 2 LIVES
            </button>
          </div>
          <div className="mt-8 text-xs uppercase tracking-wider text-[#666666]">
            <p>ARROW KEYS TO MOVE • P TO PAUSE</p>
            <p className="mt-2">COMBO MULTIPLIER UP TO x5</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={screenShake ? 'screen-shake' : ''}>
            <GameStage>
              <Scoreboard 
                score={score} 
                lives={lives} 
                level={level} 
                combo={combo}
                streak={streak}
                highScore={highScore}
              />
              <FallingItems items={items} />
              <PlayerContainer x={playerX} />

              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute w-2 h-2 rounded-full animate-ping"
                  style={{
                    left: `${particle.x}px`,
                    top: `${particle.y}px`,
                    backgroundColor: particle.color,
                    boxShadow: `0 0 10px ${particle.color}`,
                  }}
                />
              ))}

              {lastCatch && (
                <div
                  className="absolute z-30 animate-bounce"
                  style={{
                    left: `${lastCatch.x}px`,
                    top: `${lastCatch.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="border-2 border-[#00ff66] bg-black px-3 py-1 text-lg font-black neon-green">
                    +{lastCatch.points}
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-4 z-20 text-center text-xs font-bold uppercase tracking-[0.2em] neon-cyan">
                {gameOver ? 'GAME OVER - PRESS ENTER' : paused ? 'PAUSED - PRESS P' : 'USE ARROW KEYS • P TO PAUSE'}
              </div>

              {paused && !gameOver && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
                  <div className="border-[3px] border-[#00ccff] bg-black p-8 text-center">
                    <p className="mb-4 text-3xl font-black neon-cyan">PAUSED</p>
                    <p className="text-xs uppercase tracking-wider text-[#aaaaaa]">PRESS P TO RESUME</p>
                  </div>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90">
                  <div className="border-[3px] border-[#ff0066] bg-black p-8 text-center animate-pulse">
                    <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] neon-pink">GAME OVER</p>
                    <h2 className="mb-4 text-4xl font-black neon-green">SCORE: {score}</h2>
                    {score === highScore && score > 0 && (
                      <p className="mb-4 text-sm font-bold uppercase tracking-wider neon-gold">★ NEW HIGH SCORE! ★</p>
                    )}
                    <div className="mb-4 border-t-2 border-[#333333] pt-4 text-xs uppercase tracking-wider text-[#aaaaaa]">
                      <p>ITEMS CAUGHT: {gameStats.totalCaught}</p>
                      <p>ITEMS MISSED: {gameStats.totalMissed}</p>
                      <p>ACCURACY: {gameStats.totalCaught + gameStats.totalMissed > 0 
                        ? Math.round((gameStats.totalCaught / (gameStats.totalCaught + gameStats.totalMissed)) * 100) 
                        : 0}%</p>
                      <p>BEST COMBO: x{gameStats.bestCombo}</p>
                    </div>
                    <p className="text-xs uppercase tracking-wider text-[#aaaaaa]">PRESS RESTART OR ENTER</p>
                  </div>
                </div>
              )}
            </GameStage>
          </div>
          
          <button
            type="button"
            onClick={resetGame}
            className="brutalist-btn mt-6 px-8 py-3 text-sm flex items-center gap-2 justify-center"
          >
            <RotateCcw size={16} /> RESTART GAME
          </button>
        </div>
      )}
    </section>
  );
}
