import { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Compass,
  Film,
  Flower2,
  Gift,
  Heart,
  Image as ImageIcon,
  Mail,
  Sparkles,
  Stars,
  TreePine,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { SHOWCASE_ARTWORK } from '../data/seedData';
import type { BackgroundDecor, NavTab, ParticleMode } from '../types';
import { formatBirthdayLabel, sortByDateAsc } from '../utils/dates';
import { resolveCoverSrc } from '../utils/photoHelpers';
import { SecurePhotoImg } from './SecurePhotoImg';

interface MemoryGardenProps {
  onNavigate: (tab: NavTab) => void;
  particleMode: ParticleMode;
  onChangeParticles: (mode: ParticleMode) => void;
  immersiveBackdrop: boolean;
  onToggleBackdrop: () => void;
}

const GARDEN_HOTSPOTS: {
  id: string;
  label: string;
  sublabel: string;
  tab: NavTab;
  left: string;
  top: string;
  icon: typeof TreePine;
}[] = [
  {
    id: 'hs-tree',
    label: 'Timeline Tree',
    sublabel: 'Our Story Timeline',
    tab: 'story',
    left: '14%',
    top: '44%',
    icon: TreePine,
  },
  {
    id: 'hs-lane',
    label: 'Memory Lane',
    sublabel: 'Photo Gallery & Travels',
    tab: 'travels',
    left: '34%',
    top: '55%',
    icon: Camera,
  },
  {
    id: 'hs-stars',
    label: 'Constellation',
    sublabel: 'Relationship Star Map',
    tab: 'starmap',
    left: '51%',
    top: '23%',
    icon: Stars,
  },
  {
    id: 'hs-cinema',
    label: 'Memory Cinema',
    sublabel: 'Memory Movie Maker',
    tab: 'letters',
    left: '66%',
    top: '53%',
    icon: Film,
  },
  {
    id: 'hs-vault',
    label: 'Glowing Love Vault',
    sublabel: 'Letters & Secret Diary',
    tab: 'diary',
    left: '84%',
    top: '57%',
    icon: Mail,
  },
];

export function MemoryGarden({
  onNavigate,
  particleMode,
  onChangeParticles,
  immersiveBackdrop,
  onToggleBackdrop,
}: MemoryGardenProps) {
  const {
    config,
    milestones,
    photos,
    bgDecor,
    toggleBgDecor,
    triggerFireworkBurst,
    activityResetTick,
  } = useMemories();
  const [selectedFlowerId, setSelectedFlowerId] = useState<string | null>(null);
  const [revealedSurprise, setRevealedSurprise] = useState<string | null>(null);

  useEffect(() => {
    if (activityResetTick === 0) return;
    setSelectedFlowerId(null);
    setRevealedSurprise(null);
  }, [activityResetTick]);

  const birthdayLabel = formatBirthdayLabel(config.birthdayMonthDay);

  const onThisDayMemories = useMemo(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todaySuffix = `-${mm}-${dd}`;
    return {
      matchedMilestones: sortByDateAsc(milestones.filter((m) => m.date?.endsWith(todaySuffix))),
      matchedPhotos: sortByDateAsc(photos.filter((p) => p.date?.endsWith(todaySuffix))),
      todayLabel: `${mm}/${dd}`,
    };
  }, [milestones, photos]);

  const gardenFlowers = useMemo(() => {
    return sortByDateAsc(milestones).map((m, idx) => ({
      ...m,
      photoCount: photos.filter((p) => p.milestoneId === m.id).length,
      index: idx + 1,
    }));
  }, [milestones, photos]);

  const selectedFlower =
    gardenFlowers.find((f) => f.id === selectedFlowerId) || gardenFlowers[0] || null;

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6">
      {/* Header & Atmosphere Controls */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D6B477]/35 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Enchanted Sanctuary · {config.himName} &amp; {config.herName}
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-5xl dark:text-[#FFF5F0]">
            Our Interactive Memory Garden
          </h2>
          <p className="mt-1 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
            Click any glowing landmark across the garden scene to step directly into that chapter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['petals', 'fireflies', 'sparkles', 'off'] as ParticleMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeParticles(mode)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                particleMode === mode
                  ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                  : 'border-[#D6B477]/45 bg-white text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
              }`}
            >
              {mode === 'off' ? 'Still Air' : mode}
            </button>
          ))}
          <button
            type="button"
            onClick={onToggleBackdrop}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              immersiveBackdrop
                ? 'border-[#D6B477] bg-[#FCE8E8] text-[#542D3A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                : 'border-[#D6B477]/45 bg-white text-[#7D5260] dark:bg-[#27111C] dark:text-[#D9B8C2]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
            <span>{immersiveBackdrop ? 'Silk Photo Glow On' : 'Silk Photo Glow Off'}</span>
          </button>
        </div>
      </div>

      {/* Decorate Global Background Elements */}
      <section className="luxury-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#D6B477]" />
          <span className="text-xs font-bold tracking-[0.14em] text-[#542D3A] uppercase dark:text-[#FFF5F0]">
            Decorate Background
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'fireworks', label: 'Fireworks' },
              { key: 'roses', label: 'Roses' },
              { key: 'vines', label: 'Flower Vines' },
              { key: 'stars', label: 'Stars' },
              { key: 'petals', label: 'Petals' },
            ] as { key: keyof BackgroundDecor; label: string }[]
          ).map((item) => {
            const active = bgDecor[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleBgDecor(item.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                    : 'border-[#D6B477]/40 bg-white/80 text-[#7D5260] hover:bg-[#FCE8E8]/60 dark:bg-[#27111C] dark:text-[#D9B8C2]'
                }`}
              >
                {item.label} {active ? 'On' : 'Off'}
              </button>
            );
          })}
          <button
            type="button"
            onClick={triggerFireworkBurst}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#542D3A] px-3.5 py-1.5 text-xs font-semibold text-[#FFF9F2] transition-colors hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1B0911]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D6B477] dark:text-[#1B0911]" />
            <span>Launch Fireworks</span>
          </button>
        </div>
      </section>

      {/* Interactive Uploaded Memory Garden Visual Map */}
      <section className="relative overflow-hidden rounded-[32px] border-2 border-[#D6B477]/65 bg-white p-2.5 shadow-2xl dark:bg-[#1E0C15]">
        <div className="relative aspect-[16/9] min-h-[280px] w-full overflow-hidden rounded-[24px]">
          <img
            src={SHOWCASE_ARTWORK.memoryGarden}
            alt="Forever Yours Enchanted Memory Garden"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />

          {/* Subtle warm border sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#542D3A]/35 via-transparent to-transparent" />

          {/* Animated Butterflies Fluttering in the Garden */}
          <svg
            viewBox="0 0 48 36"
            aria-hidden="true"
            style={{ left: '24%', top: '28%' }}
            className="animate-butterfly pointer-events-none absolute h-8 w-10 text-[#FFF9F2] drop-shadow-md"
          >
            <path
              d="M24 18 C16 4, 2 4, 6 18 C2 28, 16 32, 24 20 C32 32, 46 28, 42 18 C46 4, 32 4, 24 18 Z"
              fill="#FCE8E8"
              stroke="#D6B477"
              strokeWidth="1.5"
            />
          </svg>
          <svg
            viewBox="0 0 48 36"
            aria-hidden="true"
            style={{ left: '61%', top: '34%', animationDelay: '2.2s' }}
            className="animate-butterfly pointer-events-none absolute h-7 w-9 text-[#FFF9F2] drop-shadow-md"
          >
            <path
              d="M24 18 C16 4, 2 4, 6 18 C2 28, 16 32, 24 20 C32 32, 46 28, 42 18 C46 4, 32 4, 24 18 Z"
              fill="#D6B477"
              fillOpacity="0.8"
              stroke="#FFF9F2"
              strokeWidth="1.5"
            />
          </svg>

          {/* Clickable Interactive Garden Landmarks */}
          {GARDEN_HOTSPOTS.map((hs) => {
            const Icon = hs.icon;
            return (
              <button
                key={hs.id}
                type="button"
                onClick={() => onNavigate(hs.tab)}
                style={{ left: hs.left, top: hs.top }}
                className="group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-white"
              >
                <span className="flex items-center gap-2 rounded-full border border-[#D6B477] bg-[#FFF9F2]/92 px-3 py-1.5 text-xs font-semibold text-[#542D3A] shadow-lg backdrop-blur-sm transition-colors group-hover:bg-[#542D3A] group-hover:text-[#FFF9F2] dark:bg-[#210E18]/92 dark:text-[#FFF5F0]">
                  <Icon className="h-3.5 w-3.5 text-[#C98291] group-hover:text-[#D6B477]" />
                  <span className="hidden sm:inline">{hs.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Accessible Landmark Quick Bar beneath Artwork */}
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {GARDEN_HOTSPOTS.map((hs) => {
            const Icon = hs.icon;
            return (
              <button
                key={`${hs.id}-btn`}
                type="button"
                onClick={() => onNavigate(hs.tab)}
                className="flex items-center gap-2.5 rounded-2xl border border-[#D6B477]/35 bg-[#FFF9F2] px-3.5 py-2.5 text-left transition-colors hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:hover:bg-[#3A192A]"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#C98291] dark:text-[#E7C38A]" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {hs.label}
                  </p>
                  <p className="truncate text-[11px] text-[#7D5260] dark:text-[#D9B8C2]">
                    {hs.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Blooming Memory Flowers (In Chronological Date Order) */}
      <section className="luxury-glass rounded-[32px] p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] sm:text-3xl dark:text-[#FFF5F0]">
              Memory Blooms in the Garden
            </h3>
            <p className="text-sm text-[#7D5260] dark:text-[#D9B8C2]">
              Tap any flower to watch its story blossom right before your eyes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('travels')}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#542D3A] px-4 py-2 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810]"
          >
            <Compass className="h-3.5 w-3.5 text-[#D6B477] dark:text-[#1A0810]" />
            <span>Open Full Gallery</span>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {gardenFlowers.map((flower) => {
              const active = selectedFlower?.id === flower.id;
              return (
                <button
                  key={flower.id}
                  type="button"
                  onClick={() => setSelectedFlowerId(flower.id)}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? 'border-[#C98291] bg-white shadow-md dark:border-[#E7C38A] dark:bg-[#2B121F]'
                      : 'border-[#D6B477]/35 bg-[#FFF9F2]/80 hover:bg-white dark:bg-[#1E0C15]/80 dark:hover:bg-[#27111C]'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${
                      active
                        ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#E7C38A]'
                        : 'border-[#D6B477]/45 bg-white text-[#C98291] dark:bg-[#27111C] dark:text-[#E7C38A]'
                    }`}
                  >
                    <Flower2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-serif-display text-lg font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                      {flower.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#7D5260] dark:text-[#D9B8C2]">
                      {flower.date} · {flower.photoCount} photos
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedFlower && (() => {
            const coverSrc = resolveCoverSrc(selectedFlower);
            return (
              <div className="flex flex-col justify-between rounded-3xl border border-[#D6B477]/50 bg-white p-5 shadow-sm lg:col-span-5 dark:bg-[#240F1A]">
                {coverSrc && (
                  <SecurePhotoImg
                    src={coverSrc}
                    alt={selectedFlower.title}
                    variant="full"
                    className="aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                )}
              <div className="mt-4">
                <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                  {selectedFlower.date} · {selectedFlower.location}
                </p>
                <h4 className="mt-1 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                  {selectedFlower.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
                  {selectedFlower.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('travels')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#542D3A] hover:text-[#C98291] dark:text-[#FCE8E8] dark:hover:text-[#E7C38A]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#D6B477]" />
                <span>View Chapter Photographs →</span>
              </button>
              </div>
            );
          })()}
        </div>
      </section>

      {/* On This Day + Hidden Garden Keepsakes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="luxury-glass rounded-3xl p-6">
          <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            On This Day ({onThisDayMemories.todayLabel})
          </h3>
          {onThisDayMemories.matchedMilestones.length > 0 ||
          onThisDayMemories.matchedPhotos.length > 0 ? (
            <div className="mt-4 space-y-3">
              {onThisDayMemories.matchedMilestones.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-[#D6B477]/45 bg-[#FCE8E8]/55 p-4 dark:bg-[#2B121E]"
                >
                  <p className="font-serif-display text-lg font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {m.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7D5260] dark:text-[#D9B8C2]">
                    {m.date} · {m.location}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
              Every curated milestone date blooms right here on its anniversary each year. Next major
              celebration:{' '}
              <strong className="text-[#542D3A] dark:text-[#E7C38A]">{birthdayLabel}</strong> (
              {config.herName}&apos;s Birthday).
            </p>
          )}
        </section>

        <section className="luxury-glass rounded-3xl p-6">
          <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            Garden Secret Keepsakes
          </h3>
          <p className="mt-1 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
            Tap beneath the roses to uncover hidden notes from {config.himName}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setRevealedSurprise(
                  `Even on the mistiest road at Baker's Bend, the brightest view was always you, ${config.herNickname}.`,
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-[#D6B477] bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
            >
              <Heart className="h-3.5 w-3.5 fill-[#C98291] text-[#C98291]" />
              <span>Rosebush Heart</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setRevealedSurprise(
                  `Happy Birthday, ${config.herNickname}! Check your Love Coupons in Diary & Vault for unlimited treats!`,
                )
              }
              className="inline-flex items-center gap-2 rounded-full border border-[#D6B477] bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
            >
              <Gift className="h-3.5 w-3.5 text-[#D6B477]" />
              <span>Gazebo Gift Box</span>
            </button>
          </div>
          {revealedSurprise && (
            <div className="font-handwriting mt-4 rounded-2xl border border-[#D6B477]/50 bg-[#FFFDF9] p-4 text-xl text-[#542D3A] dark:bg-[#240F1A] dark:text-[#FFF5F0]">
              {revealedSurprise}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
