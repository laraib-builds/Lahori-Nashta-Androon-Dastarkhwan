import React from 'react';
import { BookOpen, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { GameStage } from '../types/game';
import { PAKISTANI_STICKERS } from '../data/stickers';

interface TopBarProps {
  stage: GameStage;
  unlockedStickerCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenScrapbook: () => void;
  onResetToMenu: () => void;
  onJumpStage?: (target: GameStage) => void;
  canVisitKitchen: boolean;
  canVisitChai: boolean;
}

const STEPS: { id: GameStage; label: string }[] = [
  { id: 'MENU', label: 'Menu' },
  { id: 'KITCHEN', label: 'Kitchen' },
  { id: 'CHAI', label: 'Chai' },
  { id: 'DASTARKHWAN', label: 'Dastarkhwan' },
];

export const TopBar: React.FC<TopBarProps> = ({
  stage,
  unlockedStickerCount,
  isMuted,
  onToggleMute,
  onOpenScrapbook,
  onResetToMenu,
  onJumpStage,
  canVisitKitchen,
  canVisitChai,
}) => {
  const currentIdx = STEPS.findIndex((s) => s.id === stage);

  return (
    <header className="w-full bg-[#FFFDF9] border-b border-[#2C1B12]/15 px-4 sm:px-6 h-14 flex items-center justify-between gap-4 shrink-0 z-30">
      <button
        type="button"
        onClick={onResetToMenu}
        className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#2C1B12] hover:text-[#B84A2E] transition-colors whitespace-nowrap shrink-0"
      >
        Lahori Nashta
      </button>

      <nav aria-label="Game stages" className="hidden md:flex items-center gap-2">
        {STEPS.map((step, idx) => {
          const isActive = step.id === stage;
          const isCompleted = currentIdx > idx;
          const clickable =
            step.id === 'MENU' ||
            (step.id === 'KITCHEN' && canVisitKitchen && stage !== 'DASTARKHWAN') ||
            (step.id === 'CHAI' && canVisitChai && stage !== 'DASTARKHWAN');

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJumpStage && onJumpStage(step.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#2C1B12] text-[#FBF6EE]'
                    : isCompleted
                      ? 'text-[#1E6B4B] hover:bg-[#1E6B4B]/10'
                      : clickable
                        ? 'text-[#5A4234] hover:bg-[#F3E8D6]'
                        : 'text-[#5A4234]/45 cursor-default'
                }`}
              >
                {idx + 1}. {step.label}
              </button>
              {idx < STEPS.length - 1 && (
                <span className="text-[#2C1B12]/25 text-xs select-none" aria-hidden="true">
                  /
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenScrapbook}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2C1B12]/20 bg-[#FBF6EE] hover:bg-[#F3E8D6] text-xs font-semibold text-[#2C1B12] transition-colors whitespace-nowrap shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#B84A2E]" />
          <span>Scrapbook</span>
          <span className="font-mono tabular-nums text-[#7B5E4B]">
            ({unlockedStickerCount}/{PAKISTANI_STICKERS.length})
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
          title={isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
          className="w-9 h-9 rounded-lg border border-[#2C1B12]/20 bg-white hover:bg-[#F3E8D6] flex items-center justify-center text-[#2C1B12] transition-colors shrink-0"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#B84A2E]" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onResetToMenu}
          title="Return to Nashta Menu & Reset Round"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B84A2E] hover:bg-[#9E3C23] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Menu</span>
        </button>
      </div>
    </header>
  );
};
