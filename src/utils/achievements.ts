export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'intern_no_more',
    title: 'Intern No More',
    description: 'Score 1,000 points in a single game.',
    iconName: 'medal',
  },
  {
    id: 'gossip_columnist',
    title: 'Gossip Columnist',
    description: 'Score 5,000 points in a single game.',
    iconName: 'star',
  },
  {
    id: 'pulitzer_prize',
    title: 'Pulitzer Prize',
    description: 'Score 10,000 points in a single game.',
    iconName: 'trophy',
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Defeat your first boss.',
    iconName: 'sword',
  },
  {
    id: 'combo_master',
    title: 'Combo Master',
    description: 'Reach a 10x combo.',
    iconName: 'fire',
  },
  {
    id: 'fake_news_victim',
    title: 'Fake News Victim',
    description: 'Fall for 5 clickbaits across your career.',
    iconName: 'alert',
  },
  {
    id: 'legendary_anchor',
    title: 'Legendary Anchor',
    description: 'Score 50,000 points in a single game.',
    iconName: 'star',
  },
  {
    id: 'godlike_combo',
    title: 'Godlike Combo',
    description: 'Reach a 25x combo.',
    iconName: 'fire',
  },
  {
    id: 'boss_annihilator',
    title: 'Boss Annihilator',
    description: 'Defeat 5 bosses in a single run.',
    iconName: 'sword',
  },
  {
    id: 'fact_checker',
    title: 'Fact Checker',
    description: 'Use the Fact Check ability 5 times in a single game.',
    iconName: 'medal',
  },
  {
    id: 'paywall_buster',
    title: 'Paywall Buster',
    description: 'Consume 3 Paywall Shields in a single game.',
    iconName: 'trophy',
  },
  {
    id: 'close_call',
    title: 'Close Call',
    description: 'Defeat a boss with exactly 1 life remaining.',
    iconName: 'alert',
  },
];

const STORAGE_KEY = 'newsninja_achievements';

export const getUnlockedAchievements = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to parse achievements', e);
  }
  return [];
};

export const saveUnlockedAchievement = (id: string) => {
  const current = getUnlockedAchievements();
  if (!current.includes(id)) {
    current.push(id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to save achievements', e);
    }
  }
};
