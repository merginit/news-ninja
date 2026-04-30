import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import LightningBolt from '~icons/mdi/lightning-bolt';
import ShieldLock from '~icons/mdi/shield-lock';
import CardsHeart from '~icons/mdi/cards-heart';
import HeartOutline from '~icons/mdi/heart-outline';
import VolumeHigh from '~icons/mdi/volume-high';
import VolumeOff from '~icons/mdi/volume-off';
import Pause from '~icons/mdi/pause';
import Play from '~icons/mdi/play';
import Refresh from '~icons/mdi/refresh';
import { audio } from '../utils/audio';

export const HUD: React.FC = () => {
  const {
    score,
    lives,
    factCheckActiveUntil,
    factCheckReadyAt,
    activateFactCheck,
    status,
    paywallShields,
    isPaused,
    togglePause,
    startGame,
    pauseStartTime,
  } = useGameStore();
  const [realNow, setRealNow] = useState(Date.now());
  const now = isPaused && pauseStartTime ? pauseStartTime : realNow;
  const [isMuted, setIsMuted] = useState(audio.getMuted());
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [wasPaused, setWasPaused] = useState(false);

  const toggleMute = () => {
    setIsMuted(audio.toggleMute());
  };

  const handleRestartClick = () => {
    setWasPaused(isPaused);
    if (!isPaused) {
      togglePause();
    }
    setShowRestartModal(true);
  };

  const confirmRestart = () => {
    setShowRestartModal(false);
    startGame();
  };

  const cancelRestart = () => {
    setShowRestartModal(false);
    if (!wasPaused) {
      togglePause();
    }
  };

  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => setRealNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        activateFactCheck();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activateFactCheck]);

  const isCooldown = now < factCheckReadyAt;
  const isActive = now < factCheckActiveUntil;
  const progress = isCooldown ? Math.max(0, (factCheckReadyAt - now) / 15000) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
        <div className="bg-white border-4 border-black px-6 py-2 shadow-[8px_8px_0px_0px_var(--nn-ink)] flex flex-col items-center">
          <div className="text-xs font-bold uppercase tracking-widest text-[var(--nn-signal)] [font-family:var(--nn-mono)] mb-1">
            SCORE
          </div>
          <div className="text-5xl text-black [font-family:var(--nn-display)] leading-none">
            {score}
          </div>
        </div>

        {paywallShields > 0 && (
          <div className="bg-[#22c55e] border-4 border-black px-4 py-2 shadow-[8px_8px_0px_0px_var(--nn-ink)] flex items-center justify-center animate-pulse mr-4">
            <span className="font-bold text-black uppercase tracking-widest [font-family:var(--nn-mono)] flex items-center gap-2">
              <ShieldLock className="w-5 h-5" /> Shield Active{' '}
              {paywallShields > 1 ? `(x${paywallShields})` : ''}
            </span>
          </div>
        )}

        <div className="flex gap-4 ml-auto items-center pointer-events-auto">
          <button
            onClick={handleRestartClick}
            className="bg-white border-4 border-black w-14 h-14 shadow-[8px_8px_0px_0px_var(--nn-ink)] flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Restart Game"
          >
            <Refresh className="w-8 h-8" />
          </button>
          <button
            onClick={togglePause}
            className="bg-white border-4 border-black w-14 h-14 shadow-[8px_8px_0px_0px_var(--nn-ink)] flex items-center justify-center hover:bg-gray-200 transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
          </button>
          <button
            onClick={toggleMute}
            className="bg-white border-4 border-black w-14 h-14 shadow-[8px_8px_0px_0px_var(--nn-ink)] flex items-center justify-center hover:bg-gray-200 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeOff className="w-8 h-8" /> : <VolumeHigh className="w-8 h-8" />}
          </button>

          <div className="bg-white border-4 border-black p-3 h-14 shadow-[8px_8px_0px_0px_var(--nn-ink)] flex gap-2 items-center">
            {[1, 2, 3].map((i) =>
              i <= lives ? (
                <CardsHeart key={i} className="text-[var(--nn-danger)] w-8 h-8" />
              ) : (
                <HeartOutline key={i} className="text-black/20 w-8 h-8" />
              )
            )}
          </div>
        </div>
      </div>

      {status === 'playing' && (
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-[90%] sm:max-w-md px-4">
          <button
            onClick={activateFactCheck}
            disabled={isCooldown || isActive}
            className={`w-full relative overflow-hidden border-4 border-black px-4 sm:px-8 py-4 sm:py-3 shadow-[6px_6px_0px_0px_var(--nn-ink)] font-black uppercase tracking-widest transition-transform active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_0px_var(--nn-ink)] select-none touch-manipulation ${
              isActive
                ? 'bg-[#00ffff] text-black'
                : isCooldown
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-[#ffb800] text-black hover:bg-white'
            }`}
          >
            {isCooldown && !isActive && (
              <div
                className="absolute bottom-0 left-0 h-2 sm:h-1 bg-[var(--nn-danger)] transition-all duration-100 ease-linear"
                style={{ width: `${(1 - progress) * 100}%` }}
              />
            )}
            <span className="flex items-center justify-center gap-2 text-xl sm:text-lg">
              <LightningBolt
                className={`w-8 h-8 sm:w-6 sm:h-6 ${isActive ? 'animate-pulse' : ''}`}
              />
              <span className="hidden sm:inline">
                {isActive ? 'FACT CHECKING...' : 'FACT CHECK [SPACE]'}
              </span>
              <span className="sm:hidden">{isActive ? 'CHECKING...' : 'FACT CHECK'}</span>
            </span>
          </button>
        </div>
      )}

      {showRestartModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-auto">
          <div className="bg-white border-4 border-black p-8 max-w-sm w-full mx-4 shadow-[12px_12px_0px_0px_var(--nn-danger)] flex flex-col items-center text-center">
            <h2 className="text-3xl font-black uppercase mb-4 [font-family:var(--nn-display)] text-black">Restart Game?</h2>
            <p className="mb-8 font-bold text-gray-600 [font-family:var(--nn-mono)] text-sm">All your current progress will be lost.</p>
            <div className="flex gap-4 w-full">
              <button
                onClick={cancelRestart}
                className="flex-1 border-4 border-black py-3 font-bold uppercase hover:bg-gray-200 transition-colors text-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestart}
                className="flex-1 bg-[var(--nn-danger)] text-white border-4 border-black py-3 font-bold uppercase hover:bg-red-600 transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
