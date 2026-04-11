import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { saveHighScore, getRank } from '../utils/highScores';

export const GameOverScreen: React.FC = () => {
  const {
    score,
    resetGame,
    fetchInitialNews,
    isLoadingNews,
    highestCombo,
    clickbaitsFallenFor,
    deathReason,
  } = useGameStore();

  useEffect(() => {
    saveHighScore(score);
  }, [score]);

  const handleRestart = () => {
    resetGame();
    fetchInitialNews();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(0,0,0,0.85)] backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#f4f0e6] shadow-[16px_16px_0px_0px_#ff2a00] border-4 border-black animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Header Tape */}
        <div className="w-full bg-black text-white p-3 flex justify-between items-center border-b-4 border-black">
          <span className="font-mono font-bold tracking-widest uppercase text-sm text-[var(--nn-signal)]">
            Internal Memo
          </span>
          <span className="font-mono font-bold tracking-widest uppercase text-sm">
            Date: {new Date().toLocaleDateString()}
          </span>
        </div>

        <div className="p-8 sm:p-12 flex flex-col items-center">
          <h1 className="text-6xl sm:text-7xl font-[Anton] tracking-widest text-black uppercase mb-2 text-center leading-none">
            EDITORIAL
            <br />
            REVIEW
          </h1>

          <div className="w-full h-1 bg-black mt-6 mb-8 opacity-20" />

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
            {/* Left Column: Stats */}
            <div className="flex flex-col gap-6 font-mono text-sm sm:text-base">
              <div>
                <div className="text-black/50 font-bold uppercase mb-1">Final Score</div>
                <div className="text-4xl font-black text-black font-[Anton] tracking-wider">
                  {score}
                </div>
              </div>

              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
                <div className="text-black/50 font-bold uppercase mb-1">Assigned Rank</div>
                <div className="text-2xl font-bold text-[var(--nn-signal)] font-serif uppercase tracking-widest">
                  {getRank(score)}
                </div>
              </div>

              <div>
                <div className="text-black/50 font-bold uppercase mb-1 flex justify-between">
                  <span>Highest Combo:</span>
                  <span className="text-black">x{highestCombo}</span>
                </div>
                <div className="text-black/50 font-bold uppercase flex justify-between">
                  <span>Clickbaits Missed:</span>
                  <span className="text-black">{clickbaitsFallenFor}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Reason */}
            <div className="flex flex-col justify-center border-l-4 border-black pl-8">
              <div className="text-black/50 font-bold uppercase mb-3 text-sm tracking-widest">
                Reason for Termination
              </div>
              <div className="text-xl sm:text-2xl font-bold text-black font-serif leading-tight">
                {deathReason || 'Unknown error.'}
              </div>

              {/* Red Stamp */}
              <div className="mt-8 border-4 border-[#ff2a00] text-[#ff2a00] font-[Anton] text-4xl p-2 text-center transform rotate-6 opacity-80 mix-blend-multiply">
                FIRED
              </div>
            </div>
          </div>

          <button
            onClick={handleRestart}
            disabled={isLoadingNews}
            className="group w-full relative inline-flex items-center justify-center bg-black px-8 py-5 text-white border-4 border-black shadow-[8px_8px_0px_0px_var(--nn-gold)] hover:shadow-[4px_4px_0px_0px_var(--nn-gold)] hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-xl font-bold uppercase tracking-widest [font-family:var(--nn-mono)]">
              {isLoadingNews ? 'Loading Desk...' : 'Reapply for Job'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
