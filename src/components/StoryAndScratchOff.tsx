import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp,
  Calendar,
  Eye,
  Heart,
  MapPin,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import type { Milestone } from '../types';
import { formatFullDateLabel, sortByDateAsc } from '../utils/dates';
import { resolveCoverSrc, resolvePhotoSrc, resolveVoiceSrc } from '../utils/photoHelpers';
import { SecureDriveAudio, SecurePhotoImg } from './SecurePhotoImg';

export function StoryTimelineView() {
  const { milestones, photos, voiceMemories, config } = useMemories();
  const [newestFirst, setNewestFirst] = useState(false);

  const sortedMilestones = useMemo(() => {
    const asc = sortByDateAsc(milestones);
    return newestFirst ? [...asc].reverse() : asc;
  }, [milestones, newestFirst]);

  const anniversaryDisplay = formatFullDateLabel(config.anniversaryDate);

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D6B477]/35 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Chronological Relationship Archive
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
            Our Story &amp; Two Perspectives
          </h2>
          <p className="mt-1 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
            Sorted in exact calendar date order—toggle chronological direction anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/60 bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] shadow-sm hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
            <span>{newestFirst ? 'Order: Newest → Oldest' : 'Order: Oldest → Newest'}</span>
          </button>
        </div>
      </div>

      {/* First Impression Flashback — Two Perspectives on Warm Stationery */}
      <section className="luxury-glass rounded-[32px] p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-[#C98291] uppercase dark:text-[#E7C38A]">
          The First Impression Flashback · Two Perspectives
        </p>
        <h3 className="mt-2 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
          The Moment {config.himName} First Noticed {config.herName}
        </h3>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="stationery-paper rounded-2xl border border-[#D6B477]/60 p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
              Through {config.himName}&apos;s Eyes
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#542D3A] dark:text-[#F5E7EC]">
              <span className="font-serif-display float-left mr-2 text-4xl leading-none font-bold text-[#C98291] dark:text-[#E7C38A]">
                I
              </span>
              remember noticing your smile before anything else—it felt like time paused for a
              heartbeat. Every word you spoke carried warmth, and I silently hoped our paths would
              stay intertwined forever. On {anniversaryDisplay}, that quiet wish became our reality.
            </p>
          </div>
          <div className="stationery-paper rounded-2xl border border-[#D6B477]/60 p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
              For My Dearest {config.herNickname}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#542D3A] dark:text-[#F5E7EC]">
              <span className="font-serif-display float-left mr-2 text-4xl leading-none font-bold text-[#C98291] dark:text-[#E7C38A]">
                F
              </span>
              rom our first mountain drive up to Baker&apos;s Bend to standing under the silver mist
              of Bambarakanda and peaceful temple bells in Bandarawela—every chapter with you feels
              like home.
            </p>
          </div>
        </div>
      </section>

      {/* Vertical Editorial Timeline */}
      <div className="relative space-y-8 before:absolute before:top-4 before:bottom-4 before:left-5 before:w-px before:bg-[#D6B477] sm:before:left-8">
        {sortedMilestones.map((m, idx) => {
          const tripPhotos = sortByDateAsc(photos.filter((p) => p.milestoneId === m.id));
          const tripVoices = voiceMemories.filter((v) => v.milestoneId === m.id);
          const coverSrc = resolveCoverSrc(m);
          return (
            <article key={m.id} className="relative pl-14 sm:pl-20">
              <div className="absolute top-3 left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#D6B477] bg-white text-xs font-bold text-[#542D3A] shadow-sm sm:left-4.5 dark:bg-[#27111C] dark:text-[#E7C38A]">
                {idx + 1}
              </div>

              <div className="luxury-glass overflow-hidden rounded-[28px]">
                <div className="grid md:grid-cols-12">
                  {coverSrc && (
                    <div className="aspect-[16/10] w-full overflow-hidden bg-[#FCE8E8] md:col-span-5 md:aspect-auto dark:bg-[#2B121E]">
                      <SecurePhotoImg
                        src={coverSrc}
                        alt={m.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className={`p-6 ${coverSrc ? 'md:col-span-7' : 'md:col-span-12'}`}>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#8c5263] dark:text-[#D9B8C2]">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="h-3.5 w-3.5 text-[#D6B477]" />
                        {m.date}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-[#C98291] dark:text-[#E7C38A]">
                        <MapPin className="h-3.5 w-3.5" />
                        {m.location}
                      </span>
                    </div>
                    <h4 className="mt-2 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                      {m.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
                      {m.description}
                    </p>
                    {m.story && (
                      <p className="mt-3 text-sm leading-relaxed italic text-[#7D5260] dark:text-[#CFAFBB]">
                        {m.story}
                      </p>
                    )}

                    {tripPhotos.length > 0 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                        {tripPhotos.slice(0, 6).map((p) => {
                          const src = resolvePhotoSrc(p);
                          if (!src) return null;
                          return (
                            <SecurePhotoImg
                              key={p.id}
                              src={src}
                              alt={p.caption}
                              className="h-16 w-20 shrink-0 rounded-xl border border-[#D6B477]/50 object-cover"
                            />
                          );
                        })}
                      </div>
                    )}

                    {tripVoices.map((v) => (
                      <div
                        key={v.id}
                        className="mt-4 rounded-xl border border-[#D6B477]/50 bg-[#FFF9F2] p-3 dark:bg-[#190A12]"
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                          <Volume2 className="h-3.5 w-3.5 text-[#C98291]" />
                          <span>{v.title}</span>
                        </div>
                        <SecureDriveAudio
                          controls
                          src={resolveVoiceSrc(v)}
                          className="h-8 w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

interface ScratchCardProps {
  milestone: Milestone;
  isInitiallyRevealed: boolean;
  onRevealChange: (id: string, revealed: boolean) => void;
}

function ScratchCard({ milestone, isInitiallyRevealed, onRevealChange }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [revealed, setRevealed] = useState(isInitiallyRevealed);
  const drawingRef = useRef(false);

  useEffect(() => {
    setRevealed(isInitiallyRevealed);
  }, [isInitiallyRevealed]);

  const paintFoil = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#D6B477');
    grad.addColorStop(0.5, '#E9D2A6');
    grad.addColorStop(1, '#C98291');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#542D3A';
    ctx.font = '700 17px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ Scratch Gold Foil to Reveal Memory ✦', canvas.width / 2, canvas.height / 2 - 6);
    ctx.fillStyle = '#6c4150';
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${milestone.date} · ${milestone.location}`, canvas.width / 2, canvas.height / 2 + 20);
  };

  useEffect(() => {
    if (!revealed) {
      paintFoil();
    }
  }, [revealed, milestone.id, milestone.date, milestone.location]);

  const checkScratchProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;
      let sampled = 0;
      for (let i = 3; i < pixels.length; i += 4 * 16) {
        sampled += 1;
        if (pixels[i] < 32) cleared += 1;
      }
      if (sampled > 0 && cleared / sampled >= 0.48) {
        setRevealed(true);
        onRevealChange(milestone.id, true);
      }
    } catch {
      // ignore canvas readback errors
    }
  };

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  };

  const coverSrc = resolveCoverSrc(milestone);

  return (
    <div className="luxury-glass relative overflow-hidden rounded-[26px] p-5">
      <div className="flex items-start gap-4">
        {coverSrc && (
          <SecurePhotoImg
            src={coverSrc}
            alt={milestone.title}
            className="h-24 w-28 shrink-0 rounded-xl border border-[#D6B477]/50 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
            {milestone.date} · {milestone.location}
          </p>
          <h4 className="mt-1 font-serif-display text-xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            {milestone.title}
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
            {milestone.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        {!revealed ? (
          <button
            type="button"
            onClick={() => {
              setRevealed(true);
              onRevealChange(milestone.id, true);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#542D3A] hover:underline dark:text-[#FCE8E8]"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Quick Reveal</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRevealed(false);
              onRevealChange(milestone.id, false);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8c5263] hover:text-[#542D3A] dark:text-[#D9B8C2] dark:hover:text-[#FFF5F0]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Foil</span>
          </button>
        )}
      </div>

      {!revealed && (
        <canvas
          ref={canvasRef}
          width={520}
          height={180}
          onMouseDown={(e) => {
            drawingRef.current = true;
            scratchAt(e.clientX, e.clientY);
          }}
          onMouseMove={(e) => {
            if (drawingRef.current) scratchAt(e.clientX, e.clientY);
          }}
          onMouseUp={() => {
            if (drawingRef.current) {
              drawingRef.current = false;
              checkScratchProgress();
            }
          }}
          onMouseLeave={() => {
            if (drawingRef.current) {
              drawingRef.current = false;
              checkScratchProgress();
            }
          }}
          onTouchStart={(e) => {
            drawingRef.current = true;
            if (e.touches[0]) scratchAt(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (drawingRef.current && e.touches[0]) {
              scratchAt(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={() => {
            if (drawingRef.current) {
              drawingRef.current = false;
              checkScratchProgress();
            }
          }}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        />
      )}
    </div>
  );
}

export function ScratchOffTimelineView() {
  const { milestones, activityResetTick } = useMemories();
  const sortedMilestones = useMemo(() => sortByDateAsc(milestones), [milestones]);
  const [localResetTick, setLocalResetTick] = useState(0);
  const [revealedIds, setRevealedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('fy_scratched_cards');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (activityResetTick === 0) return;
    setRevealedIds([]);
    setLocalResetTick((t) => t + 1);
  }, [activityResetTick]);

  const handleRevealChange = (id: string, isRevealed: boolean) => {
    setRevealedIds((prev) => {
      const next = isRevealed
        ? prev.includes(id)
          ? prev
          : [...prev, id]
        : prev.filter((x) => x !== id);
      try {
        localStorage.setItem('fy_scratched_cards', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const resetAllScratchCards = () => {
    try {
      localStorage.removeItem('fy_scratched_cards');
    } catch {
      // ignore
    }
    setRevealedIds([]);
    setLocalResetTick((t) => t + 1);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D6B477]/35 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Gamified Milestone Reveal · Chronological Order
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
            Scratch-Off Memory Cards
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
            <Sparkles className="h-4 w-4 text-[#D6B477]" />
            <span>
              Rub your finger or cursor across each champagne-gold foil layer to uncover our
              memories.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={resetAllScratchCards}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/60 bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] shadow-sm transition-colors hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
          <span>Reset All Scratch Cards</span>
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {sortedMilestones.map((m) => (
          <ScratchCard
            key={`${m.id}-${activityResetTick}-${localResetTick}`}
            milestone={m}
            isInitiallyRevealed={revealedIds.includes(m.id)}
            onRevealChange={handleRevealChange}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 pt-2 text-xs font-medium text-[#7D5260] dark:text-[#D9B8C2]">
        <Heart className="h-3.5 w-3.5 fill-[#C98291] text-[#C98291]" />
        <span>
          Every milestone card reveals a cherished chapter of our story in chronological order.
        </span>
      </div>
    </div>
  );
}
