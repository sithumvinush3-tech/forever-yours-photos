import { useEffect, useMemo, useRef, useState } from 'react';
import { useMemories } from '../context/MemoryContext';
import type { ParticleMode } from '../types';
import { resolveCoverSrc, resolvePhotoSrc } from '../utils/photoHelpers';

interface AmbientParticlesProps {
  mode: ParticleMode;
  immersiveBackdrop: boolean;
}

interface FireworkRocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
}

interface FireworkSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  size: number;
  color: string;
}

const UPLOADED_FLORAL_ASSETS = {
  pinkHibiscusVine: '/assets/aistudio/Pink_Hibiscus_Vine_Garland_2cac6966.webp',
  redHibiscusVine: '/assets/aistudio/Vibrant_Hibiscus_Vine_Border_38976dad.webp',
  dewyRoseGarland: '/assets/aistudio/Dewy_Red_Rose_Garland_Clipart_f5e8916b.webp',
  roseStickerSheet: '/assets/aistudio/Red_Rose_Sticker_Sheet_Collection_27f705ee.webp',
} as const;

const ROSE_STICKER_CROPS = [
  { id: 'single-top', viewBox: '683 11 248 501', ratio: 248 / 501 },
  { id: 'ribbon-bouquet', viewBox: '329 10 335 502', ratio: 335 / 502 },
  { id: 'heart-roses', viewBox: '354 512 370 495', ratio: 370 / 495 },
  { id: 'rose-cascade', viewBox: '947 12 280 500', ratio: 280 / 500 },
  { id: 'swirl-cluster', viewBox: '7 12 307 500', ratio: 307 / 500 },
  { id: 'single-bottom', viewBox: '962 512 235 499', ratio: 235 / 499 },
  { id: 'gold-corner', viewBox: '1202 512 326 499', ratio: 326 / 499 },
] as const;

function RoseStickerSprite({
  cropIndex,
  height,
  className = '',
}: {
  cropIndex: number;
  height: number;
  className?: string;
}) {
  const crop = ROSE_STICKER_CROPS[cropIndex % ROSE_STICKER_CROPS.length];
  const width = Math.round(height * crop.ratio);
  return (
    <svg
      width={width}
      height={height}
      viewBox={crop.viewBox}
      aria-hidden="true"
      className={className}
    >
      <image
        href={UPLOADED_FLORAL_ASSETS.roseStickerSheet}
        x="0"
        y="0"
        width="1536"
        height="1024"
      />
    </svg>
  );
}

export function UploadedFloralOverlay({ subtleOverVideo = false }: { subtleOverVideo?: boolean }) {
  const { bgDecor, themeMode } = useMemories();

  const floatingRoses = useMemo(
    () => [
      { id: 0, crop: 0, left: '3%', delay: '0s', duration: '18s', height: 58 },
      { id: 1, crop: 2, left: '11%', delay: '4.5s', duration: '21s', height: 56 },
      { id: 2, crop: 3, left: '84%', delay: '2s', duration: '19s', height: 64 },
      { id: 3, crop: 5, left: '92%', delay: '7.5s', duration: '22s', height: 56 },
      { id: 4, crop: 1, left: '6%', delay: '10.5s', duration: '24s', height: 60 },
      { id: 5, crop: 4, left: '88%', delay: '12.5s', duration: '20s', height: 62 },
    ],
    [],
  );

  if (!bgDecor.vines && !bgDecor.roses) return null;

  const vineOpacity = subtleOverVideo
    ? themeMode === 'dark'
      ? 'opacity-75'
      : 'opacity-80'
    : themeMode === 'dark'
      ? 'opacity-80'
      : 'opacity-85';

  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 z-10 overflow-hidden"
    >
      {bgDecor.vines && (
        <>
          {/* Top-Left: Uploaded Pink Hibiscus Vine Garland */}
          <img
            src={UPLOADED_FLORAL_ASSETS.pinkHibiscusVine}
            alt=""
            className={`animate-vine absolute top-20 -left-5 w-48 sm:top-24 sm:w-64 lg:w-80 drop-shadow-lg select-none ${vineOpacity}`}
          />

          {/* Top-Right: Uploaded Vibrant Red Hibiscus Vine Border */}
          <img
            src={UPLOADED_FLORAL_ASSETS.redHibiscusVine}
            alt=""
            style={{ animationDelay: '1.8s' }}
            className={`animate-vine absolute top-20 -right-5 w-48 -scale-x-100 sm:top-24 sm:w-64 lg:w-80 drop-shadow-lg select-none ${vineOpacity}`}
          />

          {/* Bottom-Left: Uploaded Dewy Red Rose Garland */}
          <img
            src={UPLOADED_FLORAL_ASSETS.dewyRoseGarland}
            alt=""
            style={{ animationDelay: '2.6s' }}
            className={`animate-vine absolute -bottom-3 -left-4 w-52 sm:w-72 lg:w-[22rem] drop-shadow-xl select-none ${vineOpacity}`}
          />

          {/* Bottom-Right: Uploaded Red Rose Gold-Swirl Corner Bouquet */}
          <div
            style={{ animationDelay: '3.4s' }}
            className={`animate-vine absolute right-1 bottom-1 w-36 sm:w-48 lg:w-60 drop-shadow-xl ${vineOpacity}`}
          >
            <RoseStickerSprite cropIndex={6} height={220} className="h-auto w-full" />
          </div>
        </>
      )}

      {bgDecor.roses &&
        floatingRoses.map((rose) => (
          <div
            key={`uploaded-rose-${rose.id}`}
            style={{
              left: rose.left,
              animation: `roseFloat ${rose.duration} linear ${rose.delay} infinite`,
            }}
            className={`absolute -top-20 drop-shadow-md ${
              subtleOverVideo ? 'opacity-60' : 'opacity-70'
            }`}
          >
            <RoseStickerSprite cropIndex={rose.crop} height={rose.height} />
          </div>
        ))}
    </div>
  );
}

export function AmbientParticles({ mode, immersiveBackdrop }: AmbientParticlesProps) {
  const { photos, milestones, themeMode, bgDecor, fireworkBurstTick } = useMemories();
  const [slideIndex, setSlideIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spawnBurstRef = useRef<((count?: number) => void) | null>(null);

  const backdropImages = useMemo(() => {
    const photoUrls = photos.map((p) => resolvePhotoSrc(p)).filter(Boolean);
    if (photoUrls.length > 0) return photoUrls.slice(0, 10);
    return milestones.map((m) => resolveCoverSrc(m)).filter(Boolean);
  }, [photos, milestones]);

  useEffect(() => {
    if (!bgDecor.immersiveBackdrop || !immersiveBackdrop || backdropImages.length <= 1) return;
    const id = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % backdropImages.length);
    }, 9000);
    return () => window.clearInterval(id);
  }, [bgDecor.immersiveBackdrop, immersiveBackdrop, backdropImages.length]);

  // Live Firework Canvas Engine
  useEffect(() => {
    if (!bgDecor.fireworks) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const rockets: FireworkRocket[] = [];
    const sparks: FireworkSpark[] = [];

    const palette =
      themeMode === 'dark'
        ? ['#E7C38A', '#F9DFB0', '#F4A6B8', '#FFF5F0', '#D97C94', '#FFD4E2']
        : ['#B88635', '#C98291', '#A64D69', '#D6B477', '#9A3D58', '#DF7D96'];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const explodeAt = (x: number, y: number, color: string) => {
      const sparkCount = 44;
      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.14;
        const speed = 1.6 + Math.random() * 3.6;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 0.96,
          decay: 0.012 + Math.random() * 0.01,
          size: 1.5 + Math.random() * 2.2,
          color: i % 5 === 0 ? '#FFE7B3' : color,
        });
      }
    };

    const launchRocket = (startX?: number) => {
      const x = startX ?? width * (0.12 + Math.random() * 0.76);
      const targetY = height * (0.12 + Math.random() * 0.34);
      const color = palette[Math.floor(Math.random() * palette.length)];
      rockets.push({
        x,
        y: height + 10,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -(6.8 + Math.random() * 2.4),
        targetY,
        color,
      });
    };

    spawnBurstRef.current = (count = 3) => {
      for (let i = 0; i < count; i++) {
        const bx = width * (0.18 + (i / Math.max(1, count - 1)) * 0.64 + (Math.random() - 0.5) * 0.08);
        const by = height * (0.16 + Math.random() * 0.24);
        const color = palette[Math.floor(Math.random() * palette.length)];
        explodeAt(bx, by, color);
      }
    };

    // Initial celebratory welcome bursts
    launchRocket(width * 0.24);
    launchRocket(width * 0.76);

    let frame = 0;
    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);

      if (frame % 105 === 0 && rockets.length < 4 && sparks.length < 280) {
        launchRocket();
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy *= 0.992;

        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (r.y <= r.targetY || r.vy > -1.5) {
          explodeAt(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.975;
        s.vy = s.vy * 0.975 + 0.042;
        s.alpha -= s.decay;

        if (s.alpha <= 0.03) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.min(1, s.alpha * (themeMode === 'dark' ? 0.95 : 0.78));
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = themeMode === 'dark' ? 9 : 4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = window.requestAnimationFrame(tick);
    };

    animId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      spawnBurstRef.current = null;
    };
  }, [bgDecor.fireworks, themeMode]);

  // Trigger instant multi-burst whenever user presses Launch Fireworks!
  useEffect(() => {
    if (fireworkBurstTick > 0 && spawnBurstRef.current) {
      spawnBurstRef.current(4);
    }
  }, [fireworkBurstTick]);

  const petals = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${(i * 4.3 + 2) % 97}%`,
        delay: `${(i % 8) * 1.15}s`,
        duration: `${10 + (i % 5) * 2.1}s`,
        size: 9 + (i % 4) * 3,
      })),
    [],
  );

  const fireflyItems = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${(i * 6.1 + 3) % 95}%`,
        top: `${(i * 11.7 + 6) % 90}%`,
        delay: `${(i % 7) * 1.1}s`,
        duration: `${9 + (i % 5) * 2}s`,
      })),
    [],
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 17.3 + 3) % 98}%`,
        top: `${(i * 13.9 + 4) % 94}%`,
        size: i % 6 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
        delay: `${(i % 7) * 0.65}s`,
        isCross: i % 7 === 0,
      })),
    [],
  );

  const currentBg = backdropImages[slideIndex % Math.max(1, backdropImages.length)];

  return (
    <>
      {/* Layer 1: Theme Canvas + Aurora + Twinkling Stars & Shooting Stars */}
      {themeMode === 'dark' ? (
        <div
          aria-hidden="true"
          className="no-print pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#11060B]"
        >
          <div
            className="animate-aurora absolute -top-36 -left-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(201,130,145,0.24)_0%,transparent_70%)] blur-3xl"
          />
          <div
            className="animate-aurora absolute top-1/3 -right-28 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(214,180,119,0.20)_0%,transparent_70%)] blur-3xl"
            style={{ animationDelay: '3s' }}
          />
          <div
            className="animate-aurora absolute -bottom-32 left-1/4 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(128,44,82,0.28)_0%,transparent_72%)] blur-3xl"
            style={{ animationDelay: '6s' }}
          />
          {bgDecor.stars && (
            <>
              {stars.map((s) =>
                s.isCross ? (
                  <span
                    key={s.id}
                    style={{
                      left: s.left,
                      top: s.top,
                      animation: `pulseSoft 3.2s ease-in-out ${s.delay} infinite`,
                    }}
                    className="absolute text-xs leading-none text-[#FFE6B3] drop-shadow-[0_0_6px_rgba(231,195,138,0.85)]"
                  >
                    ✦
                  </span>
                ) : (
                  <span
                    key={s.id}
                    style={{
                      left: s.left,
                      top: s.top,
                      width: `${s.size}px`,
                      height: `${s.size}px`,
                      animation: `pulseSoft 3.8s ease-in-out ${s.delay} infinite`,
                    }}
                    className="absolute rounded-full bg-[#F5DCE4]/75 shadow-[0_0_6px_rgba(255,235,240,0.45)]"
                  />
                ),
              )}
              <span
                style={{ left: '78%', top: '14%', animation: 'shootingStar 7.5s ease-in-out 1s infinite' }}
                className="absolute h-[2px] w-24 rounded-full bg-gradient-to-r from-[#FFE6B3] via-[#FFF9F2]/70 to-transparent"
              />
              <span
                style={{ left: '42%', top: '8%', animation: 'shootingStar 9.5s ease-in-out 4.2s infinite' }}
                className="absolute h-[2px] w-20 rounded-full bg-gradient-to-r from-[#F4A6B8] via-[#FFF9F2]/65 to-transparent"
              />
            </>
          )}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="no-print pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-gradient-to-b from-[#FFF9F2] via-[#FFF6F3] to-[#FCE8E8]/65"
        >
          {bgDecor.stars && (
            <>
              {stars.slice(0, 36).map((s) => (
                <span
                  key={s.id}
                  style={{
                    left: s.left,
                    top: s.top,
                    animation: `pulseSoft 4s ease-in-out ${s.delay} infinite`,
                  }}
                  className={`absolute leading-none ${
                    s.id % 3 === 0 ? 'text-[#C98291]' : 'text-[#C49A52]'
                  } ${s.isCross ? 'text-sm opacity-90' : 'text-[10px] opacity-75'}`}
                >
                  ✦
                </span>
              ))}
              <span
                style={{ left: '75%', top: '12%', animation: 'shootingStar 8.5s ease-in-out 1.5s infinite' }}
                className="absolute h-[2px] w-20 rounded-full bg-gradient-to-r from-[#C49A52] via-[#C98291]/60 to-transparent"
              />
            </>
          )}
        </div>
      )}

      {/* Layer 2: Softly Diffused Couple Photo Silk Glow */}
      {bgDecor.immersiveBackdrop && immersiveBackdrop && currentBg && (
        <div
          aria-hidden="true"
          className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-opacity duration-1000"
        >
          <img
            src={currentBg}
            alt=""
            referrerPolicy="no-referrer"
            className={`h-full w-full scale-110 object-cover blur-2xl transition-all duration-1000 ${
              themeMode === 'dark' ? 'opacity-[0.16]' : 'opacity-[0.12]'
            }`}
          />
          <div
            className={`absolute inset-0 ${
              themeMode === 'dark' ? 'bg-[#11060B]/72' : 'bg-[#FFF9F2]/75'
            }`}
          />
        </div>
      )}

      {/* Layer 3: Uploaded Hibiscus Vines, Dewy Rose Garlands & Floating Rose Bouquets */}
      <UploadedFloralOverlay />

      {/* Layer 4: Live Interactive Fireworks Canvas */}
      {bgDecor.fireworks && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="no-print pointer-events-none fixed inset-0 z-10"
        />
      )}

      {/* Layer 5: Drifting Petals and Fireflies / Sparkles */}
      {(bgDecor.petals || mode !== 'off') && (
        <div
          aria-hidden="true"
          className="no-print pointer-events-none fixed inset-0 z-10 overflow-hidden"
        >
          {(bgDecor.petals || mode === 'petals') &&
            petals.map((item) => (
              <span
                key={`petal-${item.id}`}
                style={{
                  left: item.left,
                  width: `${item.size + 4}px`,
                  height: `${item.size}px`,
                  animation: `petalDrift ${item.duration} linear ${item.delay} infinite`,
                }}
                className={
                  themeMode === 'dark'
                    ? 'absolute -top-6 rounded-tl-full rounded-br-full bg-gradient-to-br from-[#F2B8C6]/85 via-[#C98291]/75 to-[#692B44]/75 shadow-[0_0_8px_rgba(201,130,145,0.35)]'
                    : 'absolute -top-6 rounded-tl-full rounded-br-full bg-gradient-to-br from-[#FCE8E8] via-[#e9b6c0] to-[#C98291]/75 shadow-sm'
                }
              />
            ))}

          {mode === 'fireflies' &&
            fireflyItems.map((item) => (
              <span
                key={`firefly-${item.id}`}
                style={{
                  left: item.left,
                  top: item.top,
                  width: '6px',
                  height: '6px',
                  animation: `goldSparkleFloat ${item.duration} ease-in-out ${item.delay} infinite`,
                }}
                className="absolute rounded-full bg-[#D6B477] shadow-[0_0_12px_3px_rgba(214,180,119,0.65)]"
              />
            ))}

          {mode === 'sparkles' &&
            fireflyItems.map((item) => (
              <span
                key={`sparkle-${item.id}`}
                style={{
                  left: item.left,
                  top: item.top,
                  width: '6px',
                  height: '6px',
                  animation: `goldSparkleFloat ${item.duration} ease-in-out ${item.delay} infinite`,
                }}
                className="absolute rotate-45 bg-[#D6B477]/85 shadow-[0_0_10px_2px_rgba(214,180,119,0.5)]"
              />
            ))}
        </div>
      )}
    </>
  );
}
