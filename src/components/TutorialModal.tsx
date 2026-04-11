import React, { useState } from 'react';
import IconClose from '~icons/mdi/close';
import IconChevronLeft from '~icons/mdi/chevron-left';
import IconChevronRight from '~icons/mdi/chevron-right';
import IconLightning from '~icons/mdi/lightning-bolt';
import IconFire from '~icons/mdi/fire';
import IconLock from '~icons/mdi/shield-lock';
import IconBomb from '~icons/mdi/bomb';

interface TutorialModalProps {
  onClose: () => void;
}

const slides = [
  {
    title: 'The Daily News',
    description:
      'Your job is to publish the truth. Slice these standard news cards before they fall off the screen to earn points.',
    card: (
      <div className="w-64 h-32 bg-[#f4f0e6] border-4 border-black relative p-3 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="border-b-2 border-black pb-1 mb-2">
          <span className="text-blue-600 font-bold text-xs font-mono uppercase">Reuters</span>
        </div>
        <div className="font-bold text-lg font-serif leading-tight">
          Global Markets Rally Amid Tech Surge
        </div>
      </div>
    ),
  },
  {
    title: 'Breaking News',
    description:
      "Fast-moving, high-value targets. Slice these to earn 5x the normal points! Don't let them drop.",
    card: (
      <div className="w-64 h-32 bg-[#ffb800] border-4 border-black relative p-3 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-center">
          <span className="text-black font-bold text-xs font-mono uppercase">AP News</span>
          <div className="bg-black text-[#ffb800] px-2 py-0.5 flex items-center gap-1 text-xs font-bold">
            <IconLightning /> BREAKING
          </div>
        </div>
        <div className="font-bold text-lg font-serif leading-tight">
          Unexpected Election Results Announced
        </div>
      </div>
    ),
  },
  {
    title: 'Satire Bombs',
    description:
      'DO NOT SLICE! If you publish a satire article, you will be instantly fired. Let these fall off the screen safely.',
    card: (
      <div className="w-64 h-32 bg-[#ff2a00] border-4 border-black relative p-3 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-center">
          <span className="text-black font-bold text-xs font-mono uppercase">The Onion</span>
          <div className="bg-white text-[#000000] px-2 py-0.5 flex items-center gap-1 text-xs font-bold">
            <IconBomb /> SATIRE
          </div>
        </div>
        <div className="font-bold text-lg font-serif leading-tight">
          Man Realizes He Is Actually Two Kids In Trenchcoat
        </div>
      </div>
    ),
  },
  {
    title: 'Clickbait Swarms',
    description:
      "Slicing clickbait won't hurt you, but it will spawn a swarm of tiny, erratic mini-articles that clutter your screen.",
    card: (
      <div className="w-64 h-32 bg-[#ffff00] border-4 border-[#ff2a00] relative p-3 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-center">
          <span className="text-black font-bold text-xs font-mono uppercase">BuzzFeed</span>
          <div className="bg-[#ff2a00] text-white px-2 py-0.5 flex items-center gap-1 text-xs font-bold">
            <IconFire /> CLICKBAIT
          </div>
        </div>
        <div className="font-bold text-lg font-serif leading-tight">
          10 Things You Won't Believe Actually Happened
        </div>
      </div>
    ),
  },
  {
    title: 'Paywall Shields',
    description:
      'Rare defensive items. Slicing one grants a shield that absorbs your next mistake (dropping real news or hitting a bomb).',
    card: (
      <div className="w-64 h-32 bg-[#22c55e] border-4 border-[#166534] relative p-3 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-center">
          <span className="text-black font-bold text-xs font-mono uppercase">NYT</span>
          <div className="bg-[#166534] text-white px-2 py-0.5 flex items-center gap-1 text-xs font-bold">
            <IconLock /> PAYWALL
          </div>
        </div>
        <div className="font-bold text-lg font-serif leading-tight">
          Exclusive Investigative Report Revealed
        </div>
      </div>
    ),
  },
  {
    title: 'Fact Check & Echo Chambers',
    description:
      'When stuck in the dark fog of an Echo Chamber, use your FACT CHECK ability [Spacebar / Bottom Button] to slow time and pierce the fog!',
    card: (
      <div className="w-full max-w-xs h-32 bg-black border-4 border-[#00ffff] relative p-4 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.5)]">
        <div className="text-[#00ffff] font-black text-2xl tracking-widest uppercase flex items-center gap-2 animate-pulse">
          <IconLightning className="w-8 h-8" /> Fact Check
        </div>
      </div>
    ),
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((i) => (i + 1) % slides.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + slides.length) % slides.length);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.85)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#f4f0e6] shadow-[16px_16px_0px_0px_var(--nn-signal)] border-4 border-black flex flex-col h-[80vh] sm:h-auto sm:min-h-[500px]">
        {/* Header */}
        <div className="bg-black text-white p-3 flex justify-between items-center border-b-4 border-black shrink-0">
          <span className="font-mono font-bold tracking-widest uppercase text-sm">
            The Daily Briefing
          </span>
          <button onClick={onClose} className="hover:text-[var(--nn-signal)] transition-colors">
            <IconClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
          {/* Card Showcase */}
          <div className="h-48 w-full flex items-center justify-center mb-8">
            <div
              key={currentIndex}
              className="animate-in slide-in-from-right-8 fade-in duration-300"
            >
              {slides[currentIndex].card}
            </div>
          </div>

          {/* Text Info */}
          <div className="text-center max-w-md h-32 flex flex-col items-center justify-start">
            <h2 className="text-3xl font-[Anton] uppercase tracking-wide mb-3">
              {slides[currentIndex].title}
            </h2>
            <p className="text-black/70 font-bold font-mono text-sm leading-relaxed">
              {slides[currentIndex].description}
            </p>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t-4 border-black p-4 flex justify-between items-center bg-white shrink-0">
          <button
            onClick={prev}
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            <IconChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex gap-2">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 border-2 border-black transition-colors ${i === currentIndex ? 'bg-[var(--nn-signal)]' : 'bg-transparent'}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
          >
            <IconChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
