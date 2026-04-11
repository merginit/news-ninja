export interface HighScore {
  score: number;
  rank: string;
  date: string;
}

export type PenId = 'default' | 'red' | 'highlighter' | 'glitch';

export interface PenStyle {
  id: PenId;
  name: string;
  color: string;
  width: number;
  unlockThreshold: number;
  description: string;
}

export const PENS: PenStyle[] = [
  {
    id: 'default',
    name: 'The Standard Ink',
    color: '#000000',
    width: 6,
    unlockThreshold: 0,
    description: 'Reliable. Professional. Boring.',
  },
  {
    id: 'red',
    name: "The Editor's Red",
    color: '#ff2a00',
    width: 8,
    unlockThreshold: 5000,
    description: 'Bleeds truth.',
  },
  {
    id: 'highlighter',
    name: 'The Highlighter',
    color: '#00ffff',
    width: 16,
    unlockThreshold: 25000,
    description: 'Neon bright focus.',
  },
  {
    id: 'glitch',
    name: 'The Glitch',
    color: '#ffb800',
    width: 10,
    unlockThreshold: 50000,
    description: 'Hacks the matrix.',
  },
];

export const getUnlockedPens = (totalScore: number): PenStyle[] => {
  return PENS.filter((pen) => totalScore >= pen.unlockThreshold);
};

const STORAGE_KEY = 'newsninja_highscores';

export const getRank = (s: number) => {
  if (s < 500) return 'Unpaid Intern';
  if (s < 1000) return 'Gossip Blogger';
  if (s < 2000) return 'Junior Reporter';
  if (s < 4000) return 'Senior Editor';
  if (s < 8000) return 'Editor in Chief';
  return 'Pulitzer Winner';
};

export const getHighScores = (): HighScore[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to parse high scores', e);
  }
  return [];
};

export const getTotalCumulativeScore = (): number => {
  return getHighScores().reduce((total, hs) => total + hs.score, 0);
};

export const saveHighScore = (score: number) => {
  if (score <= 0) return; // Don't save 0 point games

  const currentScores = getHighScores();
  const now = new Date();
  const newScore: HighScore = {
    score,
    rank: getRank(score),
    date: `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  };

  const updatedScores = [...currentScores, newScore].sort((a, b) => b.score - a.score).slice(0, 5); // Keep top 5

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScores));
  } catch (e) {
    console.error('Failed to save high scores', e);
  }
};
