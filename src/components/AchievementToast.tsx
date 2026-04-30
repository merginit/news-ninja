import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import IconMedal from '~icons/mdi/medal';
import IconStar from '~icons/mdi/star';
import IconTrophy from '~icons/mdi/trophy';
import IconSword from '~icons/mdi/sword';
import IconFire from '~icons/mdi/fire';
import IconAlert from '~icons/mdi/alert';

const ICON_MAP: Record<string, React.ReactNode> = {
  medal: <IconMedal className="w-8 h-8" />,
  star: <IconStar className="w-8 h-8" />,
  trophy: <IconTrophy className="w-8 h-8" />,
  sword: <IconSword className="w-8 h-8" />,
  fire: <IconFire className="w-8 h-8" />,
  alert: <IconAlert className="w-8 h-8" />,
};

export const AchievementToast: React.FC = () => {
  const { recentAchievements, dismissAchievementToast } = useGameStore();
  const [current, setCurrent] = useState(recentAchievements[0]);

  useEffect(() => {
    if (recentAchievements.length > 0 && !current) {
      setCurrent(recentAchievements[0]);
    }
  }, [recentAchievements, current]);

  useEffect(() => {
    if (current) {
      const timer = setTimeout(() => {
        dismissAchievementToast(current.id);
        setCurrent(undefined);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [current, dismissAchievementToast]);

  if (!current) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_var(--nn-signal)] animate-[slideIn_0.3s_ease-out]">
      <div className="flex items-center gap-4">
        <div className="text-[var(--nn-signal)]">
          {ICON_MAP[current.iconName] || <IconStar className="w-8 h-8" />}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--nn-signal)] [font-family:var(--nn-mono)] mb-1">
            Achievement Unlocked
          </div>
          <div className="text-xl font-bold text-black [font-family:var(--nn-display)] leading-none mb-1">
            {current.title}
          </div>
          <div className="text-sm font-bold text-black/60 leading-tight">
            {current.description}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
