import React, { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

export const Ticker: React.FC = () => {
  const { newsQueue, highestCombo, score } = useGameStore();

  const tickerItems = useMemo(() => {
    const items: { text: string; url?: string }[] = [];

    // Meta commentary based on state
    if (highestCombo > 5) {
      items.push({ text: `BREAKING: Local editor achieves massive ${highestCombo}x combo!` });
    }
    if (score > 1000) {
      items.push({ text: `UPDATE: News Ninja ratings soar as score passes ${score} points.` });
    }

    // Actual headlines from the queue
    const headlinesToUse = newsQueue.slice(0, 10);
    if (headlinesToUse.length > 0) {
      headlinesToUse.forEach((n) => {
        const prefix = n.type === 'bomb' ? 'SATIRE' : n.type === 'breaking' ? 'BREAKING' : 'WIRE';
        items.push({ text: `${prefix}: ${n.title}`, url: n.url });
      });
    } else {
      items.push(
        { text: 'CONNECTING TO WIRE...' },
        { text: 'FETCHING RSS FEEDS...' },
        { text: 'STAND BY...' }
      );
    }

    return items;
  }, [newsQueue, highestCombo, score]);

  return (
    <div className="w-full h-8 bg-black flex items-center overflow-hidden z-50 shrink-0">
      <div className="flex whitespace-nowrap animate-ticker text-[var(--nn-signal)] font-bold uppercase tracking-widest text-sm [font-family:var(--nn-mono)] pl-full group hover:[animation-play-state:paused]">
        {/* Render twice for seamless looping */}
        {[0, 1].map((loopIndex) => (
          <React.Fragment key={loopIndex}>
            {tickerItems.map((item, idx) => (
              <React.Fragment key={`${loopIndex}-${idx}`}>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline transition-colors"
                  >
                    {item.text}
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
                <span className="mx-4 text-white/50">///</span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
