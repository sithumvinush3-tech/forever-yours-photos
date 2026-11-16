import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Stars } from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { formatFullDateLabel, sortByDateAsc } from '../utils/dates';

interface StarNode {
  id: string;
  x: number;
  y: number;
  r: number;
  label: string;
  date: string;
  note: string;
}

const CONSTELLATION_RING = [
  { x: 0.24, y: 0.34, r: 6.5 },
  { x: 0.41, y: 0.25, r: 5.5 },
  { x: 0.59, y: 0.29, r: 6 },
  { x: 0.72, y: 0.45, r: 5.5 },
  { x: 0.64, y: 0.64, r: 5.5 },
  { x: 0.45, y: 0.71, r: 6 },
  { x: 0.29, y: 0.57, r: 5.5 },
  { x: 0.36, y: 0.45, r: 5.5 },
];

export function StarMapView() {
  const { config, milestones, activityResetTick } = useMemories();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const memoryStars = useMemo<StarNode[]>(() => {
    const anniversaryNice = formatFullDateLabel(config.anniversaryDate);
    const ordered = sortByDateAsc(milestones);

    const originStar: StarNode = {
      id: 'star-origin',
      x: CONSTELLATION_RING[0].x,
      y: CONSTELLATION_RING[0].y,
      r: CONSTELLATION_RING[0].r,
      label: `${anniversaryNice} · Constellation of ${config.himName} & ${config.herName}`,
      date: config.anniversaryDate,
      note: `Above Sri Lanka on ${anniversaryNice}, ${config.himName} & ${config.herName} stepped onto the exact same orbit.`,
    };

    const milestoneStars: StarNode[] = ordered.map((m, idx) => {
      const slot =
        CONSTELLATION_RING[(idx + 1) % CONSTELLATION_RING.length] ||
        (() => {
          const angle = ((idx + 1) / Math.max(1, ordered.length)) * Math.PI * 2;
          return {
            x: 0.5 + Math.cos(angle) * 0.28,
            y: 0.5 + Math.sin(angle) * 0.26,
            r: 5.5,
          };
        })();
      const orbitOffset = idx >= CONSTELLATION_RING.length - 1 ? 0.05 * Math.floor(idx / 7) : 0;
      return {
        id: `star-${m.id}`,
        x: Math.min(0.84, Math.max(0.16, slot.x + orbitOffset)),
        y: Math.min(0.82, Math.max(0.18, slot.y - orbitOffset * 0.5)),
        r: slot.r,
        label: m.title,
        date: m.date,
        note: m.description,
      };
    });

    return [originStar, ...milestoneStars];
  }, [config.anniversaryDate, config.himName, config.herName, milestones]);

  const [selectedStarId, setSelectedStarId] = useState<string>('star-origin');

  useEffect(() => {
    if (activityResetTick === 0) return;
    setSelectedStarId('star-origin');
  }, [activityResetTick]);

  const selectedStar =
    memoryStars.find((s) => s.id === selectedStarId) || memoryStars[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const bgStars = Array.from({ length: 190 }, (_, idx) => ({
      x: ((idx * 73 + 19) % 997) / 997,
      y: ((idx * 137 + 43) % 991) / 991,
      size: 0.7 + (idx % 3) * 0.65,
      phase: idx * 0.45,
    }));

    const render = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;

      const sky = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.7);
      sky.addColorStop(0, '#3D1E2A');
      sky.addColorStop(0.55, '#25101A');
      sky.addColorStop(1, '#16090F');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Champagne gold astrolabe rings
      ctx.strokeStyle = 'rgba(214, 180, 119, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.44, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(214, 180, 119, 0.16)';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.34, 0, Math.PI * 2);
      ctx.stroke();

      for (const s of bgStars) {
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.0014 + s.phase));
        ctx.fillStyle = `rgba(255, 249, 242, ${twinkle.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dusty rose & gold constellation connecting lines
      ctx.strokeStyle = 'rgba(214, 180, 119, 0.6)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      memoryStars.forEach((star, i) => {
        const sx = star.x * w;
        const sy = star.y * h;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
      ctx.stroke();

      memoryStars.forEach((star) => {
        const sx = star.x * w;
        const sy = star.y * h;
        const active = selectedStar?.id === star.id;

        const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, active ? 26 : 16);
        glow.addColorStop(0, active ? 'rgba(214, 180, 119, 0.95)' : 'rgba(252, 232, 232, 0.85)');
        glow.addColorStop(1, 'rgba(201, 130, 145, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, active ? 26 : 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = active ? '#D6B477' : '#FFF9F2';
        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [memoryStars, selectedStar]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    let closest = memoryStars[0];
    let minDist = Infinity;
    for (const star of memoryStars) {
      const d = Math.hypot(star.x - nx, star.y - ny);
      if (d < minDist) {
        minDist = d;
        closest = star;
      }
    }
    if (closest && minDist < 0.14) {
      setSelectedStarId(closest.id);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="border-b border-[#D6B477]/35 pb-5">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
          Celestial Alignment · Sri Lanka · {formatFullDateLabel(config.anniversaryDate)}
        </p>
        <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
          The Night Sky When Our Story Began
        </h2>
        <p className="mt-1 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
          Tap any glowing star inside our champagne-gold astrolabe to read the synchronized chapter
          written beneath it.
        </p>
      </div>

      <div className="grid items-center gap-6 lg:grid-cols-12">
        <div className="luxury-glass overflow-hidden rounded-[32px] border-2 border-[#D6B477] p-3 lg:col-span-7">
          <canvas
            ref={canvasRef}
            width={760}
            height={520}
            onClick={handleCanvasClick}
            className="h-auto w-full cursor-pointer rounded-2xl"
          />
        </div>

        {selectedStar && (
          <div className="luxury-glass space-y-5 rounded-[32px] p-6 sm:p-8 lg:col-span-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
              <Stars className="h-4 w-4 text-[#D6B477]" />
              <span className="tabular-nums">{selectedStar.date}</span>
            </div>
            <h3 className="font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              {selectedStar.label}
            </h3>
            <p className="text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
              {selectedStar.note}
            </p>

            <div className="space-y-2 border-t border-[#D6B477]/35 pt-4">
              <p className="text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                Jump to Constellation Star:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {memoryStars.map((star) => (
                  <button
                    key={star.id}
                    type="button"
                    onClick={() => setSelectedStarId(star.id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedStar.id === star.id
                        ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                        : 'border-[#D6B477]/50 bg-white text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
                    }`}
                  >
                    <Sparkles className="h-3 w-3 text-[#D6B477]" />
                    <span>{star.label.split(' · ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
