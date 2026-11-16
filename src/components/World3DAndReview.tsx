import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Pause, Play, RotateCw, Sparkles } from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { SHOWCASE_ARTWORK } from '../data/seedData';
import { LocalAssistantService } from '../services';
import type { MemoryPhoto } from '../types';
import { sortByDateAsc } from '../utils/dates';
import { resolveCoverSrc, resolvePhotoSrc } from '../utils/photoHelpers';
import { SecurePhotoImg } from './SecurePhotoImg';

export function World3DView() {
  const { photos, milestones, activityResetTick } = useMemories();
  const [angle, setAngle] = useState(0);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [selectedCard, setSelectedCard] = useState<{
    title: string;
    image: string;
    detail: string;
  } | null>(null);

  useEffect(() => {
    if (activityResetTick === 0) return;
    setAngle(0);
    setAutoOrbit(true);
    setSelectedCard(null);
  }, [activityResetTick]);

  const floatingCards = useMemo(() => {
    const photoCards = sortByDateAsc(photos)
      .map((p: MemoryPhoto) => ({
        id: p.id,
        title: p.location || p.date || 'Memory Frame',
        image: resolvePhotoSrc(p),
        detail: p.caption,
      }))
      .filter((c) => Boolean(c.image))
      .slice(0, 10);
    if (photoCards.length > 0) {
      return photoCards;
    }
    return sortByDateAsc(milestones)
      .map((m) => ({
        id: m.id,
        title: m.title,
        image: resolveCoverSrc(m),
        detail: m.description,
      }))
      .filter((c) => Boolean(c.image));
  }, [photos, milestones]);

  const count = Math.max(1, floatingCards.length);
  const stepDeg = 360 / count;

  useEffect(() => {
    if (!autoOrbit) return;
    const id = window.setInterval(() => {
      setAngle((a) => a - stepDeg * 0.15);
    }, 80);
    return () => window.clearInterval(id);
  }, [autoOrbit, stepDeg]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      {/* Showcase Banner */}
      <section className="luxury-glass relative overflow-hidden rounded-[32px]">
        <div className="relative aspect-[16/7] min-h-[240px] w-full overflow-hidden">
          <img
            src={SHOWCASE_ARTWORK.world3d}
            alt="3D Memory World Islands Portal"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F2] via-transparent to-transparent dark:from-[#160910]" />
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Interactive 3D Memory World &amp; Floating Carousel
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
            Orbiting Memories Around One Heart
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6c4150] dark:text-[#EAD0D9]">
            Rotate our champagne-gold spatial gallery in 3D perspective and select any framed memory
            card to read its story.
          </p>
        </div>
      </section>

      {/* 3D Floating Carousel Stage */}
      <section className="luxury-glass rounded-[32px] p-6 sm:p-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#542D3A] dark:text-[#FFF5F0]">
            <Heart className="h-4 w-4 fill-[#C98291] text-[#C98291]" />
            <span className="tabular-nums">3D Memory Carousel ({floatingCards.length} frames)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoOrbit((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477] bg-white px-3.5 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
            >
              {autoOrbit ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{autoOrbit ? 'Pause Orbit' : 'Auto Orbit'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAutoOrbit(false);
                setAngle((a) => a + stepDeg);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-[#D6B477]/60 bg-white px-3.5 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAutoOrbit(false);
                setAngle((a) => a - stepDeg);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-[#542D3A] px-3.5 py-2 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="relative mx-auto flex h-[340px] w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#FCE8E8]/60 via-[#FFF9F2] to-[#FCE8E8]/50 dark:from-[#2B121F]/80 dark:via-[#160910] dark:to-[#240F1A]/80"
          style={{ perspective: '1200px' }}
        >
          <div className="pointer-events-none absolute z-0 flex h-24 w-24 items-center justify-center rounded-full border border-[#D6B477] bg-white/90 shadow-[0_0_50px_rgba(201,130,145,0.35)] dark:bg-[#27111C]/95">
            <Heart className="h-10 w-10 fill-[#C98291] text-[#C98291]" />
          </div>

          <div
            className="relative h-56 w-44 transition-transform duration-300 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${angle}deg)`,
            }}
          >
            {floatingCards.map((card, idx) => {
              const cardDeg = idx * stepDeg;
              const radius = count <= 3 ? 190 : 280;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCard(card)}
                  style={{
                    transform: `rotateY(${cardDeg}deg) translateZ(${radius}px)`,
                  }}
                  className="absolute inset-0 overflow-hidden rounded-2xl border-2 border-[#D6B477] bg-white p-1.5 shadow-xl transition-colors hover:border-[#542D3A] dark:bg-[#230E18] dark:hover:border-[#E7C38A]"
                >
                  <SecurePhotoImg
                    src={card.image}
                    alt={card.title}
                    className="h-3/4 w-full rounded-xl object-cover"
                  />
                  <div className="flex h-1/4 items-center justify-center px-2 text-center">
                    <span className="truncate font-serif-display text-xs font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                      {card.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedCard && (
          <div className="mt-8 grid items-center gap-6 rounded-2xl border border-[#D6B477]/55 bg-white p-5 shadow-md sm:grid-cols-12 dark:bg-[#230E18]">
            <SecurePhotoImg
              src={selectedCard.image}
              variant="full"
              lazy={false}
              alt={selectedCard.title}
              className="aspect-[4/3] w-full rounded-xl object-cover sm:col-span-4"
            />
            <div className="sm:col-span-8">
              <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                Selected 3D Memory
              </p>
              <h4 className="mt-1 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                {selectedCard.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                {selectedCard.detail}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function YearInReviewView() {
  const { milestones, photos, letters, config } = useMemories();
  const [highlights, setHighlights] = useState<string[] | null>(null);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);

  const filmstripFrames = useMemo(() => {
    const photoFrames = sortByDateAsc(photos)
      .map((p) => ({
        id: p.id,
        date: p.date || 'Memory',
        title: p.location || 'Our Story',
        caption: p.caption,
        image: resolvePhotoSrc(p),
      }))
      .filter((f) => Boolean(f.image));
    if (photoFrames.length > 0) {
      return photoFrames;
    }
    return sortByDateAsc(milestones)
      .map((m) => ({
        id: m.id,
        date: m.date,
        title: m.title,
        caption: m.description,
        image: resolveCoverSrc(m),
      }))
      .filter((f) => Boolean(f.image));
  }, [photos, milestones]);

  const generateHighlights = async () => {
    setLoadingHighlights(true);
    setHighlightsError(null);
    try {
      const list = LocalAssistantService.computeLocalYearReviewHighlights({
        milestones: sortByDateAsc(milestones),
        photos,
        letters,
        himName: config.himName,
        herName: config.herName,
        anniversaryDate: config.anniversaryDate,
      });
      setHighlights(list);
    } catch (err) {
      setHighlightsError(
        err instanceof Error ? err.message : 'Unable to compute memory summary.',
      );
    } finally {
      setLoadingHighlights(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <section className="luxury-glass overflow-hidden rounded-[32px]">
        <div className="relative aspect-[16/7] min-h-[240px] w-full overflow-hidden">
          <img
            src={SHOWCASE_ARTWORK.yearInReview}
            alt="Our Year in Review Filmstrip and Map"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F2] via-transparent to-transparent dark:from-[#160910]" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
              Our Year in Review · Cinematic Filmstrip
            </p>
            <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
              Every Frame of {config.himName} &amp; {config.herName}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void generateHighlights()}
            disabled={loadingHighlights}
            className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6a3a4a] disabled:opacity-60 dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
          >
            {loadingHighlights ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
            )}
            <span>{loadingHighlights ? 'Calculating Summary...' : 'Calculate Local Summary'}</span>
          </button>
        </div>
      </section>

      {highlightsError && (
        <div className="rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
          {highlightsError}
        </div>
      )}

      {highlights && highlights.length > 0 && (
        <section className="luxury-glass rounded-[28px] p-6 sm:p-8">
          <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            Year-in-Review Memory Highlights Summary
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
            {highlights.map((h, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-bold text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                  0{i + 1}.
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="luxury-glass rounded-[28px] p-6">
        <h3 className="mb-4 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
          Synchronized Filmstrip ({filmstripFrames.length} reels)
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filmstripFrames.map((frame) => (
            <div
              key={frame.id}
              className="w-72 shrink-0 overflow-hidden rounded-2xl border border-[#D6B477] bg-white shadow-sm dark:bg-[#230E18]"
            >
              <div className="h-2.5 border-b border-dashed border-[#D6B477] bg-[#FCE8E8] dark:bg-[#3A192A]" />
              <SecurePhotoImg
                src={frame.image}
                alt={frame.title}
                className="aspect-[16/10] w-full object-cover"
              />
              <div className="p-4">
                <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                  {frame.date}
                </p>
                <p className="mt-1 font-serif-display text-lg font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                  {frame.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[#6c4150] dark:text-[#EAD0D9]">
                  {frame.caption}
                </p>
              </div>
              <div className="h-2.5 border-t border-dashed border-[#D6B477] bg-[#FCE8E8] dark:bg-[#3A192A]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
