import { create } from 'zustand';
import { fetchNewsFeeds, NewsItemData } from '../utils/newsFetcher';
import { PenStyle, PENS } from '../utils/highScores';
import { Achievement, ACHIEVEMENTS, getUnlockedAchievements, saveUnlockedAchievement } from '../utils/achievements';

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
  gameId: number;
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
  adBlockerActiveUntil: number;
  lastAdBlockerTime: number;
  paywallShields: number;
  paywallsConsumed: number;
  factChecksUsed: number;
  trendingZone: TrendingZone | null;
  lastTrendingZoneTime: number;
  activePen: PenStyle;
  boss: BossState | null;
  bossesDefeated: number;
  customFeedUrl: string | null;
  isPaused: boolean;
  pauseStartTime: number | null;
  unlockedAchievements: string[];
  recentAchievements: Achievement[];
  dismissAchievementToast: (id: string) => void;
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
  triggerAdBlocker: () => void;
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
  gameId: 0,
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
  adBlockerActiveUntil: 0,
  lastAdBlockerTime: 0,
  paywallShields: 0,
  paywallsConsumed: 0,
  factChecksUsed: 0,
  trendingZone: null,
  lastTrendingZoneTime: 0,
  activePen: PENS[0],
  boss: null,
  bossesDefeated: 0,
  customFeedUrl: null,
  isPaused: false,
  pauseStartTime: null,
  unlockedAchievements: getUnlockedAchievements(),
  recentAchievements: [],

  dismissAchievementToast: (id) =>
    set((state) => ({ recentAchievements: state.recentAchievements.filter((a) => a.id !== id) })),

  setCustomFeedUrl: (url) => set({ customFeedUrl: url, newsQueue: [] }),
  togglePause: () => set((state) => {
    const now = Date.now();
    if (state.isPaused) {
      const pauseDuration = state.pauseStartTime ? now - state.pauseStartTime : 0;
      
      const newTrendingZone = state.trendingZone 
        ? { ...state.trendingZone, activeUntil: state.trendingZone.activeUntil + pauseDuration }
        : null;

      const newBoss = state.boss
        ? { ...state.boss, lastAttackTime: state.boss.lastAttackTime + pauseDuration }
        : null;

      return {
        isPaused: false,
        pauseStartTime: null,
        factCheckActiveUntil: state.factCheckActiveUntil > 0 ? state.factCheckActiveUntil + pauseDuration : 0,
        factCheckReadyAt: state.factCheckReadyAt > 0 ? state.factCheckReadyAt + pauseDuration : 0,
        echoChamberActiveUntil: state.echoChamberActiveUntil > 0 ? state.echoChamberActiveUntil + pauseDuration : 0,
        lastEchoChamberTime: state.lastEchoChamberTime > 0 ? state.lastEchoChamberTime + pauseDuration : 0,
        deepFakeActiveUntil: state.deepFakeActiveUntil > 0 ? state.deepFakeActiveUntil + pauseDuration : 0,
        lastDeepFakeTime: state.lastDeepFakeTime > 0 ? state.lastDeepFakeTime + pauseDuration : 0,
        freezeActiveUntil: state.freezeActiveUntil > 0 ? state.freezeActiveUntil + pauseDuration : 0,
        adBlockerActiveUntil: state.adBlockerActiveUntil > 0 ? state.adBlockerActiveUntil + pauseDuration : 0,
        lastAdBlockerTime: state.lastAdBlockerTime > 0 ? state.lastAdBlockerTime + pauseDuration : 0,
        lastTrendingZoneTime: state.lastTrendingZoneTime > 0 ? state.lastTrendingZoneTime + pauseDuration : 0,
        trendingZone: newTrendingZone,
        boss: newBoss,
      };
    } else {
      return {
        isPaused: true,
        pauseStartTime: now,
      };
    }
  }),

  startGame: () =>
    set((state) => ({
      status: 'playing',
      gameId: state.gameId + 1,
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
      adBlockerActiveUntil: 0,
      lastAdBlockerTime: Date.now(),
      paywallShields: 0,
      paywallsConsumed: 0,
      factChecksUsed: 0,
      trendingZone: null,
      lastTrendingZoneTime: Date.now(),
      boss: null,
      bossesDefeated: 0,
      isPaused: false,
      pauseStartTime: null,
    })),

  endGame: () => set({ status: 'gameover' }),

  addScore: (points) =>
    set((state) => {
      const newScore = state.score + points;
      
      const checkUnlock = (id: string, condition: boolean) => {
        if (condition && !state.unlockedAchievements.includes(id)) {
          const achievement = ACHIEVEMENTS.find((a) => a.id === id);
          if (achievement) {
            saveUnlockedAchievement(id);
            state.unlockedAchievements.push(id);
            state.recentAchievements.push(achievement);
          }
        }
      };

      checkUnlock('intern_no_more', newScore >= 1000);
      checkUnlock('gossip_columnist', newScore >= 5000);
      checkUnlock('pulitzer_prize', newScore >= 10000);
      checkUnlock('legendary_anchor', newScore >= 50000);

      return { score: newScore, unlockedAchievements: [...state.unlockedAchievements], recentAchievements: [...state.recentAchievements] };
    }),

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
      
      const newFactChecks = state.factChecksUsed + 1;
      const unlocked = [...state.unlockedAchievements];
      const recent = [...state.recentAchievements];

      if (newFactChecks >= 5 && !unlocked.includes('fact_checker')) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === 'fact_checker');
        if (achievement) {
          saveUnlockedAchievement('fact_checker');
          unlocked.push('fact_checker');
          recent.push(achievement);
        }
      }

      return {
        factCheckActiveUntil: now + 3000,
        factCheckReadyAt: now + 15000,
        factChecksUsed: newFactChecks,
        unlockedAchievements: unlocked,
        recentAchievements: recent,
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
      adBlockerActiveUntil: 0,
      lastAdBlockerTime: 0,
      paywallShields: 0,
      paywallsConsumed: 0,
      factChecksUsed: 0,
      trendingZone: null,
      lastTrendingZoneTime: 0,
      isPaused: false,
      pauseStartTime: null,
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

  triggerAdBlocker: () =>
    set((state) => {
      const now = Date.now();
      return {
        adBlockerActiveUntil: now + 10000,
        lastAdBlockerTime: now,
      };
    }),

  activatePaywall: () => set((state) => ({ paywallShields: state.paywallShields + 1 })),
  consumePaywall: () => {
    let consumed = false;
    set((state) => {
      if (state.paywallShields > 0) {
        consumed = true;
        const newConsumed = state.paywallsConsumed + 1;
        const unlocked = [...state.unlockedAchievements];
        const recent = [...state.recentAchievements];

        if (newConsumed >= 3 && !unlocked.includes('paywall_buster')) {
          const achievement = ACHIEVEMENTS.find((a) => a.id === 'paywall_buster');
          if (achievement) {
            saveUnlockedAchievement('paywall_buster');
            unlocked.push('paywall_buster');
            recent.push(achievement);
          }
        }

        return { 
          paywallShields: state.paywallShields - 1,
          paywallsConsumed: newConsumed,
          unlockedAchievements: unlocked,
          recentAchievements: recent,
        };
      }
      return state;
    });
    return consumed;
  },

  spawnTrendingZone: (zone) => set({ trendingZone: zone, lastTrendingZoneTime: Date.now() }),
  clearTrendingZone: () => set({ trendingZone: null }),

  setPen: (pen) => set({ activePen: pen }),

  updateHighestCombo: (combo) =>
    set((state) => {
      const newCombo = Math.max(state.highestCombo, combo);
      
      if (newCombo >= 10 && !state.unlockedAchievements.includes('combo_master')) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === 'combo_master');
        if (achievement) {
          saveUnlockedAchievement('combo_master');
          state.unlockedAchievements.push('combo_master');
          state.recentAchievements.push(achievement);
        }
      }
      if (newCombo >= 25 && !state.unlockedAchievements.includes('godlike_combo')) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === 'godlike_combo');
        if (achievement) {
          saveUnlockedAchievement('godlike_combo');
          state.unlockedAchievements.push('godlike_combo');
          state.recentAchievements.push(achievement);
        }
      }
      return { 
        highestCombo: newCombo,
        unlockedAchievements: [...state.unlockedAchievements],
        recentAchievements: [...state.recentAchievements],
      };
    }),
  incrementClickbaits: () =>
    set((state) => {
      const newClickbaits = state.clickbaitsFallenFor + 1;
      
      if (newClickbaits >= 5 && !state.unlockedAchievements.includes('fake_news_victim')) {
        const achievement = ACHIEVEMENTS.find((a) => a.id === 'fake_news_victim');
        if (achievement) {
          saveUnlockedAchievement('fake_news_victim');
          return {
            clickbaitsFallenFor: newClickbaits,
            unlockedAchievements: [...state.unlockedAchievements, 'fake_news_victim'],
            recentAchievements: [...state.recentAchievements, achievement],
          };
        }
      }
      return { clickbaitsFallenFor: newClickbaits };
    }),
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
    set((state) => {
      const newDefeated = state.bossesDefeated + 1;
      const newScore = state.score + 1000;
      
      const unlocked = [...state.unlockedAchievements];
      const recent = [...state.recentAchievements];
      
      const checkUnlock = (id: string, condition: boolean) => {
        if (condition && !unlocked.includes(id)) {
          const achievement = ACHIEVEMENTS.find((a) => a.id === id);
          if (achievement) {
            saveUnlockedAchievement(id);
            unlocked.push(id);
            recent.push(achievement);
          }
        }
      };

      checkUnlock('boss_slayer', newDefeated >= 1);
      checkUnlock('boss_annihilator', newDefeated >= 5);
      checkUnlock('close_call', state.lives === 1);
      checkUnlock('intern_no_more', newScore >= 1000);
      checkUnlock('gossip_columnist', newScore >= 5000);
      checkUnlock('pulitzer_prize', newScore >= 10000);

      return {
        boss: null,
        bossesDefeated: newDefeated,
        score: newScore,
        unlockedAchievements: unlocked,
        recentAchievements: recent,
      };
    }),
}));
