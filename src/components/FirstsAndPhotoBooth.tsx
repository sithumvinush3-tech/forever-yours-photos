import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Camera,
  Download,
  FlipHorizontal,
  RotateCw,
  Sliders,
  Sparkles,
  Trash2,
  Video,
  VideoOff,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { formatBirthdayLabel, sortByDateAsc } from '../utils/dates';
import {
  BoothLayout,
  BoothSticker,
  BoothTheme,
  PhotoAdjustment,
  renderPhotoStripPng,
} from '../utils/media';
import { resolveCoverSrc, resolvePhotoSrc, resolveRenderableMediaUrl } from '../utils/photoHelpers';
import { SecurePhotoImg } from './SecurePhotoImg';

export function OurFirstsView() {
  const { keepsakes, milestones } = useMemories();
  const firsts = useMemo(
    () =>
      sortByDateAsc(
        keepsakes
          .filter((k) => k.kind === 'first')
          .map((k) => ({ ...k, orderIndex: k.numberIndex ?? 99 })),
      ),
    [keepsakes],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="border-b border-[#D6B477]/35 pb-5">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
          Milestone Keepsakes
        </p>
        <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
          Our Firsts Collection
        </h2>
        <p className="mt-1 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
          Every cherished first together—from our very first photo to our first waterfall
          expedition.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {firsts.map((item, idx) => {
          const matchingMilestone = milestones.find((m) => m.date === item.date);
          const num = String(item.numberIndex ?? idx + 1).padStart(2, '0');
          return (
            <article
              key={item.id}
              className="luxury-glass flex flex-col justify-between rounded-[28px] p-6 transition-transform hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-[#D6B477]" />
                    <span>First Chapter · #{num}</span>
                  </span>
                  <span className="tabular-nums text-[#8c5263] dark:text-[#D9B8C2]">
                    {item.date || 'Unforgettable'}
                  </span>
                </div>
                <h3 className="mt-3 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
                  {item.detail}
                </p>
              </div>
              {resolveCoverSrc(matchingMilestone) && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[#D6B477]/50">
                  <SecurePhotoImg
                    src={resolveCoverSrc(matchingMilestone)}
                    alt={item.title}
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

interface BoothItem {
  id: string;
  src: string;
  caption: string;
  isLocal?: boolean;
}

const FILTER_PRESETS: {
  id: string;
  label: string;
  values: Omit<PhotoAdjustment, 'rotation'>;
}[] = [
  { id: 'natural', label: 'Natural', values: { brightness: 102, contrast: 102, warmth: 0, grayscale: 0 } },
  { id: 'golden', label: 'Golden Hour', values: { brightness: 108, contrast: 108, warmth: 18, grayscale: 0 } },
  { id: 'rose', label: 'Vintage Rose', values: { brightness: 104, contrast: 96, warmth: 12, grayscale: 0 } },
  { id: 'sepia', label: 'Soft Sepia', values: { brightness: 100, contrast: 106, warmth: 38, grayscale: 0 } },
  { id: 'bw', label: 'Dreamy B&W', values: { brightness: 105, contrast: 118, warmth: 0, grayscale: 100 } },
];

export function PhotoBoothView() {
  const { photos, milestones, config, activityResetTick } = useMemories();
  const coupleLabel = `${config.himName} & ${config.herName}`;
  const bdayLabel = formatBirthdayLabel(config.birthdayMonthDay);

  const [boothCaptures, setBoothCaptures] = useState<BoothItem[]>([]);

  const availablePool = useMemo<BoothItem[]>(() => {
    const resolvedPhotos = sortByDateAsc(photos)
      .map((p) => ({ id: p.id, src: resolvePhotoSrc(p), caption: p.caption }))
      .filter((item) => Boolean(item.src));
    const cloudOrCover =
      resolvedPhotos.length > 0
        ? resolvedPhotos
        : sortByDateAsc(milestones)
            .map((m) => ({ id: m.id, src: resolveCoverSrc(m), caption: m.title }))
            .filter((item) => Boolean(item.src));
    return [...boothCaptures, ...cloudOrCover];
  }, [boothCaptures, photos, milestones]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stripTitle, setStripTitle] = useState(`${coupleLabel} · Keepsake Strip`);
  const [dateLabel, setDateLabel] = useState(`Forever Yours · ${bdayLabel}`);
  const [theme, setTheme] = useState<BoothTheme>('cream');
  const [layout, setLayout] = useState<BoothLayout>('vertical');
  const [sticker, setSticker] = useState<BoothSticker>('hearts');
  const [activePreset, setActivePreset] = useState('natural');
  const [adjustments, setAdjustments] = useState<PhotoAdjustment>({
    brightness: 104,
    contrast: 105,
    warmth: 8,
    grayscale: 0,
    rotation: 0,
  });

  // Live Camera Capture State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mirrorCamera, setMirrorCamera] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<number[]>([]);

  const [generatedStripUrl, setGeneratedStripUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [stripError, setStripError] = useState<string | null>(null);

  const clearScheduledTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  // Sync default labels if admin updates config
  useEffect(() => {
    setStripTitle(`${config.himName} & ${config.herName} · Keepsake Strip`);
    setDateLabel(`Forever Yours · ${formatBirthdayLabel(config.birthdayMonthDay)}`);
  }, [config.himName, config.herName, config.birthdayMonthDay]);

  useEffect(() => {
    if (activityResetTick === 0) return;
    setSelectedIds([]);
    setTheme('cream');
    setLayout('vertical');
    setSticker('hearts');
    setActivePreset('natural');
    setAdjustments({
      brightness: 104,
      contrast: 105,
      warmth: 8,
      grayscale: 0,
      rotation: 0,
    });
    setGeneratedStripUrl(null);
  }, [activityResetTick]);

  const stopCamera = () => {
    clearScheduledTimers();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setCountdown(null);
  };

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      clearScheduledTimers();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError(
        'Camera permission was denied or unavailable. You can still select curated photos from our gallery below.',
      );
    }
  };

  const snapNow = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (mirrorCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const id = `booth-cam-${Date.now().toString(36)}`;
    const newItem: BoothItem = {
      id,
      src: dataUrl,
      caption: `${coupleLabel} · Booth Snapshot`,
      isLocal: true,
    };
    setBoothCaptures((prev) => [newItem, ...prev]);
    setSelectedIds((prev) => (prev.length < 4 ? [id, ...prev] : [id, ...prev.slice(0, 3)]));
    setGeneratedStripUrl(null);

    setFlashEffect(true);
    const flashId = window.setTimeout(() => setFlashEffect(false), 260);
    timersRef.current.push(flashId);
  };

  const handleTimerSnap = () => {
    if (countdown !== null) return;
    clearScheduledTimers();
    setCountdown(3);
    const t1 = window.setTimeout(() => setCountdown(2), 900);
    const t2 = window.setTimeout(() => setCountdown(1), 1800);
    const t3 = window.setTimeout(() => {
      setCountdown(null);
      snapNow();
    }, 2700);
    timersRef.current.push(t1, t2, t3);
  };

  const selectedFrames = useMemo(() => {
    const picked = availablePool.filter((item) => selectedIds.includes(item.id));
    return picked.length > 0 ? picked.slice(0, 4) : availablePool.slice(0, 3);
  }, [availablePool, selectedIds]);

  const togglePick = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : [...prev.slice(1), id],
    );
    setGeneratedStripUrl(null);
  };

  const applyPreset = (presetId: string) => {
    const found = FILTER_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePreset(presetId);
    setAdjustments((prev) => ({ ...prev, ...found.values }));
    setGeneratedStripUrl(null);
  };

  const handleRenderStrip = async () => {
    if (selectedFrames.length === 0) return;
    setRendering(true);
    setStripError(null);
    try {
      const resolvedUrls = await Promise.all(
        selectedFrames.map((f) => resolveRenderableMediaUrl(f.src)),
      );
      const validPairs = selectedFrames
        .map((f, idx) => ({ url: resolvedUrls[idx], caption: f.caption }))
        .filter((pair) => Boolean(pair.url));
      if (validPairs.length === 0) return;

      const url = await renderPhotoStripPng({
        images: validPairs.map((p) => p.url),
        captions: validPairs.map((p) => p.caption),
        stripTitle,
        dateLabel,
        coupleLabel,
        theme,
        layout,
        sticker,
        adjustments,
      });
      setGeneratedStripUrl(url);
    } catch (err) {
      setStripError(err instanceof Error ? err.message : 'Unable to generate PNG strip.');
    } finally {
      setRendering(false);
    }
  };

  const previewShellStyle =
    theme === 'cream'
      ? 'border-[#D6B477] bg-[#FFF9F2] text-[#542D3A]'
      : theme === 'obsidian'
        ? 'border-[#D6B477] bg-[#160910] text-[#FFF9F2]'
        : theme === 'blush'
          ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A]'
          : theme === 'gold'
            ? 'border-[#E7C38A] bg-[#2C1B12] text-[#FFF7E8]'
            : 'border-[#D6B477] bg-[#542D3A] text-[#FFF9F2]';

  const stickerSymbol =
    sticker === 'hearts'
      ? '♥'
      : sticker === 'sparkles'
        ? '✦'
        : sticker === 'roses'
          ? '❀'
          : sticker === 'crown'
            ? '♛'
            : '';

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D6B477]/35 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Interactive Digital Photo Booth &amp; Enhancement Studio
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
            Capture, Style &amp; Download Keepsake Strips
          </h2>
          <p className="mt-1 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
            Take live snapshots with your webcam or pick our curated memories, choose a layout,
            apply artistic filters &amp; stickers, and download high-res PNG keepsakes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          {!cameraOpen ? (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#542D3A] px-4 py-2 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810]"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Open Live Camera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-800"
            >
              <VideoOff className="h-3.5 w-3.5" />
              <span>Close Camera</span>
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
          {cameraError}
        </div>
      )}

      {/* Live Webcam Booth Panel */}
      {cameraOpen && (
        <section className="luxury-glass relative overflow-hidden rounded-[28px] p-5 sm:p-6">
          <div className="grid items-center gap-6 md:grid-cols-12">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#D6B477] bg-black md:col-span-7">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  transform: mirrorCamera ? 'scaleX(-1)' : 'none',
                  filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) sepia(${adjustments.warmth}%) grayscale(${adjustments.grayscale ?? 0}%)`,
                }}
                className="aspect-video w-full object-cover"
              />
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <span className="font-serif-display text-7xl font-bold text-[#FFF9F2] drop-shadow-lg">
                    {countdown}
                  </span>
                </div>
              )}
              {flashEffect && <div className="pointer-events-none absolute inset-0 bg-white/85" />}
            </div>

            <div className="space-y-4 md:col-span-5">
              <p className="text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
                Live Studio Viewfinder
              </p>
              <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Strike a Pose Together
              </h3>
              <p className="text-xs leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
                Snap instantly or use the 3-second countdown timer. Every shot automatically joins
                your active photo strip frames.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={snapNow}
                  className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                >
                  <Camera className="h-4 w-4" />
                  <span>Instant Snap</span>
                </button>
                <button
                  type="button"
                  onClick={handleTimerSnap}
                  disabled={countdown !== null}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D6B477] bg-white px-4 py-2.5 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] disabled:opacity-50 dark:bg-[#27111C] dark:text-[#FCE8E8]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C98291]" />
                  <span>{countdown !== null ? `Smile in ${countdown}...` : '3s Timer Snap'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMirrorCamera((m) => !m)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/60 bg-white px-3.5 py-2.5 text-xs font-medium text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]"
                >
                  <FlipHorizontal className="h-3.5 w-3.5" />
                  <span>{mirrorCamera ? 'Mirrored' : 'Normal'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="luxury-glass space-y-6 rounded-[28px] p-6 lg:col-span-7">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
                1. Pick 1–4 Photos ({selectedFrames.length} active)
              </p>
              {boothCaptures.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBoothCaptures([])}
                  className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 hover:underline dark:text-rose-300"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear Booth Shots</span>
                </button>
              )}
            </div>
            <div className="grid max-h-56 grid-cols-3 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4">
              {availablePool.map((item) => {
                const picked = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePick(item.id)}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                      picked
                        ? 'scale-[0.97] border-[#542D3A] ring-2 ring-[#D6B477] dark:border-[#E7C38A]'
                        : 'border-[#D6B477]/40 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <SecurePhotoImg
                      src={item.src}
                      alt={item.caption}
                      className="h-full w-full object-cover"
                    />
                    {item.isLocal && (
                      <span className="absolute bottom-1 left-1 rounded-md bg-[#542D3A]/85 px-1.5 py-0.5 text-[9px] font-bold text-[#FFF9F2]">
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              Strip Title
              <input
                type="text"
                value={stripTitle}
                onChange={(e) => {
                  setStripTitle(e.target.value);
                  setGeneratedStripUrl(null);
                }}
                className="mt-1 w-full rounded-xl border border-[#D6B477]/60 bg-white px-3 py-2 text-sm text-[#542D3A] focus:border-[#542D3A] focus:outline-none dark:bg-[#190A12] dark:text-[#FFF5F0]"
              />
            </label>
            <label className="block text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              Footer Date Label
              <input
                type="text"
                value={dateLabel}
                onChange={(e) => {
                  setDateLabel(e.target.value);
                  setGeneratedStripUrl(null);
                }}
                className="mt-1 w-full rounded-xl border border-[#D6B477]/60 bg-white px-3 py-2 text-sm text-[#542D3A] focus:border-[#542D3A] focus:outline-none dark:bg-[#190A12] dark:text-[#FFF5F0]"
              />
            </label>
          </div>

          {/* Layout & Sticker Controls */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                2. Strip Layout
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'vertical', label: 'Classic Vertical' },
                    { id: 'grid2x2', label: '2×2 Collage' },
                    { id: 'wide', label: 'Cinema Panoramic' },
                  ] as { id: BoothLayout; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setLayout(opt.id);
                      setGeneratedStripUrl(null);
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      layout === opt.id
                        ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                        : 'border-[#D6B477]/50 bg-white text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                3. Corner Accent Stamps
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'hearts', label: '♥ Hearts' },
                    { id: 'sparkles', label: '✦ Stars' },
                    { id: 'roses', label: '❀ Blooms' },
                    { id: 'crown', label: '♛ Royal' },
                    { id: 'none', label: 'Minimal' },
                  ] as { id: BoothSticker; label: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSticker(s.id);
                      setGeneratedStripUrl(null);
                    }}
                    className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      sticker === s.id
                        ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                        : 'border-[#D6B477]/50 bg-white text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Presets & Sliders */}
          <div className="rounded-2xl border border-[#D6B477]/50 bg-[#FFF9F2] p-4 dark:bg-[#1E0C15]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                <Sliders className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                Photo Enhancement &amp; Filter Studio
              </span>
              <button
                type="button"
                onClick={() => {
                  setAdjustments((a) => ({ ...a, rotation: (a.rotation + 90) % 360 }));
                  setGeneratedStripUrl(null);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D6B477]/60 bg-white px-2.5 py-1 text-xs font-medium text-[#542D3A] dark:bg-[#2D1421] dark:text-[#FCE8E8]"
              >
                <RotateCw className="h-3 w-3" />
                Rotate ({adjustments.rotation}°)
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    activePreset === preset.id
                      ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                      : 'border-[#D6B477]/45 bg-white text-[#6c4150] dark:bg-[#27111C] dark:text-[#D9B8C2]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <label className="text-xs font-medium text-[#6c4150] dark:text-[#DEC6CE]">
                Brightness ({adjustments.brightness}%)
                <input
                  type="range"
                  min={70}
                  max={140}
                  value={adjustments.brightness}
                  onChange={(e) => {
                    setAdjustments((a) => ({ ...a, brightness: Number(e.target.value) }));
                    setGeneratedStripUrl(null);
                  }}
                  className="mt-1 w-full accent-[#C98291]"
                />
              </label>
              <label className="text-xs font-medium text-[#6c4150] dark:text-[#DEC6CE]">
                Contrast ({adjustments.contrast}%)
                <input
                  type="range"
                  min={75}
                  max={145}
                  value={adjustments.contrast}
                  onChange={(e) => {
                    setAdjustments((a) => ({ ...a, contrast: Number(e.target.value) }));
                    setGeneratedStripUrl(null);
                  }}
                  className="mt-1 w-full accent-[#C98291]"
                />
              </label>
              <label className="text-xs font-medium text-[#6c4150] dark:text-[#DEC6CE]">
                Warm Glow ({adjustments.warmth}%)
                <input
                  type="range"
                  min={0}
                  max={45}
                  value={adjustments.warmth}
                  onChange={(e) => {
                    setAdjustments((a) => ({ ...a, warmth: Number(e.target.value) }));
                    setGeneratedStripUrl(null);
                  }}
                  className="mt-1 w-full accent-[#C98291]"
                />
              </label>
              <label className="text-xs font-medium text-[#6c4150] dark:text-[#DEC6CE]">
                B&amp;W ({adjustments.grayscale ?? 0}%)
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adjustments.grayscale ?? 0}
                  onChange={(e) => {
                    setAdjustments((a) => ({ ...a, grayscale: Number(e.target.value) }));
                    setGeneratedStripUrl(null);
                  }}
                  className="mt-1 w-full accent-[#C98291]"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['cream', 'blush', 'burgundy', 'obsidian', 'gold'] as BoothTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTheme(t);
                    setGeneratedStripUrl(null);
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize ${
                    theme === t
                      ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                      : 'border-[#D6B477]/50 bg-white text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void handleRenderStrip()}
              disabled={rendering || selectedFrames.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6a3a4a] disabled:opacity-50 dark:bg-gradient-to-r dark:from-[#C98291] dark:to-[#D6B477] dark:text-[#1A0810]"
            >
              <Camera className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
              <span>{rendering ? 'Developing Strip...' : 'Generate High-Res Strip'}</span>
            </button>
          </div>
          {stripError && (
            <p className="rounded-xl border border-amber-400/50 bg-amber-50/90 px-3.5 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {stripError}
            </p>
          )}
        </div>

        <div className="luxury-glass flex flex-col items-center justify-center rounded-[28px] p-6 lg:col-span-5">
          {generatedStripUrl ? (
            <div className="w-full space-y-4 text-center">
              <img
                src={generatedStripUrl}
                alt="Generated Keepsake Photo Strip"
                className="mx-auto max-h-[540px] rounded-xl border border-[#D6B477] object-contain shadow-xl"
              />
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href={generatedStripUrl}
                  download="forever-yours-photostrip.png"
                  className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                >
                  <Download className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
                  <span>Download Photo Strip PNG</span>
                </a>
                <button
                  type="button"
                  onClick={() => setGeneratedStripUrl(null)}
                  className="rounded-full border border-[#D6B477]/60 bg-white px-4 py-2.5 text-xs font-semibold text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]"
                >
                  Back to Editor
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`w-full rounded-2xl border-2 p-4 text-center shadow-lg transition-colors ${previewShellStyle} ${
                layout === 'wide' ? 'max-w-md' : 'max-w-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#D6B477]">
                <span>{stickerSymbol || '·'}</span>
                <span className="text-[10px] tracking-[0.2em] uppercase">Live Preview</span>
                <span>{stickerSymbol || '·'}</span>
              </div>
              <p className="mt-1 font-serif-display text-lg font-bold">{stripTitle}</p>

              <div
                className={`mt-3 gap-2 ${
                  layout === 'vertical'
                    ? 'flex flex-col'
                    : layout === 'grid2x2'
                      ? 'grid grid-cols-2'
                      : 'grid grid-cols-3'
                }`}
              >
                {selectedFrames.map((f) => (
                  <SecurePhotoImg
                    key={f.id}
                    src={f.src}
                    alt={f.caption}
                    variant="full"
                    lazy={false}
                    style={{
                      filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) sepia(${adjustments.warmth}%) grayscale(${adjustments.grayscale ?? 0}%)`,
                      transform: `rotate(${adjustments.rotation}deg)`,
                    }}
                    className={`w-full rounded-lg object-cover ${
                      layout === 'vertical' ? 'aspect-[16/10]' : 'aspect-square'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-[#D6B477]">
                <span>{stickerSymbol || '·'}</span>
                <p className="font-handwriting text-xl">{dateLabel}</p>
                <span>{stickerSymbol || '·'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
