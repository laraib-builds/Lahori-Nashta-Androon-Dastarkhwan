import React, { useEffect, useMemo, useState } from 'react';
import { Award, BookOpen, RotateCcw, Sparkles, Star } from 'lucide-react';
import { GAME_ASSETS } from '../data/assets';
import { CHAI_RECIPES } from '../data/recipes';
import { PAKISTANI_STICKERS } from '../data/stickers';
import { buildLocalVerdict, fetchDastarkhwanVerdict } from '../services/geminiService';
import {
  ChaiState,
  DastarkhwanVerdict,
  FamilyCraving,
  FamilyMemberId,
  KitchenState,
  NashtaRecipe,
  ScoreBreakdown,
} from '../types/game';
import { soundEngine } from '../utils/sound';
import { StickerArt } from './StickerArt';

interface DastarkhwanStageProps {
  recipe: NashtaRecipe;
  kitchenState: KitchenState;
  chaiState: ChaiState;
  craving: FamilyCraving;
  newlyUnlockedStickerId: string | null;
  onPlayAgain: () => void;
  onOpenScrapbook: () => void;
}

const EXTRAS = [
  { id: 'achar', label: 'Achar Katori', urdu: 'Khatta Aam Achar' },
  { id: 'chutney', label: 'Sabz Chutney', urdu: 'Pudina & Hari Mirch' },
  { id: 'extra-chai', label: 'Extra Chai Kettle', urdu: 'Garma Garam Refill' },
];

const FAMILY_ORDER: FamilyMemberId[] = ['Dadi', 'Abbu', 'Ammi', 'Chotu'];

export const DastarkhwanStage: React.FC<DastarkhwanStageProps> = ({
  recipe,
  kitchenState,
  chaiState,
  craving,
  newlyUnlockedStickerId,
  onPlayAgain,
  onOpenScrapbook,
}) => {
  const chaiRecipe = useMemo(
    () => CHAI_RECIPES.find((c) => c.id === chaiState.selectedChaiId) ?? CHAI_RECIPES[0],
    [chaiState.selectedChaiId]
  );

  const [extrasServed, setExtrasServed] = useState<string[]>([]);
  const [visibleBubbleCount, setVisibleBubbleCount] = useState<number>(1);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [portraitErrors, setPortraitErrors] = useState<Record<string, boolean>>({});

  const dishState = useMemo(() => {
    if (kitchenState.burnLevel >= 45) return 'burnt';
    if (kitchenState.cookProgress < recipe.targetCookMin) return 'undercooked';
    if (kitchenState.cookProgress >= 85) return 'crispy';
    return 'golden';
  }, [kitchenState.burnLevel, kitchenState.cookProgress, recipe.targetCookMin]);

  const chaiAccuracy = useMemo(() => {
    const pattiDiff = Math.abs(chaiState.pattiScoops - chaiRecipe.targetPattiScoops);
    const cheeniDiff = Math.abs(chaiState.cheeniScoops - chaiRecipe.targetCheeniScoops);
    if (pattiDiff === 0 && cheeniDiff === 0) return 'exact';
    if (pattiDiff <= 1 && cheeniDiff <= 1) return 'balanced';
    return 'quirky';
  }, [chaiState.pattiScoops, chaiState.cheeniScoops, chaiRecipe]);

  const scoreBreakdown: ScoreBreakdown = useMemo(() => {
    const dishCraft =
      dishState === 'golden' || dishState === 'crispy'
        ? 35
        : dishState === 'burnt'
          ? 18
          : 22;
    const chaiMastery =
      chaiAccuracy === 'exact' ? 25 : chaiAccuracy === 'balanced' ? 19 : 13;
    const boilSaveAndPhainti =
      (chaiState.boilSaved ? 10 : chaiState.boilOverOccurred ? 2 : 6) +
      Math.min(10, chaiState.phaintiCount * 2);
    const naniGarnish =
      (kitchenState.garnishAdded ? 6 : 0) + (chaiState.garnishAdded ? 4 : 0);
    const hospitalityExtras = Math.min(10, extrasServed.length * 4);
    const cravingBonus =
      craving.dishId === recipe.id || craving.chaiId === chaiRecipe.id ? 5 : 0;

    const total = Math.min(
      100,
      dishCraft +
        chaiMastery +
        boilSaveAndPhainti +
        naniGarnish +
        hospitalityExtras +
        cravingBonus
    );
    const stars = total >= 90 ? 5 : total >= 76 ? 4 : total >= 60 ? 3 : total >= 42 ? 2 : 1;

    return {
      dishCraft,
      chaiMastery,
      boilSaveAndPhainti,
      naniGarnish,
      hospitalityExtras,
      cravingBonus,
      total,
      stars,
    };
  }, [
    dishState,
    chaiAccuracy,
    chaiState.boilSaved,
    chaiState.boilOverOccurred,
    chaiState.phaintiCount,
    chaiState.garnishAdded,
    kitchenState.garnishAdded,
    extrasServed.length,
    craving.dishId,
    craving.chaiId,
    recipe.id,
    chaiRecipe.id,
  ]);

  const [verdict, setVerdict] = useState<DastarkhwanVerdict>(() =>
    buildLocalVerdict({
      dishName: recipe.title,
      dishState,
      garnishAdded: kitchenState.garnishAdded,
      chaiName: chaiRecipe.title,
      chaiAccuracy,
      boilSaved: chaiState.boilSaved,
      phaintiCount: chaiState.phaintiCount,
      extrasServed: [],
      totalScore: scoreBreakdown.total,
    })
  );

  // Fetch context-aware Gemini family dialogue asynchronously without blocking UI
  useEffect(() => {
    let active = true;
    fetchDastarkhwanVerdict({
      dishName: recipe.title,
      dishState,
      garnishAdded: kitchenState.garnishAdded,
      chaiName: chaiRecipe.title,
      chaiAccuracy,
      boilSaved: chaiState.boilSaved,
      phaintiCount: chaiState.phaintiCount,
      extrasServed,
      cravingMatched: craving.dishId === recipe.id || craving.chaiId === chaiRecipe.id,
      totalScore: scoreBreakdown.total,
    }).then((res) => {
      if (active) setVerdict(res);
    });
    return () => {
      active = false;
    };
  }, [
    recipe.title,
    recipe.id,
    dishState,
    kitchenState.garnishAdded,
    chaiRecipe.title,
    chaiRecipe.id,
    chaiAccuracy,
    chaiState.boilSaved,
    chaiState.phaintiCount,
    extrasServed,
    craving.dishId,
    craving.chaiId,
    scoreBreakdown.total,
  ]);

  // Sequential comic-book panel reveal
  useEffect(() => {
    if (visibleBubbleCount >= 4) return;
    const t = setTimeout(() => {
      soundEngine.playTap();
      setVisibleBubbleCount((c) => Math.min(4, c + 1));
    }, 1100);
    return () => clearTimeout(t);
  }, [visibleBubbleCount]);

  const handleServeExtra = (extraId: string) => {
    if (extrasServed.includes(extraId)) return;
    soundEngine.playChime();
    setExtrasServed((prev) => [...prev, extraId]);
  };

  const unlockedSticker = PAKISTANI_STICKERS.find(
    (s) => s.id === (newlyUnlockedStickerId ?? recipe.unlockStickerId)
  );

  const cupColor =
    chaiRecipe.id === 'kashmiri-chai' && chaiState.pinkShockTriggered
      ? '#E88DA8'
      : chaiRecipe.liquidColorFinish;

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2C1B12]/15">
        <div>
          <p className="text-xs font-semibold text-[#B84A2E]">
            Step 4 of 4 · Androon Lahore Dastarkhwan
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1B12]">
            Family Morning Tasting
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!showScoreModal && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccessFanfare();
                setVisibleBubbleCount(4);
                setShowScoreModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D98A1E] hover:bg-[#C27814] text-[#2C1B12] text-xs sm:text-sm font-bold border-2 border-[#2C1B12] shadow-[3px_3px_0px_#2C1B12] whitespace-nowrap"
            >
              <Award className="w-4 h-4" />
              <span>Reveal Family Verdict</span>
            </button>
          )}
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F3E8D6] text-[#2C1B12] text-xs font-bold border-2 border-[#2C1B12] whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Round</span>
          </button>
        </div>
      </div>

      {/* Comic-Book Family Grid + Embroidered Dastarkhwan Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left/Right Comic Panels: Dadi & Abbu */}
        <div className="lg:col-span-4 space-y-4">
          {(['Dadi', 'Abbu'] as FamilyMemberId[]).map((member, idx) => {
            const reaction =
              verdict.reactions.find((r) => r.speaker === member) ?? verdict.reactions[idx];
            const revealed = visibleBubbleCount >= idx + 1;

            return (
              <div
                key={member}
                className="comic-panel rounded-2xl bg-[#FFFDF9] p-3.5 flex items-start gap-3.5"
              >
                <div className="w-20 h-20 rounded-xl border-2 border-[#2C1B12] overflow-hidden shrink-0 bg-[#FBF6EE]">
                  {!portraitErrors[member] ? (
                    <img
                      src={GAME_ASSETS.portraits[member]}
                      alt={`${member} comic-book portrait`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setPortraitErrors((prev) => ({ ...prev, [member]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-[#2C1B12]">
                      {member}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#B84A2E]">{member}</div>
                  {revealed && reaction ? (
                    <div className="comic-bubble rounded-xl bg-[#FFF8EB] px-3 py-2 mt-1">
                      <p className="text-xs font-bold text-[#2C1B12] leading-snug">
                        “{reaction.romanUrdu}”
                      </p>
                      <p className="text-[11px] text-[#5A4234] mt-1">
                        {reaction.english}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#7B5E4B] italic mt-2">
                      Taking a warm bite…
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Centerpiece: Embroidered Dastarkhwan Table with Player's Actual Cooked Dish & Chai */}
        <div className="lg:col-span-4 rounded-2xl border-2 border-[#2C1B12] shadow-[5px_5px_0px_#2C1B12] overflow-hidden bg-[#881337]">
          {/* Embroidered Dastarkhwan Cloth Pattern */}
          <div className="p-4 sm:p-5 bg-[radial-gradient(#D98A1E_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="rounded-xl bg-[#FBF6EE] border-2 border-[#2C1B12] p-4 text-center">
              <div className="text-[11px] font-bold tracking-wide text-[#1E6B4B]">
                Dastarkhwan Centerpiece · {dishState === 'burnt' ? 'Extra Toasted' : 'Garma Garam'}
              </div>

              {/* Plated Nashta + Chai SVG reflecting actual player choices */}
              <svg viewBox="0 0 260 155" className="w-full max-w-[260px] mx-auto my-2" aria-label="Your plated Nashta and Chai">
                {/* Main Ceramic Platter */}
                <ellipse cx="105" cy="90" rx="82" ry="44" fill="#FFFFFF" stroke="#2C1B12" strokeWidth="2.5" />
                <ellipse cx="105" cy="90" rx="68" ry="34" fill="#FFF8EB" stroke="#D98A1E" strokeWidth="1.5" />

                {/* Dish Visuals Matched to Cooked State */}
                {recipe.cookware === 'tawa' ? (
                  <g>
                    <circle
                      cx="84"
                      cy="88"
                      r="26"
                      fill={dishState === 'burnt' ? '#7C2D12' : '#D99B52'}
                      stroke="#2C1B12"
                      strokeWidth="2"
                    />
                    <circle
                      cx="126"
                      cy="88"
                      r="20"
                      fill={recipe.id === 'masala-omelette' ? '#FACC15' : '#FFFFFF'}
                      stroke="#2C1B12"
                      strokeWidth="2"
                    />
                    {recipe.id !== 'masala-omelette' && (
                      <circle
                        cx="126"
                        cy="88"
                        r="9"
                        fill={recipe.id === 'anda-half-fry' ? '#F59E0B' : '#EA580C'}
                      />
                    )}
                  </g>
                ) : (
                  <g>
                    <ellipse
                      cx="95"
                      cy="86"
                      rx="36"
                      ry="22"
                      fill={
                        recipe.id === 'bong-paye'
                          ? '#881337'
                          : recipe.id === 'halwa-poori'
                            ? '#EA580C'
                            : '#B45309'
                      }
                      stroke="#2C1B12"
                      strokeWidth="2"
                    />
                    <ellipse cx="136" cy="96" rx="22" ry="15" fill="#E6B87D" stroke="#2C1B12" strokeWidth="2" />
                  </g>
                )}

                {/* Nani Ka Secret Garnish if added */}
                {kitchenState.garnishAdded && (
                  <g>
                    <circle cx="96" cy="82" r="3.2" fill="#16A34A" />
                    <circle cx="110" cy="92" r="3.2" fill="#FDE047" />
                    <circle cx="88" cy="94" r="3" fill="#16A34A" />
                  </g>
                )}

                {/* Actual Chai Cup */}
                <g transform="translate(182, 54)">
                  <ellipse cx="28" cy="48" rx="26" ry="10" fill="#FFFFFF" stroke="#2C1B12" strokeWidth="2" />
                  <path
                    d="M10 18 L46 18 L42 44 C40 50 16 50 14 44 Z"
                    fill="#FFFDF9"
                    stroke="#2C1B12"
                    strokeWidth="2"
                  />
                  <path d="M45 24 C55 24 55 38 43 38" fill="none" stroke="#2C1B12" strokeWidth="2.4" />
                  <ellipse cx="28" cy="18" rx="18" ry="6" fill={cupColor} stroke="#2C1B12" strokeWidth="1.8" />
                  {chaiState.phaintiCount >= 2 && (
                    <ellipse cx="28" cy="18" rx="12" ry="3.5" fill="#FFFDF9" opacity="0.65" />
                  )}
                  {chaiState.garnishAdded && (
                    <>
                      <circle cx="24" cy="18" r="2" fill="#84CC16" />
                      <circle cx="32" cy="17" r="2" fill="#FEF08A" />
                    </>
                  )}
                </g>

                {/* Extras served on table */}
                {extrasServed.includes('achar') && (
                  <circle cx="48" cy="126" r="11" fill="#DC2626" stroke="#2C1B12" strokeWidth="1.8" />
                )}
                {extrasServed.includes('chutney') && (
                  <circle cx="80" cy="130" r="11" fill="#16A34A" stroke="#2C1B12" strokeWidth="1.8" />
                )}
                {extrasServed.includes('extra-chai') && (
                  <rect x="195" y="112" width="24" height="22" rx="6" fill="#D97706" stroke="#2C1B12" strokeWidth="1.8" />
                )}
              </svg>

              <div className="text-xs font-bold text-[#2C1B12]">
                {recipe.title.split(':')[0]} + {chaiRecipe.title}
              </div>

              {/* Interactive Tap-to-Serve Hospitality Extras */}
              <div className="mt-3 pt-3 border-t border-[#2C1B12]/15">
                <div className="text-[11px] font-bold text-[#7B5E4B] mb-2">
                  Tap to Serve Table Extras (+Bonus)
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {EXTRAS.map((ex) => {
                    const served = extrasServed.includes(ex.id);
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleServeExtra(ex.id)}
                        disabled={served}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors whitespace-nowrap ${
                          served
                            ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                            : 'bg-[#FFF8EB] border-[#2C1B12]/25 hover:border-[#2C1B12] text-[#2C1B12]'
                        }`}
                      >
                        {served ? `${ex.label} Served` : `+ ${ex.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Comic Panels: Ammi & Chotu */}
        <div className="lg:col-span-4 space-y-4">
          {(['Ammi', 'Chotu'] as FamilyMemberId[]).map((member, idx) => {
            const reactionIdx = idx + 2;
            const reaction =
              verdict.reactions.find((r) => r.speaker === member) ?? verdict.reactions[reactionIdx];
            const revealed = visibleBubbleCount >= reactionIdx + 1;

            return (
              <div
                key={member}
                className="comic-panel rounded-2xl bg-[#FFFDF9] p-3.5 flex items-start gap-3.5"
              >
                <div className="w-20 h-20 rounded-xl border-2 border-[#2C1B12] overflow-hidden shrink-0 bg-[#FBF6EE]">
                  {!portraitErrors[member] ? (
                    <img
                      src={GAME_ASSETS.portraits[member]}
                      alt={`${member} comic-book portrait`}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setPortraitErrors((prev) => ({ ...prev, [member]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-[#2C1B12]">
                      {member}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[#B84A2E]">{member}</div>
                  {revealed && reaction ? (
                    <div className="comic-bubble rounded-xl bg-[#FFF8EB] px-3 py-2 mt-1">
                      <p className="text-xs font-bold text-[#2C1B12] leading-snug">
                        “{reaction.romanUrdu}”
                      </p>
                      <p className="text-[11px] text-[#5A4234] mt-1">
                        {reaction.english}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#7B5E4B] italic mt-2">
                      Sipping garma garam chai…
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Score Breakdown + Chef Title + Newly Unlocked Die-Cut Pakistani Sticker */}
      {showScoreModal && (
        <section className="rounded-2xl bg-[#FFFDF9] border-2 border-[#2C1B12] shadow-[5px_5px_0px_#2C1B12] p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < scoreBreakdown.stars
                        ? 'fill-[#D98A1E] text-[#D98A1E]'
                        : 'text-[#2C1B12]/20'
                    }`}
                  />
                ))}
                <span className="ml-2 font-mono tabular-nums text-sm font-bold text-[#2C1B12]">
                  {scoreBreakdown.total}/100
                </span>
              </div>

              <div>
                <div className="text-xs font-bold text-[#B84A2E]">
                  Earned Chef Title
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C1B12]">
                  {verdict.chefTitle}
                </h2>
                <p className="text-xs text-[#5A4234] mt-1">{verdict.summaryNote}</p>
              </div>

              {/* Clean Tabular Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#FBF6EE] border border-[#2C1B12]/15">
                  <div className="text-[#7B5E4B]">Dish Craft</div>
                  <div className="font-mono tabular-nums font-bold text-[#2C1B12]">
                    {scoreBreakdown.dishCraft}/35
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FBF6EE] border border-[#2C1B12]/15">
                  <div className="text-[#7B5E4B]">Chai Balance</div>
                  <div className="font-mono tabular-nums font-bold text-[#2C1B12]">
                    {scoreBreakdown.chaiMastery}/25
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FBF6EE] border border-[#2C1B12]/15">
                  <div className="text-[#7B5E4B]">Boil Save & Phainti</div>
                  <div className="font-mono tabular-nums font-bold text-[#2C1B12]">
                    {scoreBreakdown.boilSaveAndPhainti}/20
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FBF6EE] border border-[#2C1B12]/15">
                  <div className="text-[#7B5E4B]">Nani Garnish</div>
                  <div className="font-mono tabular-nums font-bold text-[#2C1B12]">
                    {scoreBreakdown.naniGarnish}/10
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FBF6EE] border border-[#2C1B12]/15">
                  <div className="text-[#7B5E4B]">Dastarkhwan Extras</div>
                  <div className="font-mono tabular-nums font-bold text-[#2C1B12]">
                    {scoreBreakdown.hospitalityExtras}/10
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FBF6EE] border border-[#2C1B12]/15">
                  <div className="text-[#7B5E4B]">Craving Bonus</div>
                  <div className="font-mono tabular-nums font-bold text-[#1E6B4B]">
                    +{scoreBreakdown.cravingBonus}
                  </div>
                </div>
              </div>
            </div>

            {/* Newly Unlocked Pakistani Cultural Sticker */}
            {unlockedSticker && (
              <div className="md:col-span-5 rounded-2xl bg-[#FFF8EB] border-2 border-[#D98A1E] p-5 text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9A4E10] mb-2">
                  <Sparkles className="w-4 h-4 text-[#D98A1E]" />
                  <span>Pakistani Scrapbook Sticker Unlocked!</span>
                </div>
                <div style={{ transform: `rotate(${unlockedSticker.tiltDeg}deg)` }}>
                  <StickerArt stickerId={unlockedSticker.id} size={118} />
                </div>
                <h3 className="font-display text-lg font-bold text-[#2C1B12] mt-2">
                  {unlockedSticker.title}
                </h3>
                <p className="text-xs text-[#5A4234] mt-1">{unlockedSticker.story}</p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={onOpenScrapbook}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#2C1B12]/25 text-xs font-bold text-[#2C1B12] hover:bg-[#F3E8D6]"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Scrapbook</span>
                  </button>
                  <button
                    type="button"
                    onClick={onPlayAgain}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B84A2E] text-white text-xs font-bold hover:bg-[#9E3C23]"
                  >
                    <span>Cook Another Nashta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
