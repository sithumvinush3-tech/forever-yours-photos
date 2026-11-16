import { useMemo, useState } from 'react';
import {
  Award,
  Camera,
  CheckCircle2,
  Gamepad2,
  Heart,
  KeyRound,
  Lock,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { ARCADE_BADGES, SHOWCASE_ARTWORK } from '../data/seedData';
import type { ArcadeGameId } from '../types';
import { resolveCoverSrc, resolvePhotoSrc } from '../utils/photoHelpers';
import { SecurePhotoImg } from './SecurePhotoImg';
import { FireflyHuntGame } from './games/FireflyHuntGame';
import { MemoryDetectiveGame } from './games/MemoryDetectiveGame';
import { UnlockMyHeartGame } from './games/UnlockMyHeartGame';

export function LoveArcadeView() {
  const {
    config,
    photos,
    milestones,
    arcadeConfig,
    arcadeProfile,
    arcadeLoading,
  } = useMemories();

  const [activeGame, setActiveGame] = useState<ArcadeGameId | null>(null);

  const detectiveArtwork = useMemo(() => {
    const firstPhoto = photos.find((p) => p.published && Boolean(resolvePhotoSrc(p)));
    if (firstPhoto) return resolvePhotoSrc(firstPhoto);
    const firstMilestone = milestones.find((m) => m.published && Boolean(resolveCoverSrc(m)));
    return resolveCoverSrc(firstMilestone) || SHOWCASE_ARTWORK.bakersBend;
  }, [milestones, photos]);

  const unlockArtwork = useMemo(() => {
    if (arcadeConfig.unlockRewardPhotoUrl) return arcadeConfig.unlockRewardPhotoUrl;
    if (arcadeConfig.unlockRewardPhotoData) return arcadeConfig.unlockRewardPhotoData;
    if (config.openingTogetherPhotoUrl) return config.openingTogetherPhotoUrl;
    if (config.openingTogetherPhotoData) return config.openingTogetherPhotoData;
    return SHOWCASE_ARTWORK.eternalRose;
  }, [
    arcadeConfig.unlockRewardPhotoUrl,
    arcadeConfig.unlockRewardPhotoData,
    config.openingTogetherPhotoUrl,
    config.openingTogetherPhotoData,
  ]);

  if (activeGame === 'memory_detective') {
    return (
      <div className="px-4 py-8 sm:px-6">
        <MemoryDetectiveGame onBack={() => setActiveGame(null)} />
      </div>
    );
  }

  if (activeGame === 'firefly_hunt') {
    return (
      <div className="px-4 py-8 sm:px-6">
        <FireflyHuntGame onBack={() => setActiveGame(null)} />
      </div>
    );
  }

  if (activeGame === 'unlock_my_heart') {
    return (
      <div className="px-4 py-8 sm:px-6">
        <UnlockMyHeartGame onBack={() => setActiveGame(null)} />
      </div>
    );
  }

  const gameCards: {
    id: ArcadeGameId;
    title: string;
    subtitle: string;
    description: string;
    artwork: string;
    enabled: boolean;
    bestScore: number;
    completed: boolean;
    icon: typeof Camera;
    badgeLabel: string;
  }[] = [
    {
      id: 'memory_detective',
      title: 'Memory Detective',
      subtitle: 'Guess Our Memories',
      description:
        'Uncover blurred photographs from our gallery, choose the real memory, and score 150 points per hint-free round.',
      artwork: detectiveArtwork,
      enabled: arcadeConfig.detectiveEnabled,
      bestScore: arcadeProfile.bestMemoryDetective,
      completed: arcadeProfile.completedGames.includes('memory_detective'),
      icon: Camera,
      badgeLabel: `Default: ${arcadeConfig.detectiveDifficulty}`,
    },
    {
      id: 'firefly_hunt',
      title: 'Firefly Hunt',
      subtitle: 'Magical Garden Game',
      description:
        'Catch 10 glowing fireflies beneath the midnight roses before the clock runs out to unlock a hidden love note.',
      artwork: SHOWCASE_ARTWORK.memoryGarden,
      enabled: arcadeConfig.fireflyEnabled,
      bestScore: arcadeProfile.bestFireflyHunt,
      completed: arcadeProfile.completedGames.includes('firefly_hunt'),
      icon: Sparkles,
      badgeLabel: `Default: ${arcadeConfig.fireflyDifficulty}`,
    },
    {
      id: 'unlock_my_heart',
      title: 'Unlock My Heart',
      subtitle: 'Three-Level Puzzle Adventure',
      description:
        'Solve the picture puzzle, pass our secret code quiz, and unite all six heart shards to open the Golden Doors.',
      artwork: unlockArtwork,
      enabled: arcadeConfig.unlockEnabled,
      bestScore: arcadeProfile.bestUnlockMyHeart,
      completed: arcadeProfile.completedGames.includes('unlock_my_heart'),
      icon: KeyRound,
      badgeLabel: '3 Doors · Final Keepsake',
    },
  ];

  const unlockedBadgesCount = arcadeProfile.badges.length;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      {/* Header Banner */}
      <section className="luxury-glass relative overflow-hidden rounded-[32px] border border-[#D6B477]/55 p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-8">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
              <Gamepad2 className="h-4 w-4" />
              <span>Interactive Romantic Sanctuary</span>
            </p>
            <h1 className="font-serif-display text-4xl font-bold tracking-tight text-[#542D3A] sm:text-5xl dark:text-[#FFF5F0]">
              Love Arcade ❤️
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#6c4150] sm:text-base dark:text-[#EAD0D9]">
              Play three handcrafted romantic mini-games inspired by {config.himName} &amp;{' '}
              {config.herName}&apos;s real memories. Earn XP, unlock badges, and uncover secret
              keepsake messages tucked behind every victory.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6B477]/50 bg-white/85 px-4 py-1.5 text-xs font-semibold text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]">
              <Sparkles className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
              <span>Progress &amp; Badges Saved Automatically on This Device</span>
            </div>
          </div>

          {/* Real Live Stats Summary Box */}
          <div className="grid grid-cols-2 gap-3 rounded-3xl border border-[#D6B477]/45 bg-[#FFF9F2]/90 p-5 dark:bg-[#1E0C15]/90 lg:col-span-4">
            <div className="rounded-2xl border border-[#D6B477]/30 bg-white/85 p-3.5 dark:bg-[#27111C]">
              <p className="text-[10px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                Total XP
              </p>
              <p className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] tabular-nums dark:text-[#FFF5F0]">
                {arcadeLoading ? '—' : arcadeProfile.xp}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D6B477]/30 bg-white/85 p-3.5 dark:bg-[#27111C]">
              <p className="text-[10px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                Games Played
              </p>
              <p className="mt-1 font-serif-display text-3xl font-bold text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                {arcadeLoading ? '—' : arcadeProfile.totalGamesPlayed}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D6B477]/30 bg-white/85 p-3.5 dark:bg-[#27111C]">
              <p className="text-[10px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                Completed
              </p>
              <p className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] tabular-nums dark:text-[#FFF5F0]">
                {arcadeLoading ? '—' : `${arcadeProfile.gamesCompleted} / 3`}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D6B477]/30 bg-white/85 p-3.5 dark:bg-[#27111C]">
              <p className="text-[10px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                Badges
              </p>
              <p className="mt-1 font-serif-display text-3xl font-bold text-[#9E7328] tabular-nums dark:text-[#E7C38A]">
                {arcadeLoading ? '—' : `${unlockedBadgesCount} / ${ARCADE_BADGES.length}`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Featured Interactive Game Cards */}
      <section aria-label="Mini-Games" className="grid gap-6 md:grid-cols-3">
        {gameCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className="luxury-glass flex flex-col justify-between overflow-hidden rounded-[28px] border border-[#D6B477]/50 transition-transform duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#D6B477]/35">
                  <SecurePhotoImg
                    src={card.artwork}
                    alt={card.title}
                    variant="thumb"
                    className={`h-full w-full object-cover ${!card.enabled ? 'grayscale opacity-70' : ''}`}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E0A14]/80 via-transparent to-transparent"
                  />
                  <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2 text-white">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <Icon className="h-4 w-4 text-[#E7C38A]" />
                      <span>{card.subtitle}</span>
                    </span>
                    {card.completed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                      {card.title}
                    </h2>
                    <span className="text-xs font-bold text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                      {card.bestScore > 0 ? `Best: ${card.bestScore}` : 'Not played'}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-[#6c4150] sm:text-sm dark:text-[#EAD0D9]">
                    {card.description}
                  </p>

                  <p className="text-[11px] font-medium text-[#9A6876] dark:text-[#D9B8C2]">
                    {card.badgeLabel} · Personal Best:{' '}
                    <strong className="tabular-nums text-[#542D3A] dark:text-[#FCE8E8]">
                      {card.bestScore}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                {card.enabled ? (
                  <button
                    type="button"
                    onClick={() => setActiveGame(card.id)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#542D3A] px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-sm transition-colors hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Play Now</span>
                  </button>
                ) : (
                  <div className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[#D6B477]/45 bg-[#FFF9F2]/60 px-4 py-2 text-xs font-semibold text-[#8c5263] dark:bg-[#1E0C15] dark:text-[#D9B8C2]">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Paused by Admin</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Shared Reward System: Achievement Badges & Unlocked Romantic Messages */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="luxury-glass space-y-4 rounded-[28px] border border-[#D6B477]/45 p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                Shared Reward System
              </p>
              <h2 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Achievement Badges
              </h2>
            </div>
            <Trophy className="h-5 w-5 text-[#D6B477]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ARCADE_BADGES.map((badge) => {
              const unlocked = arcadeProfile.badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                    unlocked
                      ? 'border-[#D6B477] bg-white/90 dark:bg-[#27111C]'
                      : 'border-[#D6B477]/25 bg-white/45 opacity-75 dark:bg-[#1A0A13]/60'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      unlocked
                        ? 'bg-[#FCE8E8] text-[#C98291] dark:bg-[#491E33] dark:text-[#E7C38A]'
                        : 'bg-[#FFF9F2] text-[#9A6876] dark:bg-[#1E0C15] dark:text-[#9A6876]'
                    }`}
                  >
                    {unlocked ? <Award className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                      {badge.title}{' '}
                      <span className="font-normal opacity-75">
                        · {unlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#6c4150] dark:text-[#D9B8C2]">
                      {badge.requirement}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unlocked Keepsake Notes */}
        <div className="luxury-glass space-y-4 rounded-[28px] border border-[#D6B477]/45 p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                Unlocked Keepsakes
              </p>
              <h2 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Hidden Love Notes ({arcadeProfile.unlockedMessages.length})
              </h2>
            </div>
            <Heart className="h-5 w-5 text-[#C98291]" />
          </div>

          {arcadeProfile.unlockedMessages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D6B477]/60 bg-white/60 p-5 text-center text-xs leading-relaxed text-[#6c4150] dark:bg-[#1E0C15]/70 dark:text-[#EAD0D9]">
              Win badges across Memory Detective, Firefly Hunt, or Unlock My Heart to reveal hidden
              keepsake messages here!
            </div>
          ) : (
            <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {arcadeProfile.unlockedMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className="stationery-paper rounded-2xl border border-[#D6B477]/60 p-4 text-xs leading-relaxed !bg-[#FFFDF9] !text-[#542D3A]"
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
