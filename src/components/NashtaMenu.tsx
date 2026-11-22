import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { NASHTA_RECIPES } from '../data/recipes';
import { PAKISTANI_STICKERS } from '../data/stickers';
import { DishId, FamilyCraving } from '../types/game';
import { StickerArt } from './StickerArt';

interface NashtaMenuProps {
  craving: FamilyCraving;
  unlockedStickers: string[];
  onSelectDish: (dishId: DishId) => void;
}

const DishIllustration: React.FC<{ dishId: DishId }> = ({ dishId }) => {
  return (
    <svg viewBox="0 0 120 76" className="w-24 h-16 shrink-0" aria-hidden="true">
      <ellipse cx="60" cy="46" rx="46" ry="22" fill="#FFFDF9" stroke="#2C1B12" strokeWidth="2.2" />
      <ellipse cx="60" cy="46" rx="38" ry="17" fill="#FBF6EE" stroke="#D9C5AD" strokeWidth="1.2" />

      {dishId === 'anda-half-fry' && (
        <g>
          {/* Lachha Paratha */}
          <circle cx="44" cy="44" r="18" fill="#E6B87D" stroke="#2C1B12" strokeWidth="1.8" />
          <path d="M34 44 Q44 34 54 44 Q44 54 34 44" fill="none" stroke="#92400E" strokeWidth="1.4" />
          {/* Sunny-side up egg */}
          <path
            d="M58 36 C70 30 88 34 88 46 C88 56 72 58 60 54 C52 50 52 40 58 36 Z"
            fill="#FFFFFF"
            stroke="#2C1B12"
            strokeWidth="1.6"
          />
          <circle cx="73" cy="45" r="7.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.4" />
          <circle cx="71" cy="43" r="2" fill="#FEF3C7" />
        </g>
      )}

      {dishId === 'anda-full-fry' && (
        <g>
          <circle cx="44" cy="44" r="18" fill="#D99B52" stroke="#2C1B12" strokeWidth="1.8" />
          <path d="M35 39 L53 49 M37 49 L51 39" stroke="#92400E" strokeWidth="1.3" />
          <ellipse cx="73" cy="45" rx="16" ry="12" fill="#FEF9C3" stroke="#2C1B12" strokeWidth="1.6" />
          <circle cx="73" cy="45" r="6.5" fill="#EA580C" opacity="0.85" />
          <circle cx="70" cy="43" r="1.3" fill="#DC2626" />
          <circle cx="77" cy="47" r="1.3" fill="#DC2626" />
        </g>
      )}

      {dishId === 'masala-omelette' && (
        <g>
          {/* Tandoori Naan */}
          <ellipse cx="44" cy="44" rx="18" ry="14" fill="#E5B97F" stroke="#2C1B12" strokeWidth="1.8" />
          <circle cx="38" cy="40" r="1.5" fill="#78350F" />
          <circle cx="47" cy="46" r="1.5" fill="#78350F" />
          {/* Folded Omelette */}
          <path
            d="M55 48 C55 34 88 34 88 48 Z"
            fill="#FACC15"
            stroke="#2C1B12"
            strokeWidth="1.8"
          />
          <circle cx="67" cy="43" r="2" fill="#DC2626" />
          <circle cx="76" cy="44" r="1.8" fill="#15803D" />
          <circle cx="71" cy="40" r="1.6" fill="#FFFFFF" />
        </g>
      )}

      {dishId === 'lahori-channay' && (
        <g>
          {/* Bowl of Channay */}
          <ellipse cx="66" cy="44" rx="22" ry="14" fill="#92400E" stroke="#2C1B12" strokeWidth="1.8" />
          <ellipse cx="66" cy="43" rx="18" ry="10" fill="#B45309" />
          <circle cx="58" cy="42" r="3" fill="#FDE68A" />
          <circle cx="66" cy="45" r="3" fill="#FDE68A" />
          <circle cx="73" cy="41" r="3" fill="#FDE68A" />
          <circle cx="63" cy="39" r="2.6" fill="#FDE68A" />
          {/* Kulcha side */}
          <ellipse cx="38" cy="47" rx="14" ry="11" fill="#E6B87D" stroke="#2C1B12" strokeWidth="1.8" />
        </g>
      )}

      {dishId === 'halwa-poori' && (
        <g>
          {/* Fluffy Puffed Poori */}
          <ellipse cx="43" cy="43" rx="19" ry="14" fill="#F59E0B" stroke="#2C1B12" strokeWidth="1.8" />
          <ellipse cx="41" cy="40" rx="11" ry="6" fill="#FDE68A" opacity="0.65" />
          {/* Sooji Halwa Katori */}
          <circle cx="76" cy="38" r="11" fill="#EA580C" stroke="#2C1B12" strokeWidth="1.6" />
          <circle cx="76" cy="36" r="2" fill="#84CC16" />
          {/* Aloo Tarkari Katori */}
          <circle cx="75" cy="54" r="10" fill="#CA8A04" stroke="#2C1B12" strokeWidth="1.6" />
          <circle cx="73" cy="53" r="2.5" fill="#FEF08A" />
        </g>
      )}

      {dishId === 'bong-paye' && (
        <g>
          {/* Rich Paye Bowl */}
          <ellipse cx="65" cy="44" rx="23" ry="14" fill="#7C2D12" stroke="#2C1B12" strokeWidth="1.8" />
          <ellipse cx="65" cy="43" rx="19" ry="10" fill="#991B1B" />
          <ellipse cx="65" cy="43" rx="9" ry="5" fill="#B45309" stroke="#FDE68A" strokeWidth="1" />
          <path d="M58 41 L64 44" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="71" cy="42" r="2" fill="#16A34A" />
          {/* Roghni Naan */}
          <ellipse cx="37" cy="46" rx="14" ry="11" fill="#D99B52" stroke="#2C1B12" strokeWidth="1.8" />
        </g>
      )}
    </svg>
  );
};

export const NashtaMenu: React.FC<NashtaMenuProps> = ({
  craving,
  unlockedStickers,
  onSelectDish,
}) => {
  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header + Family Craving Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#2C1B12]/15">
        <div>
          <p className="text-xs font-semibold text-[#B84A2E]">
            Step 1 of 4 · Androon Lahore Morning Menu
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2C1B12] mt-1">
            Choose Today’s Lahori Nashta
          </h1>
          <p className="text-sm text-[#5A4234] mt-1">
            Pick any classic dish below—each recipe unlocks its own traditional Pakistani scrapbook sticker.
          </p>
        </div>

        <div className="bg-[#FFF8EB] border border-[#D98A1E]/60 rounded-xl px-4 py-3 max-w-md">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#9A4E10]">
            <Sparkles className="w-3.5 h-3.5 text-[#D98A1E]" />
            <span>{craving.requester}’s Morning Craving (+10 Bonus)</span>
          </div>
          <p className="text-xs text-[#2C1B12] font-medium mt-1">
            {craving.romanUrduNote}
          </p>
        </div>
      </div>

      {/* 6 Separate Nashta Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {NASHTA_RECIPES.map((recipe) => {
          const isCraved = craving.dishId === recipe.id;
          const sticker = PAKISTANI_STICKERS.find((s) => s.id === recipe.unlockStickerId);
          const stickerUnlocked = sticker ? unlockedStickers.includes(sticker.id) : false;

          return (
            <button
              key={recipe.id}
              type="button"
              onClick={() => onSelectDish(recipe.id)}
              className={`group text-left rounded-2xl p-5 bg-white border-2 transition-all duration-150 flex flex-col justify-between hover:-translate-y-0.5 ${
                isCraved
                  ? 'border-[#D98A1E] shadow-[4px_4px_0px_#D98A1E]'
                  : 'border-[#2C1B12] shadow-[4px_4px_0px_#2C1B12] hover:shadow-[6px_6px_0px_#2C1B12]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <DishIllustration dishId={recipe.id} />
                  {sticker && (
                    <div className="flex flex-col items-end">
                      <StickerArt
                        stickerId={sticker.id}
                        locked={!stickerUnlocked}
                        size={44}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-xs font-medium text-[#7B5E4B]">
                    {recipe.cookwareLabel} · {recipe.urduSubtitle}
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#2C1B12] mt-1 group-hover:text-[#B84A2E] transition-colors">
                    {recipe.title}
                  </h2>
                  <p className="text-xs text-[#5A4234] leading-relaxed mt-2">
                    {recipe.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2C1B12]/10 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1E6B4B]">
                  {isCraved ? `${craving.requester}’s Pick` : `${recipe.ingredients.length} Ingredients`}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B84A2E] group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
                  <span>Cook Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
