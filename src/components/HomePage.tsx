import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Cake,
  Compass,
  Flower2,
  Gamepad2,
  Gift,
  Heart,
  Mail,
  Sparkles,
  Stars,
  Wind,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { SHOWCASE_ARTWORK } from '../data/seedData';
import type { NavTab } from '../types';
import { birthdayAudio } from '../utils/audioEngine';
import { formatBirthdayLabel, formatFullDateLabel } from '../utils/dates';
import { resolveCoverSrc, resolvePhotoSrc } from '../utils/photoHelpers';
import { Countdown } from './Countdown';
import { SecurePhotoImg } from './SecurePhotoImg';

interface HomePageProps {
  onNavigate: (tab: NavTab) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const {
    config,
    milestones,
    photos,
    letters,
    bgDecor,
    toggleBgDecor,
    setGardenModeActive,
    triggerWindBurst,
    activityResetTick,
  } = useMemories();
  const [openedSurprises, setOpenedSurprises] = useState<string[]>([]);

  useEffect(() => {
    if (activityResetTick === 0) return;
    setOpenedSurprises([]);
  }, [activityResetTick]);

  const birthdayLabel = formatBirthdayLabel(config.birthdayMonthDay);
  const anniversaryLabel = formatFullDateLabel(config.anniversaryDate);

  const surpriseCards = [
    {
      id: 'surprise-1',
      title: 'A Secret Birthday Promise',
      message: `Wherever life takes us after ${anniversaryLabel}, my favorite destination will always be right beside your smile, ${config.herNickname}.`,
    },
    {
      id: 'surprise-2',
      title: 'Hidden Memory Note',
      message:
        "Even the misty curves of Baker's Bend and the tallest cascade at Babarakanda couldn't outshine how happy you made me that week.",
    },
    {
      id: 'surprise-3',
      title: 'Birthday VIP Gift',
      message:
        'You have unlimited Love Coupons waiting inside the Memory Vault—redeem breakfast in bed or a weekend trip anytime!',
    },
  ];

  const firstSyncedPhoto = photos.map((p) => resolvePhotoSrc(p)).find(Boolean);
  const firstCover = milestones.map((m) => resolveCoverSrc(m)).find(Boolean);
  const heroPhoto =
    config.openingTogetherPhotoUrl ||
    config.openingTogetherPhotoData ||
    firstSyncedPhoto ||
    firstCover ||
    SHOWCASE_ARTWORK.eternalRose;

  const toggleSurprise = (id: string) => {
    setOpenedSurprises((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-8 sm:px-6 sm:py-12">
      {/* 1. Romantic Editorial Hero */}
      <section className="luxury-glass relative overflow-hidden rounded-[36px] p-6 sm:p-10 lg:p-14">
        {/* Decorative floating butterfly */}
        <svg
          viewBox="0 0 48 36"
          aria-hidden="true"
          className="animate-butterfly pointer-events-none absolute top-6 right-8 h-9 w-11 text-[#D6B477] opacity-80"
        >
          <path
            d="M24 18 C16 4, 2 4, 6 18 C2 28, 16 32, 24 20 C32 32, 46 28, 42 18 C46 4, 32 4, 24 18 Z"
            fill="currentColor"
            fillOpacity="0.35"
            stroke="#C98291"
            strokeWidth="1.5"
          />
        </svg>

        <div className="grid items-center gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6 lg:col-span-7"
          >
            <p className="text-xs font-semibold tracking-[0.26em] text-[#C98291] uppercase dark:text-[#E7C38A]">
              Sri Lanka · Together Since {anniversaryLabel}
            </p>
            <h2 className="font-serif-display text-4xl leading-[1.1] font-bold text-[#542D3A] sm:text-6xl dark:text-[#FFF5F0]">
              A Living Love Story Crafted for{' '}
              <span className="italic text-[#C98291] dark:text-[#E7C38A]">{config.herName}</span>
            </h2>
            <p className="font-handwriting text-2xl text-[#8c5263] sm:text-3xl dark:text-[#E8BAC4]">
              &ldquo;For my dearest {config.herNickname} — every trip, every laugh, and every wish,
              held forever in one place.&rdquo;
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-[#6c4150] sm:text-base dark:text-[#DEC6CE]">
              Explore our sunlit highlands from Baker&apos;s Bend to Bambarakanda, open wax-sealed
              letters, pluck petals from your eternal rose, and celebrate your {birthdayLabel}{' '}
              birthday under our constellation of memories.
            </p>

            {/* Primary Calls to Action */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  birthdayAudio.start();
                  onNavigate('garden');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-7 py-3.5 text-sm font-semibold text-[#FFF9F2] shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#6a3a4a] dark:bg-gradient-to-r dark:from-[#C98291] dark:to-[#D6B477] dark:text-[#1A0810]"
              >
                <Flower2 className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
                <span>Enter Memory Garden</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('celebration')}
                className="inline-flex items-center gap-2 rounded-full border border-[#D6B477] bg-white px-6 py-3.5 text-sm font-semibold text-[#542D3A] transition-colors hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
              >
                <Cake className="h-4 w-4 text-[#C98291] dark:text-[#E7C38A]" />
                <span>Birthday Surprise</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!bgDecor.livingGarden) toggleBgDecor('livingGarden');
                  setGardenModeActive(true);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#C98291]/60 bg-[#FCE8E8] px-5 py-3.5 text-sm font-semibold text-[#542D3A] shadow-sm transition-colors hover:bg-[#fbdada] dark:border-[#E7C38A]/55 dark:bg-[#361626] dark:text-[#FFF5F0] dark:hover:bg-[#491E33]"
              >
                <Sparkles className="h-4 w-4 text-[#C98291] dark:text-[#E7C38A]" />
                <span>Garden Mode</span>
              </button>

              {bgDecor.livingGarden && (
                <button
                  type="button"
                  onClick={triggerWindBurst}
                  title="Send a gentle romantic breeze across the 3D living garden"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/65 bg-white/95 px-4 py-3.5 text-sm font-medium text-[#542D3A] transition-colors hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
                >
                  <Wind className="h-4 w-4 text-[#C98291] dark:text-[#E7C38A]" />
                  <span>Gentle Breeze</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Framed Couple Portrait Highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="relative mx-auto max-w-sm rounded-[28px] border-2 border-[#D6B477]/65 bg-white p-3 shadow-2xl dark:bg-[#200D17]">
              <div className="aspect-[4/5] overflow-hidden rounded-[20px] bg-[#FCE8E8] dark:bg-[#2F1522]">
                <SecurePhotoImg
                  src={heroPhoto}
                  fallbackSrc={SHOWCASE_ARTWORK.eternalRose}
                  variant="full"
                  lazy={false}
                  alt={`${config.himName} & ${config.herName}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pt-3 pb-1 text-center">
                <p className="font-handwriting text-2xl text-[#542D3A] dark:text-[#FFF5F0]">
                  {config.himName} &amp; {config.herNickname}
                </p>
                <p className="text-xs tracking-widest text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                  {photos.length} Curated Photos · {milestones.length} Chapters · {letters.length}{' '}
                  Letters
                </p>
              </div>
              <img
                src={SHOWCASE_ARTWORK.snRoseHeart}
                alt="S ♥ N Rose Heart Monogram"
                className="pointer-events-none absolute -right-5 -bottom-5 h-20 w-auto drop-shadow-[0_10px_18px_rgba(84,45,58,0.35)] select-none sm:h-24"
              />
            </div>
          </motion.div>
        </div>

        {/* Live Anniversary & Birthday Countdown */}
        <Countdown />
      </section>

      {/* 2. Interactive Discovery Surprises */}
      <section className="space-y-5">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Hidden Treasures
          </p>
          <h3 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            Tap a Wax Seal to Discover a Surprise
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {surpriseCards.map((card) => {
            const isOpen = openedSurprises.includes(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => toggleSurprise(card.id)}
                className={`group flex flex-col justify-between rounded-3xl border p-6 text-left transition-all duration-300 ${
                  isOpen
                    ? 'border-[#D6B477] bg-white shadow-lg dark:bg-[#240F1A]'
                    : 'border-[#D6B477]/40 bg-[#FCE8E8]/55 hover:-translate-y-1 hover:bg-white dark:bg-[#1D0B14]/85 dark:hover:bg-[#2A111D]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#542D3A] text-[#FFF9F2] shadow-sm dark:bg-[#3A1828]">
                    {isOpen ? (
                      <Heart className="h-5 w-5 fill-[#C98291] text-[#C98291]" />
                    ) : (
                      <Gift className="h-5 w-5 text-[#D6B477]" />
                    )}
                  </span>
                  <span className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                    {isOpen ? 'Unlocked' : 'Tap to Open'}
                  </span>
                </div>

                <div className="mt-5">
                  <h4 className="font-serif-display text-xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {card.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
                    {isOpen
                      ? card.message
                      : `A sealed keepsake waiting quietly for ${config.herName}'s touch...`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Editorial World Explorer */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#D6B477]/35 pb-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
              Curated Chapters
            </p>
            <h3 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              Step Into Every Corner of Our World
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('story')}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/60 bg-white/85 px-3.5 py-1.5 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
            >
              <ArrowRight className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
              <span>Read Our Story (Date Order)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('intro')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#542D3A] hover:text-[#C98291] dark:text-[#FCE8E8] dark:hover:text-[#E7C38A]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D6B477]" />
              <span>Watch Opening Sequence Again</span>
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              tab: 'arcade' as NavTab,
              title: 'Love Arcade ❤️',
              desc: 'Memory Detective, Firefly Hunt & Unlock My Heart games.',
              icon: Gamepad2,
            },
            {
              tab: 'garden' as NavTab,
              title: 'Memory Garden',
              desc: 'Walk our enchanted rose pathway & glowing landmarks.',
              icon: Flower2,
            },
            {
              tab: 'travels' as NavTab,
              title: 'Travel Map & Gallery',
              desc: "Baker's Bend, Bambarakanda, Hirikatu Oya & more.",
              icon: Compass,
            },
            {
              tab: 'letters' as NavTab,
              title: 'Stationery Letters',
              desc: 'Handwritten Open When envelopes & Memory Movie Maker.',
              icon: Mail,
            },
            {
              tab: 'starmap' as NavTab,
              title: 'Relationship Star Map',
              desc: `The exact night sky above Sri Lanka on ${anniversaryLabel}.`,
              icon: Stars,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onNavigate(item.tab)}
                className="group luxury-glass flex flex-col justify-between rounded-3xl p-6 text-left transition-transform hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FCE8E8] text-[#542D3A] transition-colors group-hover:bg-[#542D3A] group-hover:text-[#FFF9F2] dark:bg-[#311622] dark:text-[#E7C38A] dark:group-hover:bg-[#E7C38A] dark:group-hover:text-[#1A0810]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-6">
                  <h4 className="font-serif-display text-xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#7D5260] dark:text-[#D9B8C2]">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
