import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { NewsItemData } from '../utils/newsFetcher';
import confetti from 'canvas-confetti';
import { audio } from '../utils/audio';

interface ActiveNews {
  id: string;
  data: NewsItemData;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  sliced: boolean;
  spawnTime: number;
  canvasElement?: HTMLCanvasElement;
  half1?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    clipPath: { x: number; y: number }[];
    cx: number;
    cy: number;
  };
  half2?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    clipPath: { x: number; y: number }[];
    cx: number;
    cy: number;
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

export const GameEngine: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const status = useGameStore((state) => state.status);
  const activePen = useGameStore((state) => state.activePen);
  const currentLevel = useGameStore((state) => Math.floor(state.score / 500) + 1);
  const popNews = useGameStore((state) => state.popNews);
  const addScore = useGameStore((state) => state.addScore);
  const loseLife = useGameStore((state) => state.loseLife);
  const endGame = useGameStore((state) => state.endGame);
  const updateHighestCombo = useGameStore((state) => state.updateHighestCombo);
  const incrementClickbaits = useGameStore((state) => state.incrementClickbaits);
  const setDeathReason = useGameStore((state) => state.setDeathReason);
  const triggerRedactFreeze = useGameStore((state) => state.triggerRedactFreeze);
  const clearFreeze = useGameStore((state) => state.clearFreeze);
  const activatePaywall = useGameStore((state) => state.activatePaywall);
  const consumePaywall = useGameStore((state) => state.consumePaywall);
  const spawnTrendingZone = useGameStore((state) => state.spawnTrendingZone);
  const clearTrendingZone = useGameStore((state) => state.clearTrendingZone);
  const spawnBoss = useGameStore((state) => state.spawnBoss);
  const damageBoss = useGameStore((state) => state.damageBoss);
  const defeatBoss = useGameStore((state) => state.defeatBoss);
  const previousLevelRef = useRef(1);
  const statusRef = useRef(status);

  const activeNewsRef = useRef<ActiveNews[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<Point[]>([]);
  const projectilesRef = useRef<
    { x: number; y: number; targetX: number; targetY: number; progress: number }[]
  >([]);
  const isPointerDownRef = useRef(false);
  const comboCountRef = useRef(0);

  interface FloatingText {
    id: string;
    x: number;
    y: number;
    text: string;
    life: number;
    maxLife: number;
    color: string;
  }
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lastSpawnTimeRef = useRef(0);
  const reqRef = useRef<number>(0);
  const dprRef = useRef(1);
  const viewportRef = useRef({ w: 0, h: 0 });
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const noisePatternRef = useRef<CanvasPattern | null>(null);
  const bgCacheRef = useRef<{ w: number; h: number; level: number; gradient: CanvasGradient | null }>({
    w: 0,
    h: 0,
    level: 0,
    gradient: null,
  });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status === 'playing' && currentLevel > previousLevelRef.current) {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        floatingTextsRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          x: clientWidth / 2,
          y: clientHeight / 2,
          text: `NEWS CYCLE ${currentLevel}`,
          life: 2000,
          maxLife: 2000,
          color: '#ff2a00',
        });
      }
      previousLevelRef.current = currentLevel;
    } else if (status === 'start') {
      previousLevelRef.current = 1;
    }
  }, [currentLevel, status]);

  const GRAVITY = 0.3 + (currentLevel - 1) * 0.05;
  const SPAWN_INTERVAL = Math.max(400, 1200 - (currentLevel - 1) * 150);
  const TRAIL_LIFETIME = 150;

  const createCardCanvas = (
    data: NewsItemData,
    width: number,
    height: number
  ): HTMLCanvasElement => {
    const offCanvas = document.createElement('canvas');
    // High DPI scaling for sharp text
    const dpr = window.devicePixelRatio || 1;
    offCanvas.width = width * dpr;
    offCanvas.height = height * dpr;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return offCanvas;

    ctx.scale(dpr, dpr);

    const isBomb = data.type === 'bomb';
    const isBreaking = data.type === 'breaking';
    const isClickbait = data.type === 'clickbait';
    const isMini = data.type === 'mini-clickbait';
    const isPaywall = data.type === 'paywall';

    // Magazine style solid backgrounds
    ctx.fillStyle = isBomb
      ? '#ff2a00'
      : isBreaking
        ? '#ffb800'
        : isClickbait
          ? '#ffff00'
          : isMini
            ? '#ff2a00'
            : isPaywall
              ? '#22c55e'
              : '#f4f0e6';
    ctx.fillRect(0, 0, width, height);

    // Thick brutalist border
    ctx.lineWidth = 4;
    ctx.strokeStyle = isClickbait ? '#ff2a00' : isPaywall ? '#166534' : '#000000';
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // Header separator line
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(width, 36);
    ctx.stroke();

    ctx.textBaseline = 'top';

    // Source Header
    ctx.fillStyle = isBomb || isBreaking || isClickbait || isMini ? '#000000' : '#0044ff';
    ctx.font = isMini
      ? 'bold 10px "JetBrains Mono", monospace'
      : 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(data.source.toUpperCase(), isMini ? 4 : 12, isMini ? 4 : 12);

    if (isBomb) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(width - 86, 4, 82, 28);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'right';

      // Standard bomb SVG path from MDI
      ctx.save();
      ctx.translate(width - 82, 9);
      ctx.scale(0.8, 0.8);
      const mdiBomb = new Path2D(
        'M11.25 6a3.25 3.25 0 0 1 3.25-3.25A3.25 3.25 0 0 1 17.75 6c0 .42.33.75.75.75s.75-.33.75-.75v-.75h1.5V6a2.25 2.25 0 0 1-2.25 2.25A2.25 2.25 0 0 1 16.25 6a1.75 1.75 0 0 0-1.75-1.75A1.75 1.75 0 0 0 12.75 6H14v1.29c2.89.86 5 3.54 5 6.71a7 7 0 0 1-7 7a7 7 0 0 1-7-7c0-3.17 2.11-5.85 5-6.71V6zM22 6h2v1h-2zm-3-2V2h1v2zm1.91.38l1.42-1.42l.71.71l-1.42 1.42z'
      );
      ctx.fill(mdiBomb);
      ctx.restore();

      ctx.fillText('SATIRE', width - 12, 12);
      ctx.textAlign = 'left';
    } else if (isBreaking) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(width - 100, 4, 96, 28);
      ctx.fillStyle = '#ffb800';
      ctx.textAlign = 'right';

      ctx.save();
      ctx.translate(width - 85, 9);
      ctx.scale(0.8, 0.8);
      const mdiLightning = new Path2D('M11 15H6l7-14v8h5l-7 14v-8z');
      ctx.fill(mdiLightning);
      ctx.restore();

      ctx.fillText('BREAKING', width - 12, 12);
      ctx.textAlign = 'left';
    } else if (isClickbait) {
      ctx.fillStyle = '#ff2a00';
      ctx.fillRect(width - 110, 4, 106, 28);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';

      ctx.save();
      ctx.translate(width - 98, 9);
      ctx.scale(0.8, 0.8);
      const mdiFire = new Path2D(
        'M17.5 11.25c.5-1.5-.25-3-.25-3s-.5 1-1.25 1.5c-1.5-1.75-3.5-3.25-3.5-6.75c0 0-.25 2-1.5 3.5c-1.25 1.5-3.5 2.5-3.5 6.5c0 3.5 2.5 6.5 6 6.5s6-3 6-6.5c0-1.5-.75-2.75-2-3.75z'
      );
      ctx.fill(mdiFire);
      ctx.restore();

      ctx.fillText('CLICKBAIT', width - 12, 12);
      ctx.textAlign = 'left';
    } else if (isPaywall) {
      ctx.fillStyle = '#166534';
      ctx.fillRect(width - 100, 4, 96, 28);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';

      ctx.save();
      ctx.translate(width - 85, 9);
      ctx.scale(0.8, 0.8);
      const mdiLock = new Path2D(
        'M12 17a2 2 0 0 0 2-2a2 2 0 0 0-2-2a2 2 0 0 0-2 2a2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z'
      );
      ctx.fill(mdiLock);
      ctx.restore();

      ctx.fillText('PAYWALL', width - 12, 12);
      ctx.textAlign = 'left';
    }

    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px "Playfair Display", serif';

    // Text wrapping
    const words = data.title.split(' ');
    let line = '';
    let y = isMini ? 24 : 48;
    const maxWidth = width - (isMini ? 8 : 24);
    const lineHeight = isMini ? 16 : 28;
    if (isMini) {
      ctx.font = 'bold 12px "Playfair Display", serif';
    }

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, 12, y);
        line = words[i] + ' ';
        y += lineHeight;
        if (y > height - 30) break; // limit lines
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 12, y);

    return offCanvas;
  };

  const spawnNews = (currentTime: number) => {
    if (!containerRef.current) return;
    if (useGameStore.getState().boss) return; // Stop normal spawns during boss fight
    const { clientWidth, clientHeight } = containerRef.current;

    const now = Date.now();
    const isFactCheck = now < useGameStore.getState().factCheckActiveUntil;
    const currentSpawnInterval = isFactCheck ? SPAWN_INTERVAL / 0.3 : SPAWN_INTERVAL;

    if (currentTime - lastSpawnTimeRef.current > currentSpawnInterval) {
      const newsData = popNews();
      if (newsData) {
        const isBreaking = newsData.type === 'breaking';
        const cardWidth = isBreaking ? 240 : 300;
        const cardHeight = isBreaking ? 140 : 160;

        const startX = Math.random() * (clientWidth - cardWidth) + cardWidth / 2;
        const vx = (clientWidth / 2 - startX) * 0.015 + (Math.random() - 0.5) * 4;
        // Scale velocity with level to counteract increased gravity
        const vyMultiplier = 1 + (currentLevel - 1) * 0.08;
        // Breaking news shoots up much faster
        const baseVy = isBreaking ? -22 - Math.random() * 6 : -18 - Math.random() * 4;
        const vy = baseVy * vyMultiplier;

        activeNewsRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          data: newsData,
          x: startX,
          y: clientHeight + 100,
          vx,
          vy,
          rotation: Math.random() * 360,
          rotationSpeed: isBreaking ? (Math.random() - 0.5) * 6 : (Math.random() - 0.5) * 3, // spins faster too
          width: cardWidth,
          height: cardHeight,
          sliced: false,
          spawnTime: currentTime,
          canvasElement: createCardCanvas(newsData, cardWidth, cardHeight),
        });
      }
      lastSpawnTimeRef.current = currentTime;
    }
  };

  const updatePhysics = () => {
    if (!containerRef.current) return;
    const { clientHeight } = containerRef.current;

    const now = Date.now();
    const state = useGameStore.getState();
    const isFactCheck = now < state.factCheckActiveUntil;
    const timeScale = isFactCheck ? 0.3 : 1.0;

    // Echo Chamber random trigger (cooldown 20s, duration 8s)
    if (now > state.lastEchoChamberTime + 20000 && now > state.echoChamberActiveUntil) {
      if (Math.random() < 0.005) {
        state.triggerEchoChamber();
      }
    }

    const isDeepFake = now < state.deepFakeActiveUntil;
    // Deep Fake random trigger (cooldown 25s, duration 10s)
    if (now > state.lastDeepFakeTime + 25000 && now > state.deepFakeActiveUntil && !isDeepFake) {
      if (Math.random() < 0.004) {
        state.triggerDeepFake();
      }
    }

    // Trending Zone trigger (cooldown 15s, duration 6s)
    if (now > state.lastTrendingZoneTime + 15000 && !state.trendingZone) {
      if (Math.random() < 0.01) {
        // 1% chance per frame once cooldown is up
        const { clientWidth, clientHeight } = containerRef.current;
        const width = 300;
        const height = 300;
        const padding = 50;
        // Random position, keeping it fully on screen
        const x = padding + Math.random() * (clientWidth - width - padding * 2);
        const y = padding + Math.random() * (clientHeight - height - padding * 2 - 200); // Keep it upper half mostly

        spawnTrendingZone({
          x,
          y,
          width,
          height,
          activeUntil: now + 6000,
        });
      }
    } else if (state.trendingZone && now > state.trendingZone.activeUntil) {
      clearTrendingZone();
    }

    // Boss Trigger Logic
    const bossThreshold = (state.bossesDefeated + 1) * 2000;
    if (state.score >= bossThreshold && !state.boss) {
      const { clientWidth } = containerRef.current;
      spawnBoss(clientWidth);
      activeNewsRef.current = [];
    }

    if (state.boss) {
      const { clientWidth } = containerRef.current;
      // Hover movement
      const hoverX = clientWidth / 2 + Math.sin(now / 1000) * (clientWidth * 0.25);

      // Update local state directly so we don't cause infinite re-renders in the store
      // Only dispatch to the store for major events like damage
      state.boss.x = hoverX;

      // Boss Attacks
      if (now - state.boss.lastAttackTime > 2000) {
        state.boss.lastAttackTime = now;

        for (let i = 0; i < 3; i++) {
          const typeRoll = Math.random();
          let type = 'bomb';
          if (typeRoll > 0.6) type = 'real';

          const newsData = {
            id: Math.random().toString(36).substring(2, 9),
            type,
            title: type === 'bomb' ? 'HOSTILE TAKEOVER BID' : 'COMPANY MEMO',
            source: 'BOARD OF DIRECTORS',
          };
          const cardWidth = type === 'bomb' ? 120 : 200;
          const cardHeight = type === 'bomb' ? 120 : 100;

          activeNewsRef.current.push({
            id: Math.random().toString(36).substring(2, 9),
            data: newsData as any,
            x: hoverX + (Math.random() - 0.5) * 100,
            y: state.boss.y + 60,
            vx: (Math.random() - 0.5) * 8, // Spread out
            vy: 4 + Math.random() * 4, // Drop down
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 4,
            width: cardWidth,
            height: cardHeight,
            sliced: false,
            spawnTime: now,
            canvasElement: createCardCanvas(newsData as any, cardWidth, cardHeight),
          });
        }
      }

      // Defeat Check
      if (state.boss.health <= 0) {
        defeatBoss();
        floatingTextsRef.current.push({
          id: Math.random().toString(36),
          x: clientWidth / 2,
          y: 150,
          text: 'HOSTILE TAKEOVER DEFEATED! +1000',
          life: 2000,
          maxLife: 2000,
          color: '#22c55e',
        });
      }
    }

    // Update projectiles
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
      const p = projectilesRef.current[i];
      p.progress += 0.05 * timeScale;
      if (p.progress >= 1) {
        projectilesRef.current.splice(i, 1);
        if (state.boss && state.boss.health > 0) damageBoss(1);
      }
    }

    for (let i = activeNewsRef.current.length - 1; i >= 0; i--) {
      const item = activeNewsRef.current[i];

      if (item.sliced && item.half1 && item.half2) {
        item.half1.vy += GRAVITY * timeScale;
        item.half1.x += item.half1.vx * timeScale;
        item.half1.y += item.half1.vy * timeScale;
        item.half1.rotation += item.half1.rotationSpeed * timeScale;

        item.half2.vy += GRAVITY * timeScale;
        item.half2.x += item.half2.vx * timeScale;
        item.half2.y += item.half2.vy * timeScale;
        item.half2.rotation += item.half2.rotationSpeed * timeScale;

        if (item.half1.y > clientHeight + 200 && item.half2.y > clientHeight + 200) {
          activeNewsRef.current.splice(i, 1);
        }
      } else {
        item.vy += GRAVITY * timeScale;
        item.x += item.vx * timeScale;
        item.y += item.vy * timeScale;
        item.rotation += item.rotationSpeed * timeScale;

        // Wall bouncing during Deep Fake
        if (isDeepFake && containerRef.current) {
          const { clientWidth } = containerRef.current;
          const hw = item.width / 2;
          if (item.x - hw < 0) {
            item.x = hw;
            item.vx *= -1;
          } else if (item.x + hw > clientWidth) {
            item.x = clientWidth - hw;
            item.vx *= -1;
          }
        }

        if (item.y > clientHeight + 200 && item.vy > 0) {
          // Only penalize for missing real/breaking/clickbait. Mini-clickbait is just bonus points.
          if (
            !item.sliced &&
            (item.data.type === 'real' ||
              item.data.type === 'breaking' ||
              item.data.type === 'clickbait')
          ) {
            if (item.data.type === 'clickbait') incrementClickbaits();
            audio.playDrop();
            loseLife();
          }
          activeNewsRef.current.splice(i, 1);
        }
      }
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.vy += GRAVITY * 0.5 * timeScale;
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.life -= 16 * timeScale;
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }

    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
      const t = floatingTextsRef.current[i];
      t.y -= 2 * timeScale; // Float up
      t.life -= 16 * timeScale;
      if (t.life <= 0) {
        floatingTextsRef.current.splice(i, 1);
      }
    }
  };

  const drawCanvas = (currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = viewportRef.current;
    const dpr = dprRef.current;

    const now = Date.now();
    const state = useGameStore.getState();
    const isFactCheck = now < state.factCheckActiveUntil;
    const isDeepFake = now < state.deepFakeActiveUntil;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (isDeepFake) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    if (
      bgCacheRef.current.w !== w ||
      bgCacheRef.current.h !== h ||
      bgCacheRef.current.level !== currentLevel ||
      !bgCacheRef.current.gradient
    ) {
      const bg = ctx.createRadialGradient(w * 0.2, h * 0.12, 0, w * 0.25, h * 0.22, Math.max(w, h));

      // Shift colors based on level (1 to 5+)
      let color1 = 'rgba(59, 130, 246, 0.14)'; // blue
      let color2 = 'rgba(251, 191, 36, 0.06)'; // yellow
      let color3 = 'rgba(0, 0, 0, 0.01)'; // Slight non-zero alpha to prevent harsh cutoff

      if (currentLevel === 2) {
        color1 = 'rgba(147, 51, 234, 0.15)'; // purple
        color2 = 'rgba(249, 115, 22, 0.08)'; // orange
      } else if (currentLevel === 3) {
        color1 = 'rgba(220, 38, 38, 0.15)'; // red
        color2 = 'rgba(234, 88, 12, 0.1)'; // dark orange
      } else if (currentLevel >= 4) {
        color1 = 'rgba(153, 27, 27, 0.2)'; // dark red
        color2 = 'rgba(0, 0, 0, 0.15)'; // blackish
        color3 = 'rgba(0, 0, 0, 0.05)';
      }

      bg.addColorStop(0, color1);
      bg.addColorStop(0.55, color2);
      bg.addColorStop(1, color3);
      bgCacheRef.current = { w, h, level: currentLevel, gradient: bg };
    }
    
    ctx.fillStyle = bgCacheRef.current.gradient!;
    ctx.fillRect(0, 0, w, h);

    if (noiseCanvasRef.current) {
      if (!noisePatternRef.current) {
        noisePatternRef.current = ctx.createPattern(noiseCanvasRef.current, 'repeat');
      }
      if (noisePatternRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.11;
        ctx.fillStyle = noisePatternRef.current;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    if (isFactCheck) {
      // Dramatic dark filter
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, w, h);

      // Fact check watermark
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.font = '900 120px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FACT CHECKING', 0, 0);
      ctx.restore();
    }

    // Draw Projectiles
    if (projectilesRef.current.length > 0) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      projectilesRef.current.forEach((p) => {
        const currentX = p.x + (p.targetX - p.x) * p.progress;
        const currentY = p.y + (p.targetY - p.y) * p.progress;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(currentX, currentY);
      });
      ctx.stroke();
    }

    activeNewsRef.current.forEach((item) => {
      if (!item.canvasElement) return;

      const drawHalf = (half: any, clipPath: { x: number; y: number }[]) => {
        ctx.save();

        ctx.translate(half.x, half.y);
        ctx.rotate((half.rotation * Math.PI) / 180);

        ctx.translate(-half.cx, -half.cy);

        ctx.beginPath();
        if (clipPath.length > 0) {
          ctx.moveTo(clipPath[0].x, clipPath[0].y);
          for (let i = 1; i < clipPath.length; i++) {
            ctx.lineTo(clipPath[i].x, clipPath[i].y);
          }
          ctx.closePath();
          ctx.clip();
        }

        ctx.drawImage(
          item.canvasElement!,
          -item.width / 2,
          -item.height / 2,
          item.width,
          item.height
        );

        // Draw slice edge
        if (clipPath.length > 0) {
          ctx.strokeStyle = '#ffb800'; // --nn-gold
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        ctx.restore();
      };

      if (item.sliced && item.half1 && item.half2) {
        drawHalf(item.half1, item.half1.clipPath);
        drawHalf(item.half2, item.half2.clipPath);
      } else if (!item.sliced || item.data.type === 'bomb') {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.drawImage(
          item.canvasElement,
          -item.width / 2,
          -item.height / 2,
          item.width,
          item.height
        );
        ctx.restore();
      }
    });

    const isFrozen = now < state.freezeActiveUntil;
    if (isFrozen && state.redactedItem) {
      const ri = state.redactedItem;
      ctx.save();
      ctx.translate(ri.x, ri.y);
      ctx.rotate((ri.rotation * Math.PI) / 180);

      // Glitch offset
      const gx = (Math.random() - 0.5) * 10;
      const gy = (Math.random() - 0.5) * 10;

      // Giant black redaction bar
      ctx.fillStyle = '#000000';
      ctx.fillRect(-ri.width / 2 - 20 + gx, -ri.height / 4 + gy, ri.width + 40, ri.height / 2);

      // Redacted text
      ctx.fillStyle = '#ff2a00';
      ctx.font = '900 48px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Glitchy double draw
      ctx.fillText('REDACTED', gx, gy);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('REDACTED', gx - 4, gy - 4);

      ctx.restore();

      // Full screen red flash overlay
      ctx.fillStyle = `rgba(255, 42, 0, ${Math.random() * 0.3})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (isDeepFake) {
      ctx.save();
      // Un-invert just the text so it's readable
      ctx.translate(w, 0);
      ctx.scale(-1, 1);

      // Invert colors filter (fake CSS invert by drawing a difference rect)
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      ctx.fillStyle = 'rgba(255, 42, 0, 0.8)';
      ctx.font = '900 40px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEEP FAKE DETECTED', w / 2, h / 2 - 20);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText('SENSORS INVERTED', w / 2, h / 2 + 30);
      ctx.restore();
    }

    // Draw Trending Zone
    const zone = state.trendingZone;
    if (zone && now < zone.activeUntil) {
      ctx.save();

      // If Deep Fake is active, the context is already inverted!
      // We need to un-invert for the text so it's readable, just like we did for the Deep Fake warning
      if (isDeepFake) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }

      const timeRemaining = zone.activeUntil - now;
      const alpha = Math.min(1, timeRemaining / 1000); // Fade out at end
      ctx.globalAlpha = alpha;

      // Calculate the "real" coordinates based on whether we are inverted or not
      const drawX = isDeepFake ? w - zone.x - zone.width : zone.x;
      const drawY = zone.y;

      // Pulse background
      const pulse = Math.abs(Math.sin(now / 150));
      ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + pulse * 0.1})`;
      ctx.fillRect(drawX, drawY, zone.width, zone.height);

      // Dashed border
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 10]);
      ctx.lineDashOffset = -now / 20; // Marching ants
      ctx.strokeRect(drawX, drawY, zone.width, zone.height);

      // Text
      ctx.setLineDash([]);
      ctx.fillStyle = '#000000';
      ctx.fillRect(drawX - 4, drawY - 30, 200, 34);

      ctx.fillStyle = '#00ffff';
      ctx.font = '900 24px "Anton", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('TRENDING TOPIC', drawX + 8, drawY - 26);

      ctx.restore();
    }

    // Draw Echo Chamber Fog of War
    const isEchoChamber = now < state.echoChamberActiveUntil;
    if (isEchoChamber && !isFactCheck) {
      // Fact check pierces the fog!
      const cx = w / 2;
      const cy = h / 2;

      // Pulse radius between 0.2 and 0.3 of screen width
      const pulse = Math.sin(now / 200) * 0.05;
      const baseRadius = Math.min(w, h);
      const innerRadius = baseRadius * (0.2 + pulse);
      const outerRadius = baseRadius * 0.8;

      const fog = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
      fog.addColorStop(0, 'rgba(0, 0, 0, 0)');
      fog.addColorStop(0.5, 'rgba(0, 0, 0, 0.85)');
      fog.addColorStop(1, 'rgba(0, 0, 0, 0.98)');

      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);

      // Overlay noise on the dark areas
      if (noisePatternRef.current) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = noisePatternRef.current;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      // Dramatic text warning in the middle of the fog
      ctx.fillStyle = 'rgba(255, 42, 0, 0.3)';
      ctx.font = '900 60px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ECHO CHAMBER ACTIVE', cx, cy - 100);
    }

    // Draw Boss
    if (state.boss) {
      const b = state.boss;
      ctx.save();

      // Calculate the visual X. If Deep Fake is active, the entire canvas is inverted.
      if (isDeepFake) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }

      const drawX = isDeepFake ? w - b.x : b.x;
      const drawY = b.y;

      ctx.translate(drawX, drawY);

      // Jitter if hit recently (projectiles flying)
      const isHit = projectilesRef.current.some((p) => p.progress > 0.8);
      if (isHit) {
        ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      }

      // Main Boss Card
      ctx.fillStyle = '#000000';
      ctx.fillRect(-b.width / 2 + 8, -b.height / 2 + 8, b.width, b.height); // Shadow

      ctx.fillStyle = '#ff2a00';
      ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 40px "Anton", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HOSTILE TAKEOVER', 0, 0);

      // Health Bar
      const hpWidth = b.width * 0.8;
      const hpPercent = b.health / b.maxHealth;
      ctx.fillStyle = '#000000';
      ctx.fillRect(-hpWidth / 2, b.height / 2 + 20, hpWidth, 14);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-hpWidth / 2 + 2, b.height / 2 + 22, (hpWidth - 4) * hpPercent, 10);

      ctx.restore();
    }

    trailRef.current = trailRef.current.filter((p) => currentTime - p.time < TRAIL_LIFETIME);

    if (trailRef.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
      for (let i = 1; i < trailRef.current.length; i++) {
        const p = trailRef.current[i];
        ctx.lineTo(p.x, p.y);
      }

      const pen = activePen || { id: 'default' };
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (pen.id === 'default') {
        ctx.strokeStyle = isFactCheck
          ? '#00ffff'
          : comboCountRef.current >= 2
            ? '#ff2a00'
            : '#ffb800';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (pen.id === 'red') {
        ctx.strokeStyle = '#ff2a00';
        ctx.lineWidth = 12;
        ctx.stroke();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (pen.id === 'highlighter') {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.lineWidth = 24;
        ctx.stroke();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 6;
        ctx.stroke();
      } else if (pen.id === 'glitch') {
        ctx.strokeStyle = '#ffb800';
        ctx.lineWidth = 10;
        ctx.setLineDash([10, 10, 5, 20]); // Glitchy dashed line
        ctx.lineDashOffset = -now / 10;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    particlesRef.current.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;

      // Draw sharp squares
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 0.02); // Add a dynamic spin
      const s = p.size;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset transform
    });

    // Draw floating combo texts
    floatingTextsRef.current.forEach((t) => {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = '#000000'; // shadow
      ctx.font = '900 48px "Anton", sans-serif';
      ctx.textAlign = 'center';

      // Draw brutalist shadow offset
      ctx.fillText(t.text, t.x + 4, t.y + 4);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);

      // White outline to pop
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeText(t.text, t.x, t.y);
    });

    ctx.globalAlpha = 1.0;
  };

  const checkSlices = () => {
    if (trailRef.current.length < 2) return;

    const p1 = trailRef.current[trailRef.current.length - 2];
    const p2 = trailRef.current[trailRef.current.length - 1];

    activeNewsRef.current.forEach((item) => {
      if (item.sliced) return;

      const left = item.x - item.width / 2;
      const right = item.x + item.width / 2;
      const top = item.y - item.height / 2;
      const bottom = item.y + item.height / 2;

      const padding = 20;
      const hit = lineIntersectsRect(p1, p2, {
        left: left - padding,
        right: right + padding,
        top: top - padding,
        bottom: bottom + padding,
      });

      if (hit) {
        sliceItem(item, p1, p2);
      }
    });
  };

  const sliceItem = (item: ActiveNews, p1: Point, p2: Point) => {
    item.sliced = true;

    let color = '#000000';
    if (item.data.type === 'bomb') color = '#ff2a00';
    if (item.data.type === 'breaking') color = '#ffb800'; // Gold particles
    if (item.data.type === 'paywall') color = '#22c55e';

    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: item.x,
        y: item.y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color,
        size: Math.random() * 6 + 4,
      });
    }

    if (item.data.type === 'bomb') {
      comboCountRef.current = 0;
      audio.playBomb();

      if (consumePaywall()) {
        floatingTextsRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          x: item.x,
          y: item.y,
          text: 'SHIELD BROKEN!',
          life: 1500,
          maxLife: 1500,
          color: '#22c55e',
        });

        // Don't freeze or end game, just return early and let it split
        item.half1 = {
          x: item.x - 10,
          y: item.y,
          vx: item.vx - 3,
          vy: item.vy,
          rotation: item.rotation,
          rotationSpeed: item.rotationSpeed - 5,
          clipPath: [
            { x: -item.width / 2, y: -item.height / 2 },
            { x: 0, y: -item.height / 2 },
            { x: 0, y: item.height / 2 },
            { x: -item.width / 2, y: item.height / 2 },
          ],
          cx: -item.width / 4,
          cy: 0,
        };
        item.half2 = {
          x: item.x + 10,
          y: item.y,
          vx: item.vx + 3,
          vy: item.vy,
          rotation: item.rotation,
          rotationSpeed: item.rotationSpeed + 5,
          clipPath: [
            { x: 0, y: -item.height / 2 },
            { x: item.width / 2, y: -item.height / 2 },
            { x: item.width / 2, y: item.height / 2 },
            { x: 0, y: item.height / 2 },
          ],
          cx: item.width / 4,
          cy: 0,
        };
        return;
      }

      setDeathReason(`Published Satire: "${item.data.title}"`);

      triggerRedactFreeze({
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        width: item.width,
        height: item.height,
      });

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ff2a00', '#000000', '#ffb800'],
        shapes: ['square'],
      });
    } else {
      comboCountRef.current += 1;
      const currentCombo = comboCountRef.current;
      updateHighestCombo(currentCombo);

      let basePoints = 10;
      let isPowerup = false;

      const state = useGameStore.getState();
      if (state.boss && (item.data.type === 'real' || item.data.type === 'breaking')) {
        projectilesRef.current.push({
          x: item.x,
          y: item.y,
          targetX: state.boss.x,
          targetY: state.boss.y,
          progress: 0,
        });
      }

      if (item.data.type === 'breaking') {
        basePoints = 50;
        isPowerup = true;
      }
      if (item.data.type === 'clickbait') basePoints = 0; // clickbait itself gives 0, mini cards give points
      if (item.data.type === 'mini-clickbait') basePoints = 5;
      if (item.data.type === 'paywall') {
        basePoints = 20;
        activatePaywall();
        isPowerup = true;
      }

      if (isPowerup) {
        audio.playPowerup();
      } else if (item.data.type !== 'clickbait') {
        audio.playSlice(currentCombo);
      }

      // Check Trending Zone
      const zone = useGameStore.getState().trendingZone;
      let inZone = false;
      if (zone && Date.now() < zone.activeUntil) {
        if (
          item.x >= zone.x &&
          item.x <= zone.x + zone.width &&
          item.y >= zone.y &&
          item.y <= zone.y + zone.height
        ) {
          inZone = true;
          basePoints *= 3;
        }
      }

      const points = basePoints * currentCombo;
      if (points > 0) {
        addScore(points);
      }

      if (inZone && points > 0) {
        floatingTextsRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          x: item.x,
          y: item.y - 40,
          text: `TREND SURFER! x3`,
          life: 1500,
          maxLife: 1500,
          color: '#00ffff',
        });
      }

      // Spawn floating combo text if combo > 1 and it's not a 0-point clickbait container
      if (currentCombo > 1 && points > 0) {
        let comboWord = 'DOUBLE!';
        if (currentCombo === 3) comboWord = 'TRIPLE!';
        if (currentCombo >= 4) comboWord = 'FRENZY!';

        floatingTextsRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          x: item.x,
          y: item.y,
          text: `x${currentCombo} ${comboWord}`,
          life: 1000,
          maxLife: 1000,
          color: currentCombo >= 4 ? '#ff2a00' : '#ffb800',
        });
      }

      const hw = item.width / 2;
      const hh = item.height / 2;

      const tx1 = p1.x - item.x;
      const ty1 = p1.y - item.y;
      const tx2 = p2.x - item.x;
      const ty2 = p2.y - item.y;

      const rad = -(item.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const lx1 = tx1 * cos - ty1 * sin;
      const ly1 = tx1 * sin + ty1 * cos;
      const lx2 = tx2 * cos - ty2 * sin;
      const ly2 = tx2 * sin + ty2 * cos;

      // Clickbait Swarm Logic
      if (item.data.type === 'clickbait') {
        const currentTime = performance.now();
        // Spawn 6 mini-cards flying outwards
        for (let j = 0; j < 6; j++) {
          const angle = (Math.PI * 2 * j) / 6;
          const speed = 8 + Math.random() * 6;
          const miniData = {
            ...item.data,
            type: 'mini-clickbait' as const,
            title: "YOU WON'T BELIEVE THIS!",
          };

          // Add a slight random offset so they don't spawn exactly on top of each other
          const offsetX = (Math.random() - 0.5) * 60;
          const offsetY = (Math.random() - 0.5) * 60;

          activeNewsRef.current.push({
            id: Math.random().toString(36).substring(2, 9),
            data: miniData,
            x: item.x + offsetX,
            y: item.y + offsetY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 5,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15,
            width: 100,
            height: 60,
            sliced: false,
            spawnTime: currentTime,
            canvasElement: createCardCanvas(miniData, 100, 60),
          });
        }

        // Don't split the clickbait card, just destroy it
        return;
      }

      const dx = lx2 - lx1;
      const dy = ly2 - ly1;

      if (dx === 0 && dy === 0) {
        item.half1 = {
          x: item.x - 10,
          y: item.y,
          vx: item.vx - 3,
          vy: item.vy,
          rotation: item.rotation,
          rotationSpeed: item.rotationSpeed - 5,
          clipPath: [
            { x: -hw, y: -hh },
            { x: 0, y: -hh },
            { x: 0, y: hh },
            { x: -hw, y: hh },
          ],
          cx: -hw / 2,
          cy: 0,
        };
        item.half2 = {
          x: item.x + 10,
          y: item.y,
          vx: item.vx + 3,
          vy: item.vy,
          rotation: item.rotation,
          rotationSpeed: item.rotationSpeed + 5,
          clipPath: [
            { x: 0, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: 0, y: hh },
          ],
          cx: hw / 2,
          cy: 0,
        };
        return;
      }

      const intersections: { x: number; y: number }[] = [];

      const intersect = (x3: number, y3: number, x4: number, y4: number) => {
        const den = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          x3: number,
          y3: number,
          x4: number,
          y4: number
        ) => (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        const d = den(lx1, ly1, lx2, ly2, x3, y3, x4, y4);
        if (d === 0) return null;

        const t = ((lx1 - x3) * (y3 - y4) - (ly1 - y3) * (x3 - x4)) / d;
        const u = -((lx1 - lx2) * (ly1 - y3) - (ly1 - ly2) * (lx1 - x3)) / d;

        if (u >= 0 && u <= 1) {
          return {
            x: lx1 + t * (lx2 - lx1),
            y: ly1 + t * (ly2 - ly1),
          };
        }
        return null;
      };

      const topInt = intersect(-hw, -hh, hw, -hh);
      if (topInt) intersections.push(topInt);
      const bottomInt = intersect(-hw, hh, hw, hh);
      if (bottomInt) intersections.push(bottomInt);
      const leftInt = intersect(-hw, -hh, -hw, hh);
      if (leftInt) intersections.push(leftInt);
      const rightInt = intersect(hw, -hh, hw, hh);
      if (rightInt) intersections.push(rightInt);

      const uniqueInts = intersections.filter(
        (v, i, a) =>
          a.findIndex((t) => Math.abs(t.x - v.x) < 0.1 && Math.abs(t.y - v.y) < 0.1) === i
      );

      let clip1: { x: number; y: number }[] = [];
      let clip2: { x: number; y: number }[] = [];
      let cx1 = 0,
        cy1 = 0;
      let cx2 = 0,
        cy2 = 0;

      const getCentroid = (pts: { x: number; y: number }[]) => {
        const first = pts[0],
          last = pts[pts.length - 1];
        if (first.x !== last.x || first.y !== last.y) pts.push(first);
        let twicearea = 0,
          x = 0,
          y = 0,
          nPts = pts.length,
          p1,
          p2,
          f;
        for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
          p1 = pts[i];
          p2 = pts[j];
          f = p1.x * p2.y - p2.x * p1.y;
          twicearea += f;
          x += (p1.x + p2.x) * f;
          y += (p1.y + p2.y) * f;
        }
        f = twicearea * 3;
        pts.pop();
        if (f === 0) return { x: 0, y: 0 };
        return { x: x / f, y: y / f };
      };

      if (uniqueInts.length === 2) {
        const [i1, i2] = uniqueInts;

        const corners = [
          { x: -hw, y: -hh },
          { x: hw, y: -hh },
          { x: hw, y: hh },
          { x: -hw, y: hh },
        ];

        const isLeftOfLine = (p: { x: number; y: number }) => {
          return (p.x - i1.x) * (i2.y - i1.y) - (p.y - i1.y) * (i2.x - i1.x) > 0;
        };

        corners.forEach((c) => {
          if (isLeftOfLine(c)) {
            clip1.push(c);
          } else {
            clip2.push(c);
          }
        });

        clip1.push(i1, i2);
        clip2.push(i1, i2);

        const sortPoly = (poly: { x: number; y: number }[]) => {
          const cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
          const cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
          return poly.sort(
            (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
          );
        };

        clip1 = sortPoly(clip1);
        clip2 = sortPoly(clip2);

        const cent1 = getCentroid([...clip1]);
        const cent2 = getCentroid([...clip2]);
        cx1 = cent1.x;
        cy1 = cent1.y;
        cx2 = cent2.x;
        cy2 = cent2.y;
      } else {
        clip1 = [
          { x: -hw, y: -hh },
          { x: 0, y: -hh },
          { x: 0, y: hh },
          { x: -hw, y: hh },
        ];
        clip2 = [
          { x: 0, y: -hh },
          { x: hw, y: -hh },
          { x: hw, y: hh },
          { x: 0, y: hh },
        ];
        cx1 = -hw / 2;
        cy1 = 0;
        cx2 = hw / 2;
        cy2 = 0;
      }

      const gdx = p2.x - p1.x;
      const gdy = p2.y - p1.y;
      const len = Math.sqrt(gdx * gdx + gdy * gdy) || 1;

      const nx = -gdy / len;
      const ny = gdx / len;

      const pushForce = 4 + Math.random() * 2;

      const rotSpeed1 = (nx * cy1 - ny * cx1) * 0.1;
      const rotSpeed2 = (nx * cy2 - ny * cx2) * 0.1;

      item.half1 = {
        x: item.x + cx1 + nx * pushForce,
        y: item.y + cy1 + ny * pushForce,
        vx: item.vx + nx * pushForce * 0.5,
        vy: item.vy + ny * pushForce * 0.5,
        rotation: item.rotation,
        rotationSpeed: item.rotationSpeed + rotSpeed1,
        clipPath: clip1,
        cx: cx1,
        cy: cy1,
      };

      item.half2 = {
        x: item.x + cx2 - nx * pushForce,
        y: item.y + cy2 - ny * pushForce,
        vx: item.vx - nx * pushForce * 0.5,
        vy: item.vy - ny * pushForce * 0.5,
        rotation: item.rotation,
        rotationSpeed: item.rotationSpeed + rotSpeed2,
        clipPath: clip2,
        cx: cx2,
        cy: cy2,
      };
    }
  };

  const lineIntersectsRect = (
    p1: Point,
    p2: Point,
    rect: { left: number; right: number; top: number; bottom: number }
  ) => {
    const isInside = (p: Point) =>
      p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom;
    if (isInside(p1) || isInside(p2)) return true;

    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    if (maxX < rect.left || minX > rect.right || maxY < rect.top || minY > rect.bottom) {
      return false;
    }

    return true;
  };

  const loop = (time: number) => {
    if (statusRef.current === 'playing') {
      const state = useGameStore.getState();
      const isFrozen = Date.now() < state.freezeActiveUntil;

      // If freeze just ended, trigger game over
      if (!isFrozen && state.redactedItem) {
        clearFreeze();
        endGame();
      }

      if (!isFrozen) {
        spawnNews(time);
        updatePhysics();
        checkSlices();
      }
    }
    drawCanvas(time);
    reqRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (status === 'playing') {
      activeNewsRef.current = [];
      particlesRef.current = [];
      trailRef.current = [];
      floatingTextsRef.current = [];
      comboCountRef.current = 0;
      lastSpawnTimeRef.current = performance.now();
    }
  }, [status]);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        dprRef.current = dpr;
        viewportRef.current = { w, h };
        canvasRef.current.width = Math.floor(w * dpr);
        canvasRef.current.height = Math.floor(h * dpr);
        canvasRef.current.style.width = `${w}px`;
        canvasRef.current.style.height = `${h}px`;
        noisePatternRef.current = null;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const n = document.createElement('canvas');
    n.width = 220;
    n.height = 220;
    const ctx = n.getContext('2d');
    if (ctx) {
      const img = ctx.createImageData(n.width, n.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(Math.random() * 255);
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = Math.random() > 0.55 ? 20 : 0;
      }
      ctx.putImageData(img, 0, 0);
    }
    noiseCanvasRef.current = n;
  }, []);

  const getMappedX = (clientX: number) => {
    const isDeepFake = Date.now() < useGameStore.getState().deepFakeActiveUntil;
    if (isDeepFake && containerRef.current) {
      return containerRef.current.clientWidth - clientX;
    }
    return clientX;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    trailRef.current.push({ x: getMappedX(e.clientX), y: e.clientY, time: performance.now() });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    trailRef.current.push({ x: getMappedX(e.clientX), y: e.clientY, time: performance.now() });
    audio.playSwing();
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    comboCountRef.current = 0;
  };

  const isFrozen = useGameStore((state) => Date.now() < state.freezeActiveUntil);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden touch-none select-none ${isFrozen ? 'animate-intense-shake' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
    </div>
  );
};
