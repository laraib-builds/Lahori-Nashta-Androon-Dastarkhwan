import React from 'react';
import { X, Lock } from 'lucide-react';
import { PAKISTANI_STICKERS } from '../data/stickers';
import { StickerArt } from './StickerArt';

interface ScrapbookModalProps {
  isOpen: boolean;
  unlockedIds: string[];
  onClose: () => void;
}

export const ScrapbookModal: React.FC<ScrapbookModalProps> = ({
  isOpen,
  unlockedIds,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1B12]/65 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scrapbook-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FBF6EE] border-2 border-[#2C1B12] shadow-[6px_6px_0px_#2C1B12] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#2C1B12]/15">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#B84A2E]">
              Androon Heritage Collection · {unlockedIds.length} of {PAKISTANI_STICKERS.length} Unlocked
            </p>
            <h2 id="scrapbook-title" className="font-display text-2xl sm:text-3xl font-bold text-[#2C1B12] mt-1">
              Pakistani Cultural Scrapbook
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Scrapbook"
            className="w-10 h-10 rounded-xl border border-[#2C1B12]/25 bg-white flex items-center justify-center text-[#2C1B12] hover:bg-[#F3E8D6] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {PAKISTANI_STICKERS.map((sticker) => {
            const unlocked = unlockedIds.includes(sticker.id);
            return (
              <div
                key={sticker.id}
                className={`rounded-2xl p-5 border transition-colors ${
                  unlocked
                    ? 'bg-white border-[#2C1B12]/20 shadow-sm'
                    : 'bg-[#F3E8D6]/60 border-dashed border-[#2C1B12]/25'
                }`}
              >
                <div className="flex justify-center py-2">
                  <div
                    style={{
                      transform: unlocked ? `rotate(${sticker.tiltDeg}deg)` : 'none',
                    }}
                    className="transition-transform duration-200"
                  >
                    <StickerArt stickerId={sticker.id} locked={!unlocked} size={116} />
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <div className="text-xs text-[#7B5E4B] font-medium">
                    {sticker.urduName} · {sticker.region}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#2C1B12] mt-0.5">
                    {sticker.title}
                  </h3>
                  {unlocked ? (
                    <p className="text-xs text-[#5A4234] leading-relaxed mt-2">
                      {sticker.story}
                    </p>
                  ) : (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#8C5230]">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>{sticker.unlockHint}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
