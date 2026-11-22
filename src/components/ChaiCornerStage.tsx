import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Coffee, Flame, Sparkles } from 'lucide-react';
import { CHAI_RECIPES, HEAT_LABELS, HEAT_SPEED_MULTIPLIER } from '../data/recipes';
import { ChaiId, ChaiRecipe, ChaiState, FamilyCraving, HeatLevel } from '../types/game';
import { soundEngine } from '../utils/sound';
import { ChaiPatilaCanvas } from './ChaiPatilaCanvas';

interface ChaiCornerStageProps {
  craving: FamilyCraving;
  chaiState: ChaiState;
  onUpdateState: React.Dispatch<React.SetStateAction<ChaiState>>;
  onCompleteChai: () => void;
}

const HEAT_ORDER: HeatLevel[] = ['band', 'dheemi', 'darmiyani', 'tez'];

export const ChaiCornerStage: React.FC<ChaiCornerStageProps> = ({
  craving,
  chaiState,
  onUpdateState,
  onCompleteChai,
}) => {
  const selectedChai: ChaiRecipe | null = useMemo(
    () => CHAI_RECIPES.find((c) => c.id === chaiState.selectedChaiId) ?? null,
    [chaiState.selectedChaiId]
  );

  const lastScoopTimeRef = useRef<number>(0);
  const boilAlertPlayedRef = useRef<boolean>(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset boil alert ref whenever chai selection resets
  useEffect(() => {
    if (!chaiState.selectedChaiId) {
      boilAlertPlayedRef.current = false;
    }
  }, [chaiState.selectedChaiId]);

  // Chai simmer & boil-over simulation loop
  useEffect(() => {
    if (!selectedChai || chaiState.isPoured) return;
    const hasLiquid =
      chaiState.addedBaseItems.includes('milk') || chaiState.addedBaseItems.includes('water');
    if (!hasLiquid) return;

    const timer = setInterval(() => {
      onUpdateState((prev) => {
        if (!prev.selectedChaiId || prev.isPoured) return prev;
        const hasBase =
          prev.addedBaseItems.includes('milk') || prev.addedBaseItems.includes('water');
        if (!hasBase) return prev;

        const speed = HEAT_SPEED_MULTIPLIER[prev.heatLevel];
        const readyToBoil =
          prev.pattiScoops > 0 &&
          (!selectedChai.requiresColdShock || prev.pinkShockTriggered);

        const nextProgress = Math.min(100, prev.chaiProgress + 1.25 * speed);

        let nextBoil = prev.boilLevel;
        let nextBoilOver = prev.boilOverOccurred;

        if (readyToBoil && !prev.boilSaved && !prev.boilOverOccurred) {
          const riseRate =
            prev.heatLevel === 'tez' ? 2.4 : prev.heatLevel === 'darmiyani' ? 1.55 : 0.75;
          nextBoil = Math.min(100, prev.boilLevel + riseRate);
          if (nextBoil >= 74 && !boilAlertPlayedRef.current) {
            boilAlertPlayedRef.current = true;
            soundEngine.playBoilAlert();
          }
          if (nextBoil >= 99) {
            nextBoilOver = true;
          }
        }

        return {
          ...prev,
          chaiProgress: nextProgress,
          boilLevel: nextBoil,
          boilOverOccurred: nextBoilOver,
        };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [selectedChai, chaiState.addedBaseItems, chaiState.isPoured, onUpdateState]);

  const handleSelectChai = (id: ChaiId) => {
    soundEngine.playTap();
    boilAlertPlayedRef.current = false;
    onUpdateState({
      selectedChaiId: id,
      addedBaseItems: [],
      pattiScoops: 0,
      cheeniScoops: 0,
      pinkShockTriggered: false,
      boilLevel: 0,
      boilSaved: false,
      boilOverOccurred: false,
      phaintiCount: 0,
      garnishAdded: false,
      chaiProgress: 0,
      heatLevel: 'darmiyani',
      isPoured: false,
    });
  };

  const addBaseItem = (item: string) => {
    if (!selectedChai) return;
    if (chaiState.addedBaseItems.includes(item)) return;
    if (item === 'milk' || item === 'water') {
      soundEngine.playPour();
    } else {
      soundEngine.playDrop();
    }
    onUpdateState((prev) =>
      prev.addedBaseItems.includes(item)
        ? prev
        : { ...prev, addedBaseItems: [...prev.addedBaseItems, item] }
    );
  };

  const scoopPatti = () => {
    const now = Date.now();
    if (now - lastScoopTimeRef.current < 180) return;
    lastScoopTimeRef.current = now;
    if (chaiState.pattiScoops >= 5) return;
    soundEngine.playDrop();
    onUpdateState((prev) => ({
      ...prev,
      pattiScoops: Math.min(5, prev.pattiScoops + 1),
    }));
  };

  const scoopCheeni = () => {
    const now = Date.now();
    if (now - lastScoopTimeRef.current < 180) return;
    lastScoopTimeRef.current = now;
    if (chaiState.cheeniScoops >= 5) return;
    soundEngine.playDrop();
    onUpdateState((prev) => ({
      ...prev,
      cheeniScoops: Math.min(5, prev.cheeniScoops + 1),
    }));
  };

  const triggerColdShock = () => {
    if (!selectedChai?.requiresColdShock || chaiState.pinkShockTriggered) return;
    if (!chaiState.addedBaseItems.includes('soda') || chaiState.pattiScoops === 0) return;
    soundEngine.playChime();
    onUpdateState((prev) => ({ ...prev, pinkShockTriggered: true }));
  };

  const saveBoilOver = () => {
    soundEngine.playChime();
    onUpdateState((prev) => ({
      ...prev,
      heatLevel: 'dheemi',
      boilLevel: 38,
      boilSaved: true,
    }));
  };

  const doPhainti = () => {
    if (!chaiState.addedBaseItems.includes('milk')) return;
    if (chaiState.phaintiCount >= 5) return;
    soundEngine.playPour();
    onUpdateState((prev) => ({
      ...prev,
      phaintiCount: Math.min(5, prev.phaintiCount + 1),
    }));
  };

  const addChaiGarnish = () => {
    if (chaiState.garnishAdded) return;
    soundEngine.playChime();
    onUpdateState((prev) => ({ ...prev, garnishAdded: true }));
  };

  const handleDropAction = (kind: string) => {
    if (kind === 'water') addBaseItem('water');
    if (kind === 'milk') addBaseItem('milk');
    if (kind === 'ilaichi') addBaseItem('ilaichi');
    if (kind === 'soda') addBaseItem('soda');
    if (kind === 'patti') scoopPatti();
    if (kind === 'cheeni') scoopCheeni();
    if (kind === 'shock') triggerColdShock();
    if (kind === 'phainti') doPhainti();
    if (kind === 'garnish') addChaiGarnish();
  };

  // Phase 1 of Chai Corner: 4 separate Chai Cards
  if (!selectedChai) {
    return (
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="pb-5 border-b border-[#2C1B12]/15">
          <p className="text-xs font-semibold text-[#B84A2E]">
            Step 3 of 4 · Chai Corner
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2C1B12] mt-1">
            Brew the Family’s Morning Chai
          </h1>
          <p className="text-sm text-[#5A4234] mt-1">
            Your nashta is plated hot! Choose one of four authentic Pakistani chai styles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
          {CHAI_RECIPES.map((chai) => {
            const isCraved = craving.chaiId === chai.id;
            return (
              <button
                key={chai.id}
                type="button"
                onClick={() => handleSelectChai(chai.id)}
                className={`text-left rounded-2xl p-5 bg-white border-2 transition-all hover:-translate-y-0.5 flex flex-col justify-between ${
                  isCraved
                    ? 'border-[#D98A1E] shadow-[4px_4px_0px_#D98A1E]'
                    : 'border-[#2C1B12] shadow-[4px_4px_0px_#2C1B12]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#7B5E4B]">
                      {chai.urduSubtitle}
                    </span>
                    <span
                      className="w-6 h-6 rounded-full border border-[#2C1B12]/25"
                      style={{ backgroundColor: chai.liquidColorFinish }}
                    />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#2C1B12] mt-1">
                    {chai.title}
                  </h2>
                  <p className="text-xs text-[#5A4234] leading-relaxed mt-2">
                    {chai.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2C1B12]/10 flex items-center justify-between text-xs font-bold">
                  <span className="text-[#1E6B4B]">
                    {isCraved
                      ? `${craving.requester}’s Craving`
                      : `Target: ${chai.targetPattiScoops} Patti · ${chai.targetCheeniScoops} Cheeni`}
                  </span>
                  <span className="text-[#B84A2E]">Start Brewing →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const boilDanger = chaiState.boilLevel >= 72 && !chaiState.boilSaved && !chaiState.boilOverOccurred;
  const hasMilk = chaiState.addedBaseItems.includes('milk');
  const canPour =
    hasMilk &&
    chaiState.pattiScoops > 0 &&
    (!selectedChai.requiresColdShock || chaiState.pinkShockTriggered) &&
    chaiState.chaiProgress >= 65;

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="bg-[#FFFDF9] border-2 border-[#2C1B12] rounded-2xl px-4 sm:px-5 py-3 shadow-[3px_3px_0px_#2C1B12] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-[#B84A2E]">
            Chai Corner · {selectedChai.title} ({selectedChai.urduSubtitle})
          </div>
          <div className="text-sm sm:text-base font-bold text-[#2C1B12]">
            {boilDanger
              ? 'Chai Ubal Rahi Hai! Tap "Aanch Kam Karein!" right now!'
              : !hasMilk
                ? selectedChai.usesWater
                  ? 'Patila mein Pani, Patti, Cheeni aur Doodh dalein'
                  : 'Doodh Patti ke liye khalis Doodh, Patti aur Cheeni dalein (no water!)'
                : chaiState.phaintiCount < 3
                  ? 'Ladle se Phainti karein (Tap Patila or button for frothy crema!)'
                  : 'Chai Garma Garam Tayyar! Serve to Dastarkhwan!'}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                selectedChaiId: null,
                addedBaseItems: [],
                pattiScoops: 0,
                cheeniScoops: 0,
                pinkShockTriggered: false,
                boilLevel: 0,
                boilSaved: false,
                boilOverOccurred: false,
                phaintiCount: 0,
                garnishAdded: false,
                chaiProgress: 0,
              }))
            }
            className="px-3 py-2 rounded-xl border border-[#2C1B12]/25 text-xs font-semibold text-[#5A4234] hover:bg-[#F3E8D6] whitespace-nowrap"
          >
            Switch Chai
          </button>

          {canPour && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccessFanfare();
                onCompleteChai();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E6B4B] hover:bg-[#155239] text-white text-xs sm:text-sm font-bold border-2 border-[#2C1B12] shadow-[3px_3px_0px_#2C1B12] whitespace-nowrap"
            >
              <Coffee className="w-4 h-4" />
              <span>Chai Cups Mein Dalein!</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Controls: Base + Exact Chamach Scoops + Phainti */}
        <aside className="lg:col-span-5 bg-[#FFFDF9] border-2 border-[#2C1B12] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#2C1B12] space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#2C1B12]">
              1. Base & Aromatics
            </h2>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              {selectedChai.usesWater && (
                <button
                  type="button"
                  draggable={!chaiState.addedBaseItems.includes('water')}
                  onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'water')}
                  onClick={() => addBaseItem('water')}
                  disabled={chaiState.addedBaseItems.includes('water')}
                  className={`min-h-[46px] px-3 py-2 rounded-xl border-2 text-left text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                    chaiState.addedBaseItems.includes('water')
                      ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                      : 'bg-white border-[#2C1B12]/25 hover:border-[#2C1B12] hover:-translate-y-0.5'
                  }`}
                >
                  <span>Pani (Water)</span>
                  {chaiState.addedBaseItems.includes('water') && <Check className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                draggable={!hasMilk}
                onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'milk')}
                onClick={() => addBaseItem('milk')}
                disabled={hasMilk}
                className={`min-h-[46px] px-3 py-2 rounded-xl border-2 text-left text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                  hasMilk
                    ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                    : 'bg-[#FFF8EB] border-[#D98A1E] hover:-translate-y-0.5'
                }`}
              >
                <span>Khalis Doodh (Milk)</span>
                {hasMilk && <Check className="w-4 h-4" />}
              </button>

              {selectedChai.requiresIlaichi && (
                <button
                  type="button"
                  draggable={!chaiState.addedBaseItems.includes('ilaichi')}
                  onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'ilaichi')}
                  onClick={() => addBaseItem('ilaichi')}
                  disabled={chaiState.addedBaseItems.includes('ilaichi')}
                  className={`min-h-[46px] px-3 py-2 rounded-xl border-2 text-left text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                    chaiState.addedBaseItems.includes('ilaichi')
                      ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                      : 'bg-white border-[#2C1B12]/25 hover:border-[#2C1B12] hover:-translate-y-0.5'
                  }`}
                >
                  <span>Sabz Ilaichi Pods</span>
                  {chaiState.addedBaseItems.includes('ilaichi') && <Check className="w-4 h-4" />}
                </button>
              )}

              {selectedChai.requiresColdShock && (
                <button
                  type="button"
                  draggable={!chaiState.addedBaseItems.includes('soda')}
                  onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'soda')}
                  onClick={() => addBaseItem('soda')}
                  disabled={chaiState.addedBaseItems.includes('soda')}
                  className={`min-h-[46px] px-3 py-2 rounded-xl border-2 text-left text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                    chaiState.addedBaseItems.includes('soda')
                      ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                      : 'bg-white border-[#2C1B12]/25 hover:border-[#2C1B12] hover:-translate-y-0.5'
                  }`}
                >
                  <span>Chutki Baking Soda</span>
                  {chaiState.addedBaseItems.includes('soda') && <Check className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* 2. Chamach Scoops */}
          <div className="pt-3 border-t border-[#2C1B12]/10">
            <h2 className="font-display text-lg font-bold text-[#2C1B12]">
              2. Chamach Scoops
            </h2>
            <div className="grid grid-cols-2 gap-2.5 mt-2">
              <button
                type="button"
                draggable={chaiState.pattiScoops < 5}
                onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'patti')}
                onClick={scoopPatti}
                className="min-h-[54px] p-3 rounded-xl border-2 border-[#2C1B12] bg-[#FFF8EB] hover:bg-[#FDE68A]/50 text-left transition-all active:scale-95 hover:-translate-y-0.5"
              >
                <div className="text-xs font-bold text-[#2C1B12]">
                  +1 Chamach {selectedChai.pattiLabel}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-[#7B5E4B] mt-0.5">
                  Added: {chaiState.pattiScoops} / Target {selectedChai.targetPattiScoops}
                </div>
              </button>

              <button
                type="button"
                draggable={chaiState.cheeniScoops < 5}
                onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'cheeni')}
                onClick={scoopCheeni}
                className="min-h-[54px] p-3 rounded-xl border-2 border-[#2C1B12] bg-white hover:bg-[#FBF6EE] text-left transition-all active:scale-95 hover:-translate-y-0.5"
              >
                <div className="text-xs font-bold text-[#2C1B12]">
                  +1 Chamach Cheeni
                </div>
                <div className="text-[11px] font-mono tabular-nums text-[#7B5E4B] mt-0.5">
                  Added: {chaiState.cheeniScoops} / Target {selectedChai.targetCheeniScoops}
                </div>
              </button>
            </div>

            {selectedChai.requiresColdShock && (
              <button
                type="button"
                draggable={!chaiState.pinkShockTriggered}
                onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'shock')}
                onClick={triggerColdShock}
                disabled={
                  chaiState.pinkShockTriggered ||
                  !chaiState.addedBaseItems.includes('soda') ||
                  chaiState.pattiScoops === 0
                }
                className={`w-full mt-2.5 min-h-[46px] px-3.5 py-2 rounded-xl border-2 text-xs font-bold flex items-center justify-between transition-all active:scale-95 ${
                  chaiState.pinkShockTriggered
                    ? 'bg-[#FDF2F8] border-[#DB2777]/50 text-[#9D174D]'
                    : chaiState.addedBaseItems.includes('soda') && chaiState.pattiScoops > 0
                      ? 'bg-[#FCE7F3] border-[#DB2777] text-[#831843] hover:-translate-y-0.5'
                      : 'bg-[#F3E8D6]/60 border-[#2C1B12]/15 text-[#7B5E4B] cursor-not-allowed'
                }`}
              >
                <span>Thanda Pani Shock (Bloom Gulabi Pink!)</span>
                <span>{chaiState.pinkShockTriggered ? 'Pink Bloomed!' : 'Tap / Drag'}</span>
              </button>
            )}
          </div>

          {/* 3. Phainti & Secret Garnish */}
          <div className="pt-3 border-t border-[#2C1B12]/10 space-y-2.5">
            <button
              type="button"
              draggable={hasMilk && chaiState.phaintiCount < 5}
              onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'phainti')}
              onClick={doPhainti}
              disabled={!hasMilk || chaiState.phaintiCount >= 5}
              className={`w-full min-h-[48px] px-3.5 py-2 rounded-xl border-2 text-left flex items-center justify-between transition-all active:scale-95 ${
                chaiState.phaintiCount >= 5
                  ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                  : hasMilk
                    ? 'bg-[#FFF8EB] border-[#D98A1E] text-[#2C1B12] hover:bg-[#FDE68A]/50'
                    : 'bg-[#F3E8D6]/60 border-[#2C1B12]/15 text-[#7B5E4B] cursor-not-allowed'
              }`}
            >
              <div>
                <div className="text-xs font-bold">Ladle Phainti (Aerate Chai)</div>
                <div className="text-[11px] text-[#5A4234]">
                  Scoop & pour high for silky froth
                </div>
              </div>
              <span className="font-mono tabular-nums text-xs font-bold">
                {chaiState.phaintiCount}/5
              </span>
            </button>

            <button
              type="button"
              draggable={hasMilk && !chaiState.garnishAdded}
              onDragStart={(e) => e.dataTransfer.setData('text/chai-action', 'garnish')}
              onClick={addChaiGarnish}
              disabled={!hasMilk || chaiState.garnishAdded}
              className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border-2 text-left flex items-center justify-between transition-all active:scale-95 ${
                chaiState.garnishAdded
                  ? 'bg-[#ECFDF5] border-[#1E6B4B]/40 text-[#1E6B4B]'
                  : hasMilk
                    ? 'bg-[#FEF3C7] border-[#B84A2E] text-[#2C1B12]'
                    : 'bg-[#F3E8D6]/60 border-[#2C1B12]/15 text-[#7B5E4B] cursor-not-allowed'
              }`}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#B84A2E]" />
                <span>Chai Topping: {selectedChai.garnishLabel}</span>
              </span>
              <span className="text-[11px] font-bold">
                {chaiState.garnishAdded ? 'Added' : 'Bonus'}
              </span>
            </button>
          </div>
        </aside>

        {/* Right: Isolated Brass Patila Canvas + Boil-Over Save + Aanch */}
        <section className="lg:col-span-7 bg-[#FFFDF9] border-2 border-[#2C1B12] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#2C1B12] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5A4234] mb-1">
                <span>Patila Boil & Simmer</span>
                <span className="font-mono tabular-nums">
                  Brew {Math.round(chaiState.chaiProgress)}% · Foam {Math.round(chaiState.boilLevel)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#EFE3D0] border border-[#2C1B12]/20 overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    boilDanger
                      ? 'bg-[#DC2626]'
                      : chaiState.boilSaved
                        ? 'bg-[#1E6B4B]'
                        : 'bg-[#D98A1E]'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(chaiState.chaiProgress, chaiState.boilLevel))}%`,
                  }}
                />
              </div>
            </div>

            {boilDanger && (
              <button
                type="button"
                onClick={saveBoilOver}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold border-2 border-[#2C1B12] shadow-[2px_2px_0px_#2C1B12] animate-bounce whitespace-nowrap shrink-0"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Aanch Kam Karein!</span>
              </button>
            )}

            {chaiState.boilSaved && (
              <span className="text-xs font-bold text-[#1E6B4B] whitespace-nowrap shrink-0">
                Bach Gaye! +10 Bonus
              </span>
            )}
          </div>

          <ChaiPatilaCanvas
            selectedChai={selectedChai}
            chaiState={chaiState}
            isDragOver={isDragOver}
            onDropAction={handleDropAction}
            onDragStateChange={setIsDragOver}
            onPatilaTap={doPhainti}
          />

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2C1B12]">
                <Flame className="w-4 h-4 text-[#B84A2E]" />
                <span>Chai Aanch</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HEAT_ORDER.map((level) => {
                const active = chaiState.heatLevel === level;
                const meta = HEAT_LABELS[level];
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      soundEngine.playTap();
                      onUpdateState((prev) => ({ ...prev, heatLevel: level }));
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border-2 text-left transition-colors ${
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
                      {meta.english}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
