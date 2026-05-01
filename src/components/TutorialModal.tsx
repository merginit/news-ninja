import React, { useState } from 'react';
import IconClose from '~icons/mdi/close';
import IconChevronLeft from '~icons/mdi/chevron-left';
import IconChevronRight from '~icons/mdi/chevron-right';
import IconLightning from '~icons/mdi/lightning-bolt';
import IconFire from '~icons/mdi/fire';
import IconLock from '~icons/mdi/shield-lock';
import IconBomb from '~icons/mdi/bomb';
import IconShieldStar from '~icons/mdi/shield-star';
import IconTrendingUp from '~icons/mdi/trending-up';
import IconIncognito from '~icons/mdi/incognito';
import IconNoteEdit from '~icons/mdi/note-edit';
import IconSkull from '~icons/mdi/skull';
import IconFileQuestion from '~icons/mdi/file-question';

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
    title: 'Ad-Blocker Shield',
    description:
      'A rare power-up that makes your blade temporarily phase through Satire Bombs without detonating them, allowing you to slice aggressively without fear.',
    card: (
      <div className="w-64 h-32 bg-[#39FF14] border-4 border-[#1B5E20] relative p-3 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-center">
          <span className="text-black font-bold text-xs font-mono uppercase">Sponsored</span>
          <div className="bg-[#1B5E20] text-white px-2 py-0.5 flex items-center gap-1 text-xs font-bold">
            <IconShieldStar /> AD-BLOCKER
          </div>
        </div>
        <div className="font-bold text-lg font-serif leading-tight text-black">
          Remove All Annoying Popups Now!
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
  {
    title: 'Classified Information',
    description:
      'Mysterious documents that reveal their true nature at the peak of their flight. They might contain a Massive Leak, a Shield, or a deadly Satire Bomb! Wait to see what they are or slice them early.',
    card: (
      <div className="w-64 h-32 bg-[#E6C280] border-4 border-black relative p-3 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="border-b-2 border-black pb-1 mb-2 flex justify-between items-center">
          <span className="text-black font-bold text-xs font-mono uppercase">Anonymous</span>
          <div className="bg-black text-[#E6C280] px-2 py-0.5 flex items-center gap-1 text-xs font-bold">
            <IconFileQuestion /> TOP SECRET
          </div>
        </div>
        <div className="font-bold text-lg font-serif leading-tight">
          CLASSIFIED INFORMATION
        </div>
      </div>
    ),
  },
  {
    title: 'Trending Zone',
    description:
      'A glowing blue holographic zone that randomly appears on your screen. Any news sliced inside this zone awards 3x points! Surf the trend to rack up massive combos.',
    card: (
      <div className="w-full max-w-xs h-32 border-4 border-[#00ffff] border-dashed relative p-4 flex items-center justify-center bg-[rgba(0,255,255,0.1)]">
        <div className="text-[#00ffff] font-black text-2xl tracking-widest uppercase flex items-center gap-2 animate-pulse">
          <IconTrendingUp className="w-8 h-8" /> TRENDING TOPIC
        </div>
      </div>
    ),
  },
  {
    title: 'Deep Fakes',
    description:
      'A vicious cyber-attack that visually inverts your entire screen and controls! Trust your instincts and keep slicing carefully until the system recalibrates.',
    card: (
      <div className="w-full max-w-xs h-32 bg-white border-4 border-black relative p-4 flex items-center justify-center invert">
        <div className="text-[#ff2a00] font-black text-2xl tracking-widest uppercase flex flex-col items-center gap-2">
          <div className="flex items-center gap-2"><IconIncognito className="w-8 h-8" /> DEEP FAKE</div>
          <div className="text-black text-sm">SENSORS INVERTED</div>
        </div>
      </div>
    ),
  },
  {
    title: 'Retractions',
    description:
      'Sometimes news is published with errors. Look for the yellow REDACTED sticky note on articles. Slice directly through the note to catch the retraction for bonus points, otherwise you lose points!',
    card: (
      <div className="w-64 h-32 bg-[#f4f0e6] border-4 border-black relative p-3 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="border-b-2 border-black pb-1 mb-2">
          <span className="text-blue-600 font-bold text-xs font-mono uppercase">Local News</span>
        </div>
        <div className="font-bold text-lg font-serif leading-tight">
          Mayor Opens New Dog Park
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ffeb3b] text-black font-bold font-mono text-sm px-2 py-1 rotate-[-10deg] shadow-md border border-black flex items-center gap-1">
          <IconNoteEdit /> REDACTED
        </div>
      </div>
    ),
  },
  {
    title: 'Hostile Takeover',
    description:
      'A massive corporate boss attempting to buy out your newsroom! It will fire projectiles at you. Slice the projectiles to reflect them back and deplete its health bar to survive.',
    card: (
      <div className="w-full max-w-xs h-32 bg-[#ff2a00] border-[6px] border-black relative p-4 flex flex-col items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-white font-black text-2xl tracking-widest uppercase flex items-center gap-2 mb-2">
          <IconSkull className="w-8 h-8" /> HOSTILE TAKEOVER
        </div>
        <div className="w-3/4 h-3 bg-black relative">
           <div className="absolute top-0.5 left-0.5 bottom-0.5 w-[70%] bg-[#22c55e]"></div>
        </div>
      </div>
    ),
  },
  {
    title: 'News Flash',
    description:
      'A sudden Breaking News mode where cards spawn at 3x the normal rate for a few seconds! Time slows down slightly, giving you the perfect chance to build a massive Godlike Combo.',
    card: (
      <div className="w-full max-w-xs h-32 bg-white border-4 border-[#ff2a00] relative p-4 flex flex-col items-center justify-center animate-pulse shadow-[0_0_20px_rgba(255,42,0,0.5)]">
        <div className="text-[#ff2a00] font-black text-2xl tracking-widest uppercase flex items-center gap-2">
          <IconLightning className="w-8 h-8" /> NEWS FLASH
        </div>
        <div className="text-[#ff2a00] font-bold text-sm mt-2">
          3X SPAWN RATE ACTIVE
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
