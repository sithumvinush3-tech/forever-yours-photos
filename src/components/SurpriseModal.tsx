import { useEffect, useState } from 'react';
import { Gift, Heart, Shuffle, X } from 'lucide-react';
import type { SurpriseItem } from '../types';

interface SurpriseModalProps {
  surprises: SurpriseItem[];
  initialIndex: number;
  onClose: () => void;
}

export function SurpriseModal({ surprises, initialIndex, onClose }: SurpriseModalProps) {
  const safeLen = Math.max(1, surprises.length);
  const [index, setIndex] = useState(() => ((initialIndex % safeLen) + safeLen) % safeLen);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const item = surprises[index % surprises.length];
  if (!item) return null;

  const drawAnother = () => {
    if (surprises.length <= 1) return;
    let next = Math.floor(Math.random() * surprises.length);
    if (next === index) {
      next = (index + 1) % surprises.length;
    }
    setIndex(next);
  };

  const kindLabel = item.kind === 'secret_memory' ? 'Secret Memory' : 'Heartwarming Quote';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="surprise-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1A0810]/75 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#D6B477]/70 bg-[#FFF9F2] p-6 text-[#542D3A] shadow-2xl sm:p-8 dark:border-[#D6B477]/45 dark:bg-[#190A12] dark:text-[#FFF5F0]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE8E8] text-[#C98291] dark:bg-[#3A192A] dark:text-[#E7C38A]">
              {item.kind === 'secret_memory' ? (
                <Heart className="h-5 w-5 fill-current" />
              ) : (
                <Gift className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                {kindLabel}
                {item.dateHint ? ` · ${item.dateHint}` : ''}
              </p>
              <h2
                id="surprise-modal-title"
                className="mt-0.5 font-serif-display text-2xl font-bold text-[#542D3A] sm:text-3xl dark:text-[#FFF5F0]"
              >
                {item.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close surprise note"
            className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-[#D6B477]/50 bg-white/80 text-[#542D3A] transition-colors hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <blockquote className="mt-6 border-t border-[#D6B477]/35 pt-6 font-serif-display text-xl leading-relaxed text-[#542D3A] italic sm:text-2xl dark:border-[#D6B477]/25 dark:text-[#FCE8E8]">
          &ldquo;{item.message}&rdquo;
        </blockquote>

        <p className="mt-4 text-right font-handwriting text-xl text-[#9A6876] dark:text-[#E7C38A]">
          Forever yours, Sithum ♥
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#D6B477]/30 pt-5 dark:border-[#D6B477]/20">
          <span className="text-xs font-medium text-[#8c5263] tabular-nums dark:text-[#D9B8C2]">
            Note {index + 1} of {surprises.length}
          </span>

          <div className="flex items-center gap-2.5">
            {surprises.length > 1 && (
              <button
                type="button"
                onClick={drawAnother}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#D6B477] bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] transition-colors hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
              >
                <Shuffle className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                <span>Another Surprise</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[40px] items-center rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] transition-colors hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
