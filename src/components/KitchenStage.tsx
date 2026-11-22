import React, { useEffect, useMemo, useState } from 'react';
import { Check, Flame, Sparkles, Utensils } from 'lucide-react';
import { GAME_ASSETS } from '../data/assets';
import { HEAT_LABELS, HEAT_SPEED_MULTIPLIER } from '../data/recipes';
import { HeatLevel, KitchenState, NashtaRecipe } from '../types/game';
import { soundEngine } from '../utils/sound';
import { CookwareCanvas } from './CookwareCanvas';

interface KitchenStageProps {
  recipe: NashtaRecipe;
  kitchenState: KitchenState;
  onUpdateState: React.Dispatch<React.SetStateAction<KitchenState>>;
  onCompleteDish: () => void;
}

const HEAT_ORDER: HeatLevel[] = ['band', 'dheemi', 'darmiyani', 'tez'];

export const KitchenStage: React.FC<KitchenStageProps> = ({
  recipe,
  kitchenState,
  onUpdateState,
  onCompleteDish,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [backdropError, setBackdropError] = useState(false);

  const allIngredientsAdded = recipe.ingredients.every((ing) =>
    kitchenState.addedIngredients.includes(ing.id)
  );
  const mixDone = !recipe.requiresMix || kitchenState.isMixed;
  const flipDone = !recipe.requiresFlip || kitchenState.isFlipped;

  // Cooking progression simulation timer (only runs once at least 1 ingredient is in the cookware)
  useEffect(() => {
    if (kitchenState.addedIngredients.length === 0 || kitchenState.isPlated) {
      return;
    }

    const interval = setInterval(() => {
      onUpdateState((prev) => {
        if (prev.addedIngredients.length === 0 || prev.isPlated) return prev;
        const speed = HEAT_SPEED_MULTIPLIER[prev.heatLevel];
        // Base cook gain per 100ms tick
        const baseGain = allIngredientsAdded ? 1.45 * speed : 0.45 * speed;
        const nextProgress = Math.min(100, prev.cookProgress + baseGain);

        let nextBurn = prev.burnLevel;
        if (nextProgress >= 92 && prev.heatLevel === 'tez') {
          nextBurn = Math.min(100, prev.burnLevel + 2.1);
        } else if (nextProgress >= 96 && prev.heatLevel === 'darmiyani') {
          nextBurn = Math.min(100, prev.burnLevel + 1.1);
        }

        return {
          ...prev,
          cookProgress: nextProgress,
          burnLevel: nextBurn,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [kitchenState.addedIngredients.length, kitchenState.isPlated, allIngredientsAdded, onUpdateState]);

  const handleAddIngredient = (id: string) => {
    if (kitchenState.addedIngredients.includes(id)) return;
    soundEngine.playDrop();
    setTimeout(() => soundEngine.playSizzle(), 80);
    onUpdateState((prev) => {
      if (prev.addedIngredients.includes(id)) return prev;
      return {
        ...prev,
        addedIngredients: [...prev.addedIngredients, id],
      };
    });
  };

  const handleMix = () => {
    if (!allIngredientsAdded || kitchenState.isMixed) return;
    soundEngine.playTap();
    soundEngine.playSizzle();
    onUpdateState((prev) => ({ ...prev, isMixed: true }));
  };

  const handleFlip = () => {
    if (!allIngredientsAdded || !mixDone || kitchenState.isFlipped) return;
    soundEngine.playTap();
    soundEngine.playSizzle();
    onUpdateState((prev) => ({ ...prev, isFlipped: true }));
  };

  const handleAddGarnish = () => {
    if (!allIngredientsAdded || kitchenState.garnishAdded) return;
    soundEngine.playChime();
    onUpdateState((prev) => ({ ...prev, garnishAdded: true }));
  };

  const handleHeatChange = (level: HeatLevel) => {
    soundEngine.playTap();
    onUpdateState((prev) => ({ ...prev, heatLevel: level }));
  };

  const handleDropItem = (itemType: string, itemId: string) => {
    if (itemType === 'ingredient') handleAddIngredient(itemId);
    if (itemType === 'tool' && itemId === 'mix') handleMix();
    if (itemType === 'tool' && itemId === 'flip') handleFlip();
    if (itemType === 'garnish') handleAddGarnish();
  };

  const canPlate =
    allIngredientsAdded &&
    mixDone &&
    flipDone &&
    kitchenState.cookProgress >= recipe.targetCookMin;

  // Dynamic contextual Roman Urdu + English instruction banner right above the stove
  const promptBanner = useMemo(() => {
    const missing = recipe.ingredients.find(
      (ing) => !kitchenState.addedIngredients.includes(ing.id)
    );
    if (missing) {
      return {
        urdu: `${recipe.cookwareLabel} par ${missing.label} dalein`,
        english: `Tap or drag ${missing.label} (${missing.urduHint}) onto the ${recipe.cookwareLabel}`,
      };
    }
    if (!mixDone) {
      return {
        urdu: `${recipe.mixLabel} karein!`,
        english: `Tap or drag the spoon to stir & roast (${recipe.mixLabel})`,
      };
    }
    if (!flipDone) {
      return {
        urdu: `${recipe.flipLabel}!`,
        english: `Tap or drag the spatula to flip before it over-browns`,
      };
    }
    if (kitchenState.heatLevel === 'band' && kitchenState.cookProgress < recipe.targetCookMin) {
      return {
        urdu: 'Aanch thori tez karein!',
        english: 'Heat is on Band (0.1x) — switch to Dheemi or Darmiyani Aanch to finish cooking',
      };
    }
    if (kitchenState.cookProgress < recipe.targetCookMin) {
      return {
        urdu: 'Sizzling & Bhunai chal rahi hai…',
        english: `Cooking to golden perfection (${Math.round(kitchenState.cookProgress)}% / ${recipe.targetCookMin}% needed)`,
      };
    }
    if (!kitchenState.garnishAdded) {
      return {
        urdu: 'Nani Ka Secret Garnish dalein ya Plate Karein!',
        english: `Add ${recipe.garnish.label} for bonus family hearts, then serve!`,
      };
    }
    return {
      urdu: 'Garma Garam Tayyar! Plate Karein!',
      english: 'Your Lahori Nashta is sizzling hot—tap Plate Dish to head to Chai Corner!',
    };
  }, [
    recipe,
    kitchenState.addedIngredients,
    kitchenState.heatLevel,
    kitchenState.cookProgress,
    kitchenState.garnishAdded,
    mixDone,
    flipDone,
  ]);

  const donenessLabel =
    kitchenState.burnLevel >= 45
      ? 'Thori Jali (Overdone)'
      : kitchenState.cookProgress >= recipe.targetCookMin
        ? 'Garma Garam Tayyar (Ready!)'
        : kitchenState.cookProgress >= 35
          ? 'Pak Rahi Hai (Cooking)'
          : kitchenState.addedIngredients.length > 0
            ? 'Shuruat (Warming)'
            : 'Khali (Empty)';

  return (
    <div className="relative flex-1 w-full overflow-hidden bg-[#F4E7D4]">
      {/* Warm Androon Lahore kitchen wall art backdrop */}
      {!backdropError && (
        <img
          src={GAME_ASSETS.backdrop}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={() => setBackdropError(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        />
      )}

      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
        {/* Top Floating Instruction Banner directly above counter */}
        <div className="bg-[#FFFDF9] border-2 border-[#2C1B12] rounded-2xl px-4 sm:px-5 py-3 shadow-[3px_3px_0px_#2C1B12] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[#B84A2E]">
              {recipe.title}
            </div>
            <div className="text-sm sm:text-base font-bold text-[#2C1B12]">
              {promptBanner.urdu}
            </div>
            <div className="text-xs text-[#5A4234]">{promptBanner.english}</div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-semibold text-[#7B5E4B]">Doneness</div>
              <div className="text-xs font-bold text-[#2C1B12] tabular-nums">
                {donenessLabel} · {Math.round(kitchenState.cookProgress)}%
              </div>
            </div>
            {canPlate && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playChime();
                  onCompleteDish();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E6B4B] hover:bg-[#155239] text-white text-xs sm:text-sm font-bold border-2 border-[#2C1B12] shadow-[3px_3px_0px_#2C1B12] transition-colors whitespace-nowrap"
              >
                <Utensils className="w-4 h-4" />
                <span>Plate Dish</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Kitchen Split: Dish-Specific Shelf + Live Cookware Counter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Shelf: ONLY ingredients & tools needed for THIS dish */}
          <aside className="lg:col-span-5 bg-[#FFFDF9] border-2 border-[#2C1B12] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#2C1B12] flex flex-col justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#2C1B12]">
                Kitchen Shelf · Samagri & Tools
              </h2>
              <p className="text-xs text-[#5A4234] mt-0.5">
                Click/tap or drag each item onto the {recipe.cookwareLabel}.
              </p>

              {/* Ingredients Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {recipe.ingredients.map((ing, idx) => {
                  const isAdded = kitchenState.addedIngredients.includes(ing.id);
                  const nextNeeded =
                    !isAdded &&
                    recipe.ingredients
                      .slice(0, idx)
                      .every((prevIng) => kitchenState.addedIngredients.includes(prevIng.id));

                  return (
                    <button
                      key={ing.id}
                      type="button"
                      draggable={!isAdded}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/item-type', 'ingredient');
                        e.dataTransfer.setData('text/item-id', ing.id);
                      }}
                      onClick={() => handleAddIngredient(ing.id)}
                      disabled={isAdded}
                      className={`min-h-[56px] p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2.5 ${
                        isAdded
                          ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B] cursor-default'
                          : nextNeeded
                            ? 'bg-[#FFF8EB] border-[#D98A1E] shadow-[2px_2px_0px_#D98A1E] hover:-translate-y-0.5 cursor-grab active:cursor-grabbing'
                            : 'bg-white border-[#2C1B12]/25 hover:border-[#2C1B12] cursor-grab active:cursor-grabbing'
                      }`}
                    >
                      <span
                        className="w-7 h-7 rounded-lg border border-[#2C1B12]/25 shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: ing.color }}
                      >
                        {isAdded && <Check className="w-4 h-4 text-[#2C1B12]" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#2C1B12] truncate">
                          {ing.label}
                        </div>
                        <div className="text-[11px] text-[#7B5E4B] truncate">
                          {isAdded ? 'Added' : ing.urduHint}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cooking Tools (Mix/Bhunai, Flip, Nani Garnish) */}
              <div className="mt-4 pt-3 border-t border-[#2C1B12]/10 space-y-2.5">
                {recipe.requiresMix && (
                  <button
                    type="button"
                    draggable={allIngredientsAdded && !kitchenState.isMixed}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/item-type', 'tool');
                      e.dataTransfer.setData('text/item-id', 'mix');
                    }}
                    onClick={handleMix}
                    disabled={!allIngredientsAdded || kitchenState.isMixed}
                    className={`w-full min-h-[46px] px-3.5 py-2 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                      kitchenState.isMixed
                        ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                        : allIngredientsAdded
                          ? 'bg-[#FFF8EB] border-[#D98A1E] text-[#2C1B12] hover:bg-[#FDE68A]/40'
                          : 'bg-[#F3E8D6]/60 border-[#2C1B12]/15 text-[#7B5E4B] cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xs font-bold">{recipe.mixLabel}</span>
                    <span className="text-[11px] font-semibold">
                      {kitchenState.isMixed ? 'Done' : allIngredientsAdded ? 'Tap / Drag' : 'Add items first'}
                    </span>
                  </button>
                )}

                {recipe.requiresFlip && (
                  <button
                    type="button"
                    draggable={allIngredientsAdded && mixDone && !kitchenState.isFlipped}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/item-type', 'tool');
                      e.dataTransfer.setData('text/item-id', 'flip');
                    }}
                    onClick={handleFlip}
                    disabled={!allIngredientsAdded || !mixDone || kitchenState.isFlipped}
                    className={`w-full min-h-[46px] px-3.5 py-2 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                      kitchenState.isFlipped
                        ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                        : allIngredientsAdded && mixDone
                          ? 'bg-[#FFF8EB] border-[#D98A1E] text-[#2C1B12] hover:bg-[#FDE68A]/40'
                          : 'bg-[#F3E8D6]/60 border-[#2C1B12]/15 text-[#7B5E4B] cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xs font-bold">{recipe.flipLabel}</span>
                    <span className="text-[11px] font-semibold">
                      {kitchenState.isFlipped ? 'Flipped' : allIngredientsAdded && mixDone ? 'Tap / Drag' : 'Wait'}
                    </span>
                  </button>
                )}

                {/* Nani Ka Secret Garnish */}
                <button
                  type="button"
                  draggable={allIngredientsAdded && !kitchenState.garnishAdded}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/item-type', 'garnish');
                    e.dataTransfer.setData('text/item-id', recipe.garnish.id);
                  }}
                  onClick={handleAddGarnish}
                  disabled={!allIngredientsAdded || kitchenState.garnishAdded}
                  className={`w-full min-h-[48px] px-3.5 py-2 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                    kitchenState.garnishAdded
                      ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                      : allIngredientsAdded
                        ? 'bg-[#FEF3C7] border-[#B84A2E] text-[#2C1B12] hover:bg-[#FDE68A]'
                        : 'bg-[#F3E8D6]/60 border-[#2C1B12]/15 text-[#7B5E4B] cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B84A2E] shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Nani Ka Secret Garnish</div>
                      <div className="text-[11px] text-[#5A4234]">{recipe.garnish.label}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold">
                    {kitchenState.garnishAdded ? 'Added +Hearts' : 'Bonus'}
                  </span>
                </button>
              </div>
            </div>
          </aside>

          {/* Right Counter: Live Cookware Canvas + Aanch Heat Controls */}
          <section className="lg:col-span-7 bg-[#FFFDF9] border-2 border-[#2C1B12] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#2C1B12] flex flex-col justify-between">
            {/* Progress & Burn Meter */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-semibold text-[#5A4234] mb-1">
                  <span>Cooking Progress</span>
                  <span className="font-mono tabular-nums">
                    {Math.round(kitchenState.cookProgress)}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-[#EFE3D0] border border-[#2C1B12]/20 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      kitchenState.burnLevel > 40
                        ? 'bg-[#DC2626]'
                        : kitchenState.cookProgress >= recipe.targetCookMin
                          ? 'bg-[#1E6B4B]'
                          : 'bg-[#D98A1E]'
                    }`}
                    style={{ width: `${Math.min(100, kitchenState.cookProgress)}%` }}
                  />
                </div>
              </div>

              {kitchenState.burnLevel > 10 && (
                <div className="text-xs font-bold text-[#DC2626] tabular-nums shrink-0">
                  Singe: {Math.round(kitchenState.burnLevel)}%
                </div>
              )}
            </div>

            {/* Isolated HTML5 Canvas Cookware */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#F8EFE2] to-[#EAD7BE] border border-[#2C1B12]/15 py-2">
              <CookwareCanvas
                recipe={recipe}
                kitchenState={kitchenState}
                isDragOver={isDragOver}
                onDropItem={handleDropItem}
                onDragStateChange={setIsDragOver}
              />
            </div>

            {/* Big One-Touch Aanch Buttons */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2C1B12]">
                  <Flame className="w-4 h-4 text-[#B84A2E]" />
                  <span>Chulha Aanch (Heat Control)</span>
                </span>
                <span className="text-[11px] text-[#7B5E4B]">
                  Ideal: {HEAT_LABELS[recipe.idealHeat].urdu}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HEAT_ORDER.map((level) => {
                  const active = kitchenState.heatLevel === level;
                  const meta = HEAT_LABELS[level];
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleHeatChange(level)}
                      className={`min-h-[46px] px-3 py-2 rounded-xl border-2 text-left transition-colors ${
                        active
                          ? 'bg-[#2C1B12] text-[#FBF6EE] border-[#2C1B12]'
                          : 'bg-[#FBF6EE] text-[#2C1B12] border-[#2C1B12]/20 hover:border-[#2C1B12]'
                      }`}
                    >
                      <div className="text-xs font-bold whitespace-nowrap">{meta.urdu}</div>
                      <div
                        className={`text-[11px] tabular-nums ${
                          active ? 'text-[#FCD34D]' : 'text-[#7B5E4B]'
                        }`}
                      >
                        {meta.english} · {meta.flame}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
