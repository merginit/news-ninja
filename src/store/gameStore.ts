import { create } from 'zustand';
import { fetchNewsFeeds, NewsItemData } from '../utils/newsFetcher';
import { PenStyle, PENS } from '../utils/highScores';

export interface TrendingZone {
  x: number;
  y: number;
  width: number;
  height: number;
  activeUntil: number;
}

export interface BossState {
  active: boolean;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  lastAttackTime: number;
}

interface GameState {
  status: 'start' | 'playing' | 'gameover';
  score: number;
  lives: number;
  newsQueue: NewsItemData[];
  isLoadingNews: boolean;
  factCheckActiveUntil: number;
  factCheckReadyAt: number;
  echoChamberActiveUntil: number;
  lastEchoChamberTime: number;
  deepFakeActiveUntil: number;
  lastDeepFakeTime: number;
  highestCombo: number;
  clickbaitsFallenFor: number;
  deathReason: string | null;
  freezeActiveUntil: number;
  redactedItem: { x: number; y: number; rotation: number; width: number; height: number } | null;
  paywallShields: number;
  trendingZone: TrendingZone | null;
  lastTrendingZoneTime: number;
  activePen: PenStyle;
  boss: BossState | null;
  bossesDefeated: number;
  customFeedUrl: string | null;
  isPaused: boolean;
  setCustomFeedUrl: (url: string | null) => void;
  togglePause: () => void;
  startGame: () => void;
  endGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  fetchInitialNews: () => Promise<void>;
  popNews: () => NewsItemData | null;
  resetGame: () => void;
  activateFactCheck: () => void;
  triggerEchoChamber: () => void;
  triggerDeepFake: () => void;
  updateHighestCombo: (combo: number) => void;
  incrementClickbaits: () => void;
  setDeathReason: (reason: string) => void;
  triggerRedactFreeze: (item: {
    x: number;
    y: number;
    rotation: number;
    width: number;
    height: number;
  }) => void;
  clearFreeze: () => void;
  activatePaywall: () => void;
  consumePaywall: () => boolean;
  spawnTrendingZone: (zone: TrendingZone) => void;
  clearTrendingZone: () => void;
  setPen: (pen: PenStyle) => void;
  spawnBoss: (canvasWidth: number) => void;
  damageBoss: (amount: number) => void;
  defeatBoss: () => void;
  updateBossPosition: (x: number) => void;
  updateBossAttackTime: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'start',
  score: 0,
  lives: 3,
  newsQueue: [],
  isLoadingNews: false,
  factCheckActiveUntil: 0,
  factCheckReadyAt: 0,
  echoChamberActiveUntil: 0,
  lastEchoChamberTime: 0,
  deepFakeActiveUntil: 0,
  lastDeepFakeTime: 0,
  highestCombo: 0,
  clickbaitsFallenFor: 0,
  deathReason: null,
  freezeActiveUntil: 0,
  redactedItem: null,
  paywallShields: 0,
  trendingZone: null,
  lastTrendingZoneTime: 0,
  activePen: PENS[0],
  boss: null,
  bossesDefeated: 0,
  customFeedUrl: null,
  isPaused: false,

  setCustomFeedUrl: (url) => set({ customFeedUrl: url, newsQueue: [] }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  startGame: () =>
    set({
      status: 'playing',
      score: 0,
      lives: 3,
      factCheckActiveUntil: 0,
      factCheckReadyAt: 0,
      echoChamberActiveUntil: 0,
      lastEchoChamberTime: Date.now(),
      deepFakeActiveUntil: 0,
      lastDeepFakeTime: Date.now(),
      highestCombo: 0,
      clickbaitsFallenFor: 0,
      deathReason: null,
      freezeActiveUntil: 0,
      redactedItem: null,
      paywallShields: 0,
      trendingZone: null,
      lastTrendingZoneTime: Date.now(),
      boss: null,
      bossesDefeated: 0,
      isPaused: false,
    }),

  endGame: () => set({ status: 'gameover' }),

  addScore: (points) => set((state) => ({ score: state.score + points })),

  loseLife: () =>
    set((state) => {
      const newLives = state.lives - 1;
      if (newLives <= 0) {
        return { lives: 0, status: 'gameover', deathReason: 'Missed deadlines (ran out of lives)' };
      }
      return { lives: newLives };
    }),

  activateFactCheck: () =>
    set((state) => {
      const now = Date.now();
      if (now < state.factCheckReadyAt || state.status !== 'playing') return state;
      return {
        factCheckActiveUntil: now + 3000,
        factCheckReadyAt: now + 15000,
      };
    }),

  fetchInitialNews: async () => {
    set({ isLoadingNews: true });
    try {
      const state = get();
      const news = await fetchNewsFeeds(state.customFeedUrl);
      set((state) => ({
        newsQueue: [...state.newsQueue, ...news],
        isLoadingNews: false,
      }));
    } catch (err) {
      console.error('Failed to fetch news', err);
      set({ isLoadingNews: false });
    }
  },

  popNews: () => {
    const { newsQueue, fetchInitialNews } = get();
    if (newsQueue.length === 0) return null;

    if (newsQueue.length < 5) {
      fetchInitialNews();
    }

    const [first, ...rest] = newsQueue;
    set({ newsQueue: rest });
    return first;
  },

  resetGame: () =>
    set({
      status: 'start',
      score: 0,
      lives: 3,
      factCheckActiveUntil: 0,
      factCheckReadyAt: 0,
      echoChamberActiveUntil: 0,
      lastEchoChamberTime: 0,
      deepFakeActiveUntil: 0,
      lastDeepFakeTime: 0,
      highestCombo: 0,
      clickbaitsFallenFor: 0,
      deathReason: null,
      freezeActiveUntil: 0,
      redactedItem: null,
      paywallShields: 0,
      trendingZone: null,
      lastTrendingZoneTime: 0,
      isPaused: false,
    }),

  triggerEchoChamber: () =>
    set((state) => {
      const now = Date.now();
      return {
        echoChamberActiveUntil: now + 8000,
        lastEchoChamberTime: now,
      };
    }),

  triggerDeepFake: () =>
    set((state) => {
      const now = Date.now();
      return {
        deepFakeActiveUntil: now + 10000,
        lastDeepFakeTime: now,
      };
    }),

  triggerRedactFreeze: (item) =>
    set({
      freezeActiveUntil: Date.now() + 1500,
      redactedItem: item,
    }),

  clearFreeze: () =>
    set({
      freezeActiveUntil: 0,
      redactedItem: null,
    }),

  activatePaywall: () => set((state) => ({ paywallShields: state.paywallShields + 1 })),
  consumePaywall: () => {
    const { paywallShields } = get();
    if (paywallShields > 0) {
      set({ paywallShields: paywallShields - 1 });
      return true;
    }
    return false;
  },

  spawnTrendingZone: (zone) => set({ trendingZone: zone, lastTrendingZoneTime: Date.now() }),
  clearTrendingZone: () => set({ trendingZone: null }),

  setPen: (pen) => set({ activePen: pen }),

  updateHighestCombo: (combo) =>
    set((state) => ({ highestCombo: Math.max(state.highestCombo, combo) })),
  incrementClickbaits: () =>
    set((state) => ({ clickbaitsFallenFor: state.clickbaitsFallenFor + 1 })),
  setDeathReason: (reason) => set({ deathReason: reason }),

  spawnBoss: (canvasWidth) =>
    set((state) => ({
      boss: {
        active: true,
        maxHealth: 10 + state.bossesDefeated * 5,
        health: 10 + state.bossesDefeated * 5,
        x: canvasWidth / 2,
        y: 150,
        width: 400,
        height: 120,
        lastAttackTime: Date.now(),
      },
    })),

  updateBossPosition: (x) => set((state) => (state.boss ? { boss: { ...state.boss, x } } : state)),
  updateBossAttackTime: () =>
    set((state) => (state.boss ? { boss: { ...state.boss, lastAttackTime: Date.now() } } : state)),

  damageBoss: (amount) =>
    set((state) => {
      if (!state.boss) return state;
      const newHealth = state.boss.health - amount;
      if (newHealth <= 0) {
        return { boss: { ...state.boss, health: 0 } };
      }
      return { boss: { ...state.boss, health: newHealth } };
    }),

  defeatBoss: () =>
    set((state) => ({
      boss: null,
      bossesDefeated: state.bossesDefeated + 1,
      score: state.score + 1000,
    })),
}));
