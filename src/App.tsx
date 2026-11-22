import { useCallback, useEffect, useState } from 'react';
import { ChaiCornerStage } from './components/ChaiCornerStage';
import { DastarkhwanStage } from './components/DastarkhwanStage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { KitchenStage } from './components/KitchenStage';
import { NashtaMenu } from './components/NashtaMenu';
import { ScrapbookModal } from './components/ScrapbookModal';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import {
  createInitialChaiState,
  createInitialKitchenState,
  getRecipeById,
} from './data/recipes';
import { fetchMorningCraving, getInstantFallbackCraving } from './services/geminiService';
import { ChaiState, DishId, FamilyCraving, GameStage, KitchenState } from './types/game';
import { soundEngine } from './utils/sound';

const STICKER_STORAGE_KEY = 'lahori_nashta_stickers_v1';

function loadUnlockedStickers(): string[] {
  try {
    const raw = localStorage.getItem(STICKER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [stage, setStage] = useState<GameStage>('TITLE');
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [selectedDishId, setSelectedDishId] = useState<DishId>('anda-half-fry');
  const [kitchenState, setKitchenState] = useState<KitchenState>(createInitialKitchenState);
  const [chaiState, setChaiState] = useState<ChaiState>(createInitialChaiState);
  const [craving, setCraving] = useState<FamilyCraving>(() => getInstantFallbackCraving(0));
  const [unlockedStickers, setUnlockedStickers] = useState<string[]>(loadUnlockedStickers);
  const [newlyUnlockedStickerId, setNewlyUnlockedStickerId] = useState<string | null>(null);
  const [scrapbookOpen, setScrapbookOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.isMuted());

  // Fetch varied Gemini morning craving per round (with instant fallback already loaded)
  useEffect(() => {
    let active = true;
    fetchMorningCraving(roundIndex).then((nextCraving) => {
      if (active) setCraving(nextCraving);
    });
    return () => {
      active = false;
    };
  }, [roundIndex]);

  // Global keyboard shortcut for Mute ('M')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        if (document.activeElement?.tagName === 'INPUT') return;
        setIsMuted((prev) => {
          const next = !prev;
          soundEngine.setMuted(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Complete hard reset of all dish, chai, heat, and dining states
  const resetToMenu = useCallback(() => {
    soundEngine.playTap();
    setKitchenState(createInitialKitchenState());
    setChaiState(createInitialChaiState());
    setNewlyUnlockedStickerId(null);
    setRoundIndex((r) => r + 1);
    setStage('MENU');
  }, []);

  const handleSelectDish = useCallback((dishId: DishId) => {
    soundEngine.playTap();
    setSelectedDishId(dishId);
    setKitchenState(createInitialKitchenState());
    setChaiState(createInitialChaiState());
    setNewlyUnlockedStickerId(null);
    setStage('KITCHEN');
  }, []);

  const handleCompleteDish = useCallback(() => {
    setKitchenState((prev) => ({ ...prev, isPlated: true }));
    setChaiState(createInitialChaiState());
    setStage('CHAI');
  }, []);

  const handleCompleteChai = useCallback(() => {
    const recipe = getRecipeById(selectedDishId);
    const stickerId = recipe.unlockStickerId;

    setChaiState((prev) => ({ ...prev, isPoured: true }));
    setNewlyUnlockedStickerId(stickerId);

    setUnlockedStickers((prev) => {
      if (prev.includes(stickerId)) return prev;
      const updated = [...prev, stickerId];
      try {
        localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });

    setStage('DASTARKHWAN');
  }, [selectedDishId]);

  const activeRecipe = getRecipeById(selectedDishId);

  return (
    <ErrorBoundary onResetRound={resetToMenu}>
      <div className="min-h-screen w-full bg-[#FBF6EE] text-[#2C1B12] flex flex-col">
        {stage === 'TITLE' ? (
          <TitleScreen
            craving={craving}
            unlockedCount={unlockedStickers.length}
            isMuted={isMuted}
            onStart={() => {
              soundEngine.playTap();
              setStage('MENU');
            }}
            onOpenScrapbook={() => {
              soundEngine.playTap();
              setScrapbookOpen(true);
            }}
            onToggleMute={handleToggleMute}
          />
        ) : (
          <>
            <TopBar
              stage={stage}
              unlockedStickerCount={unlockedStickers.length}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onOpenScrapbook={() => {
                soundEngine.playTap();
                setScrapbookOpen(true);
              }}
              onResetToMenu={resetToMenu}
              onJumpStage={(target) => {
                if (target === 'MENU') resetToMenu();
                if (target === 'KITCHEN') setStage('KITCHEN');
                if (target === 'CHAI' && kitchenState.isPlated) setStage('CHAI');
              }}
              canVisitKitchen={stage !== 'MENU'}
              canVisitChai={kitchenState.isPlated}
            />

            <main className="flex-1 flex flex-col">
              {stage === 'MENU' && (
                <NashtaMenu
                  craving={craving}
                  unlockedStickers={unlockedStickers}
                  onSelectDish={handleSelectDish}
                />
              )}

              {stage === 'KITCHEN' && (
                <KitchenStage
                  recipe={activeRecipe}
                  kitchenState={kitchenState}
                  onUpdateState={setKitchenState}
                  onCompleteDish={handleCompleteDish}
                />
              )}

              {stage === 'CHAI' && (
                <ChaiCornerStage
                  craving={craving}
                  chaiState={chaiState}
                  onUpdateState={setChaiState}
                  onCompleteChai={handleCompleteChai}
                />
              )}

              {stage === 'DASTARKHWAN' && (
                <DastarkhwanStage
                  recipe={activeRecipe}
                  kitchenState={kitchenState}
                  chaiState={chaiState}
                  craving={craving}
                  newlyUnlockedStickerId={newlyUnlockedStickerId}
                  onPlayAgain={resetToMenu}
                  onOpenScrapbook={() => {
                    soundEngine.playTap();
                    setScrapbookOpen(true);
                  }}
                />
              )}
            </main>
          </>
        )}

        <ScrapbookModal
          isOpen={scrapbookOpen}
          unlockedIds={unlockedStickers}
          onClose={() => {
            soundEngine.playTap();
            setScrapbookOpen(false);
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
