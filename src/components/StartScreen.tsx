import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Newspaper } from 'lucide-react';
import IconNinja from '~icons/mdi/ninja';
import IconBrush from '~icons/mdi/brush';
import IconLock from '~icons/mdi/lock';
import IconRss from '~icons/mdi/rss';
import IconCheck from '~icons/mdi/check';
import IconRefresh from '~icons/mdi/refresh';
import {
  getHighScores,
  HighScore,
  getTotalCumulativeScore,
  PENS,
  getUnlockedPens,
} from '../utils/highScores';
import { TutorialModal } from './TutorialModal';

export const StartScreen: React.FC = () => {
  const {
    startGame,
    fetchInitialNews,
    isLoadingNews,
    newsQueue,
    activePen,
    setPen,
    customFeedUrl,
    setCustomFeedUrl,
  } = useGameStore();
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [feedInput, setFeedInput] = useState(customFeedUrl || '');

  useEffect(() => {
    if (newsQueue.length === 0 && !isLoadingNews) {
      fetchInitialNews();
    }
  }, [fetchInitialNews, isLoadingNews, newsQueue.length]);

  useEffect(() => {
    setHighScores(getHighScores());
    setTotalScore(getTotalCumulativeScore());
  }, []);

  return (
    <>
      <div className="absolute inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 pt-24 pb-12 bg-[rgba(0,0,0,0.6)] backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-3xl bg-[var(--nn-paper)] shadow-[16px_16px_0px_0px_var(--nn-ink)] border-4 border-black my-auto">
          <div className="absolute top-2 left-2 w-4 h-4 border-t-4 border-l-4 border-black" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-4 border-r-4 border-black" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-4 border-l-4 border-black" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-4 border-r-4 border-black" />

          <div className="relative p-10 sm:p-16">
            <div className="flex flex-col items-center justify-center text-center mb-8 border-b-4 border-black pb-8">
              <div className="inline-flex items-center gap-2 bg-black px-6 py-3 rounded-full mb-8 shadow-[4px_4px_0px_0px_var(--nn-signal)]">
                <Newspaper className="h-6 w-6 text-white" />
                <span className="text-sm font-bold uppercase tracking-widest text-white [font-family:var(--nn-mono)]">
                  Live Headlines
                </span>
              </div>
              <div className="flex flex-col items-center">
                <IconNinja className="text-[6rem] sm:text-[8rem] mb-2" />
                <h1 className="text-8xl sm:text-[9rem] leading-[0.85] tracking-tight text-black [font-family:var(--nn-display)] uppercase mb-4 text-left inline-block">
                  News
                  <br />
                  Ninja
                </h1>
              </div>
              <div className="w-full h-1 bg-black mt-2 mb-1" />
              <div className="w-full h-1 bg-black" />

              <div className="mt-8 w-full max-w-xs mx-auto">
                <button
                  onClick={startGame}
                  disabled={isLoadingNews}
                  className="group w-full relative inline-flex items-center justify-center bg-[var(--nn-signal)] px-6 py-3 text-white border-4 border-black shadow-[6px_6px_0px_0px_var(--nn-ink)] hover:shadow-[2px_2px_0px_0px_var(--nn-ink)] hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-bold uppercase tracking-widest [font-family:var(--nn-mono)]">
                    {isLoadingNews ? 'Loading...' : 'Play Now'}
                  </span>
                </button>
              </div>
            </div>

            <div className="text-center mb-10 px-4">
              <p className="text-2xl sm:text-3xl text-black font-bold italic [font-family:var(--nn-serif)] leading-relaxed">
                "Slice the Truth. Avoid the Satire. Don't Let the Headlines Drop."
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-center">
              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_var(--nn-ink)]">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--nn-signal)] [font-family:var(--nn-mono)] mb-2">
                  Real News
                </div>
                <div className="text-black font-bold text-lg leading-snug">Slice to score.</div>
              </div>
              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_var(--nn-danger)]">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--nn-danger)] [font-family:var(--nn-mono)] mb-2">
                  Satire
                </div>
                <div className="text-black font-bold text-lg leading-snug">Bombs. Don’t slice.</div>
              </div>
              <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_var(--nn-ink)]">
                <div className="text-xs font-bold uppercase tracking-widest text-black [font-family:var(--nn-mono)] mb-2">
                  Misses
                </div>
                <div className="text-black font-bold text-lg leading-snug">Drop 3 & it’s over.</div>
              </div>
            </div>

            {/* Custom Feed */}
            <div className="mb-12 w-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-1 bg-black flex-1 opacity-20"></div>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-black [font-family:var(--nn-display)] flex items-center gap-2">
                  <IconRss /> Custom Feed
                </h2>
                <div className="h-1 bg-black flex-1 opacity-20"></div>
              </div>

              <div className="text-center mb-4 text-sm font-bold uppercase tracking-widest text-black/60 [font-family:var(--nn-mono)]">
                Play with your own headlines
              </div>

              <div className="flex w-full max-w-md mx-auto shadow-[4px_4px_0px_0px_var(--nn-ink)] border-4 border-black bg-white">
                <input
                  type="text"
                  value={feedInput}
                  onChange={(e) => setFeedInput(e.target.value)}
                  placeholder="https://news.ycombinator.com/rss"
                  className="flex-1 p-3 outline-none font-mono text-sm placeholder:text-black/30"
                />
                <button
                  onClick={() => {
                    setCustomFeedUrl(feedInput);
                    fetchInitialNews();
                  }}
                  disabled={isLoadingNews}
                  className="bg-black text-white px-4 hover:bg-[var(--nn-signal)] transition-colors border-l-4 border-black disabled:opacity-50"
                >
                  <IconCheck className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    setCustomFeedUrl(null);
                    setFeedInput('');
                    fetchInitialNews();
                  }}
                  disabled={isLoadingNews || (!customFeedUrl && feedInput.trim() === '')}
                  className="bg-white text-black px-4 hover:bg-gray-100 transition-colors border-l-4 border-black disabled:opacity-50"
                  title="Reset to default feeds"
                >
                  <IconRefresh className="w-6 h-6" />
                </button>
              </div>
              {customFeedUrl && (
                <div className="mt-2 text-xs font-bold text-[var(--nn-signal)] uppercase tracking-widest font-mono text-center">
                  Active Feed Loaded
                </div>
              )}
            </div>

            {/* Armory / Pens */}
            <div className="mb-12 w-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-1 bg-black flex-1 opacity-20"></div>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-black [font-family:var(--nn-display)] flex items-center gap-2">
                  <IconBrush /> The Armory
                </h2>
                <div className="h-1 bg-black flex-1 opacity-20"></div>
              </div>

              <div className="text-center mb-4">
                <span className="text-sm font-bold uppercase tracking-widest text-black/60 [font-family:var(--nn-mono)]">
                  Career Total: <span className="text-[var(--nn-signal)]">{totalScore}</span> pts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {PENS.map((pen) => {
                  const isUnlocked = totalScore >= pen.unlockThreshold;
                  const isActive = activePen.id === pen.id;

                  return (
                    <button
                      key={pen.id}
                      onClick={() => isUnlocked && setPen(pen)}
                      disabled={!isUnlocked}
                      className={`relative border-4 p-3 text-left transition-all ${
                        isActive
                          ? 'border-[var(--nn-signal)] bg-white shadow-[4px_4px_0px_0px_var(--nn-signal)] translate-x-[-2px] translate-y-[-2px]'
                          : isUnlocked
                            ? 'border-black bg-white shadow-[4px_4px_0px_0px_var(--nn-ink)] hover:bg-gray-50'
                            : 'border-black/20 bg-gray-100 opacity-70 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div
                          className="font-bold uppercase tracking-widest text-sm [font-family:var(--nn-mono)]"
                          style={{ color: isUnlocked ? pen.color : 'gray' }}
                        >
                          {pen.name}
                        </div>
                        {!isUnlocked && <IconLock className="text-gray-400" />}
                      </div>
                      <div className="text-xs text-black/60 font-bold leading-tight h-8">
                        {isUnlocked ? pen.description : `Unlocks at ${pen.unlockThreshold} pts`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {highScores.length > 0 && (
              <div className="mb-10 w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-1 bg-black flex-1 opacity-20"></div>
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-black [font-family:var(--nn-display)]">
                    Hall of Fame
                  </h2>
                  <div className="h-1 bg-black flex-1 opacity-20"></div>
                </div>
                <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_var(--nn-ink)] font-mono">
                  <div className="flex text-xs font-bold uppercase tracking-widest text-black/50 mb-2 border-b-2 border-black/20 pb-2">
                    <div className="flex-1">Rank</div>
                    <div className="w-24 text-right">Score</div>
                  </div>
                  {highScores.map((hs, i) => (
                    <div
                      key={i}
                      className="flex items-center py-2 border-b border-black/10 last:border-0"
                    >
                      <div className="flex-1 flex items-baseline gap-2">
                        <span className="text-black font-bold uppercase truncate">{hs.rank}</span>
                        <span className="text-[10px] text-black/40">{hs.date}</span>
                      </div>
                      <div className="w-24 text-right font-black text-[var(--nn-signal)] text-lg">
                        {hs.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center">
              <div className="text-xs font-bold uppercase tracking-widest text-black/60 [font-family:var(--nn-mono)] mb-4">
                {isLoadingNews ? 'Fetching RSS feeds…' : 'Ready when you are.'}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <button
                  onClick={startGame}
                  disabled={isLoadingNews}
                  className="group flex-1 relative inline-flex items-center justify-center bg-[var(--nn-signal)] px-6 py-4 text-white border-4 border-black shadow-[6px_6px_0px_0px_var(--nn-ink)] hover:shadow-[2px_2px_0px_0px_var(--nn-ink)] hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-bold uppercase tracking-widest [font-family:var(--nn-mono)]">
                    {isLoadingNews ? 'Loading...' : 'Start'}
                  </span>
                </button>

                <button
                  onClick={() => setShowTutorial(true)}
                  className="group flex-1 relative inline-flex items-center justify-center bg-white px-6 py-4 text-black border-4 border-black shadow-[6px_6px_0px_0px_var(--nn-ink)] hover:shadow-[2px_2px_0px_0px_var(--nn-ink)] hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <span className="text-lg font-bold uppercase tracking-widest [font-family:var(--nn-mono)]">
                    Tutorial
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
    </>
  );
};
