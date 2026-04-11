import React from 'react';
import { GameEngine } from './components/GameEngine';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { Ticker } from './components/Ticker';
import { useGameStore } from './store/gameStore';

function App() {
  const { status } = useGameStore();

  return (
    <div className="w-full h-screen overflow-hidden bg-[var(--nn-ink)] font-sans text-black selection:bg-[var(--nn-signal)]/30 selection:text-[var(--nn-signal)] flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <GameEngine />
        {status === 'playing' && <HUD />}
        {status === 'start' && <StartScreen />}
        {status === 'gameover' && <GameOverScreen />}
      </div>
      <Ticker />
    </div>
  );
}

export default App;
