import React from 'react';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../utils/achievements';
import IconMedal from '~icons/mdi/medal';
import IconStar from '~icons/mdi/star';
import IconTrophy from '~icons/mdi/trophy';
import IconSword from '~icons/mdi/sword';
import IconFire from '~icons/mdi/fire';
import IconAlert from '~icons/mdi/alert';
import IconClose from '~icons/mdi/close';
import IconLock from '~icons/mdi/lock';

const ICON_MAP: Record<string, React.ReactNode> = {
  medal: <IconMedal className="w-8 h-8" />,
  star: <IconStar className="w-8 h-8" />,
  trophy: <IconTrophy className="w-8 h-8" />,
  sword: <IconSword className="w-8 h-8" />,
  fire: <IconFire className="w-8 h-8" />,
  alert: <IconAlert className="w-8 h-8" />,
};

interface Props {
  onClose: () => void;
}

export const AchievementsModal: React.FC<Props> = ({ onClose }) => {
  const { unlockedAchievements } = useGameStore();

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.8)] backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[var(--nn-paper)] shadow-[16px_16px_0px_0px_var(--nn-ink)] border-4 border-black max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-[var(--nn-signal)] text-white w-12 h-12 border-4 border-black shadow-[4px_4px_0px_0px_var(--nn-ink)] flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all z-10"
        >
          <IconClose className="w-8 h-8" />
        </button>

        <div className="p-6 border-b-4 border-black bg-white">
          <h2 className="text-4xl font-bold uppercase tracking-widest text-black [font-family:var(--nn-display)] text-center">
            Achievements
          </h2>
          <div className="text-center mt-2 font-bold font-mono text-black/60">
            {unlockedAchievements.length} / {ACHIEVEMENTS.length} Unlocked
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedAchievements.includes(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`border-4 p-4 flex items-center gap-4 transition-all ${
                    isUnlocked
                      ? 'border-black bg-white shadow-[4px_4px_0px_0px_var(--nn-signal)]'
                      : 'border-black/20 bg-gray-100 opacity-60'
                  }`}
                >
                  <div className={isUnlocked ? 'text-[var(--nn-signal)]' : 'text-gray-400'}>
                    {isUnlocked ? (
                      ICON_MAP[achievement.iconName] || <IconStar className="w-8 h-8" />
                    ) : (
                      <IconLock className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold uppercase tracking-widest text-sm [font-family:var(--nn-mono)] text-black mb-1">
                      {achievement.title}
                    </div>
                    <div className="text-xs font-bold text-black/60 leading-tight">
                      {achievement.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
