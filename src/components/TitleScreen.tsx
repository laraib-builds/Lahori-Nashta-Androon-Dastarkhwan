import React, { useEffect, useState } from 'react';
import { BookOpen, Flame, Volume2, VolumeX } from 'lucide-react';
import { GAME_ASSETS } from '../data/assets';
import { PAKISTANI_STICKERS } from '../data/stickers';
import { FamilyCraving } from '../types/game';
import { getRecipeById, CHAI_RECIPES } from '../data/recipes';

interface TitleScreenProps {
  craving: FamilyCraving;
  unlockedCount: number;
  isMuted: boolean;
  onStart: () => void;
  onOpenScrapbook: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  craving,
  unlockedCount,
  isMuted,
  onStart,
  onOpenScrapbook,
  onToggleMute,
}) => {
  const [imgError, setImgError] = useState(false);
  const dish = getRecipeById(craving.dishId);
  const chai = CHAI_RECIPES.find((c) => c.id === craving.chaiId) ?? CHAI_RECIPES[0];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2C1B12] flex flex-col justify-between">
      {!imgError ? (
        <img
          src={GAME_ASSETS.backdrop}
          alt="Sunlit Androon Lahore heritage kitchen overlooking minarets and morning kites"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A2D1C] via-[#9C4A2B] to-[#D98A1E]" />
      )}

      {/* Measured warm left scrim for 4.5:1 contrast over sunlit key art */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(95deg, rgba(28, 16, 10, 0.90) 0%, rgba(36, 21, 13, 0.72) 48%, rgba(28, 16, 10, 0.22) 100%)',
        }}
      />

      {/* Minimal utility corner controls */}
      <div className="relative z-10 flex items-center justify-end gap-2.5 p-5 sm:px-8">
        <button
          type="button"
          onClick={onOpenScrapbook}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FBF6EE]/95 text-[#2C1B12] text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap"
        >
          <BookOpen className="w-4 h-4 text-[#B84A2E]" />
          <span>Scrapbook ({unlockedCount}/{PAKISTANI_STICKERS.length})</span>
        </button>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          className="w-10 h-10 rounded-xl bg-[#FBF6EE]/95 text-[#2C1B12] flex items-center justify-center hover:bg-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#B84A2E]" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Hero Lockup + Start CTA */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 py-6 flex flex-col justify-center flex-1">
        <div className="max-w-xl">
          {/* Bespoke inline SVG Title Emblem */}
          <svg
            viewBox="0 0 360 92"
            className="w-72 sm:w-88 h-auto mb-3"
            role="img"
            aria-label="Lahori Nashta: Androon Dastarkhwan"
          >
            <path
              d="M8 22 Q180 2 352 22"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <text
              x="8"
              y="56"
              fill="#FBF6EE"
              fontFamily="Fraunces, Georgia, serif"
              fontWeight="700"
              fontSize="44"
              letterSpacing="-0.5"
            >
              Lahori Nashta
            </text>
            <text
              x="10"
              y="82"
              fill="#FCD34D"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              fontSize="16"
              letterSpacing="3.2"
            >
              ANDROON DASTARKHWAN
            </text>
          </svg>

          <p className="text-[#F5E6D3] text-base sm:text-lg leading-relaxed max-w-lg mb-6">
            Step into a sunlit Walled City kitchen. Cook crisp parathas, halwa poori, and channay from scratch, master chai phainti before boil-over, and serve the family around the morning dastarkhwan.
          </p>

          {/* Morning Family Craving Card */}
          <div className="bg-[#FBF6EE] border-2 border-[#2C1B12] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#2C1B12] mb-6">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-xs font-bold tracking-wide text-[#B84A2E]">
                Morning Order from {craving.requester} · {craving.headline}
              </span>
              <span className="text-xs text-[#7B5E4B] font-medium whitespace-nowrap">
                {dish.title.split(':')[0]} + {chai.title}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#2C1B12]">
              “{craving.romanUrduNote}”
            </p>
            <p className="text-xs text-[#5A4234] mt-1">
              {craving.englishMeaning}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#D98A1E] hover:bg-[#C27814] text-[#2C1B12] font-bold text-base border-2 border-[#2C1B12] shadow-[4px_4px_0px_#2C1B12] active:translate-y-0.5 transition-all whitespace-nowrap"
            >
              <Flame className="w-5 h-5" />
              <span>Enter Androon Kitchen</span>
            </button>
          </div>
        </div>
      </main>

      {/* Single flat control hint line */}
      <footer className="relative z-10 px-6 sm:px-10 pb-5">
        <p className="text-xs text-[#E7D8C5]/85 font-medium">
          Click or Drag ingredients · One-tap Aanch heat control · Enter / Space to Start · M to Mute
        </p>
      </footer>
    </div>
  );
};
