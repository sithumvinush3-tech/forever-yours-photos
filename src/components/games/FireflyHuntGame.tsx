import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Heart,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useMemories } from '../../context/MemoryContext';
import type { ArcadeDifficulty } from '../../types';
import { gameSfx } from '../../utils/gameSfx';

interface FireflyHuntGameProps {
  onBack: () => void;
}

type EntityKind = 'regular' | 'bonus' | 'golden' | 'decoy';

interface GardenEntity {
  id: string;
  kind: EntityKind;
  x: number; // % 8..92
  y: number; // % 12..82
  vx: number;
  vy: number;
  size: number; // px (>= 48px touch target)
  phase: number;
  ttl: number; // remaining seconds
}

interface BurstEffect {
  id: string;
  x: number;
  y: number;
  label: string;
  tone: 'gold' | 'rose' | 'warn';
}

const TARGET_COUNT = 10;

const MODE_SECONDS: Record<ArcadeDifficulty, number> = {
  easy: 30,
  medium: 25,
  hard: 20,
};

const SPAWN_RATE_MS: Record<ArcadeDifficulty, number> = {
  easy: 920,
  medium: 760,
  hard: 620,
};

export function FireflyHuntGame({ onBack }: FireflyHuntGameProps) {
  const { arcadeConfig, submitArcadeResult, config } = useMemories();
  const [difficulty, setDifficulty] = useState<ArcadeDifficulty>(
    arcadeConfig.fireflyDifficulty || 'medium',
  );
  const [phase, setPhase] = useState<'ready' | 'playing' | 'summary'>('ready');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_SECONDS[difficulty]);
  const [caughtCount, setCaughtCount] = useState(0);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [entities, setEntities] = useState<GardenEntity[]>([]);
  const [bursts, setBursts] = useState<BurstEffect[]>([]);
  const [savingResult, setSavingResult] = useState(false);
  const [saveInfo, setSaveInfo] = useState<{ savedToCloud: boolean; newBadges: string[] } | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 34 }, (_, idx) => ({
        id: idx,
        left: `${((idx * 29 + 11) % 94) + 3}%`,
        top: `${((idx * 17 + 7) % 66) + 4}%`,
        delay: `${(idx % 6) * 0.6}s`,
        size: idx % 3 === 0 ? 3 : 2,
      })),
    [],
  );

  const roses = useMemo(
    () => [
      { left: '6%', height: 96, scale: 1 },
      { left: '20%', height: 78, scale: 0.85 },
      { left: '38%', height: 88, scale: 0.92 },
      { left: '60%', height: 84, scale: 0.9 },
      { left: '78%', height: 98, scale: 1.04 },
      { left: '92%', height: 74, scale: 0.82 },
    ],
    [],
  );

  const scoreRef = useRef(0);
  const caughtRef = useRef(0);
  const timeLeftRef = useRef(MODE_SECONDS[difficulty]);
  const roundNonceRef = useRef('');
  const finishedRef = useRef(false);
  const startTsRef = useRef(Date.now());

  const spawnEntity = useCallback((diff: ArcadeDifficulty): GardenEntity => {
    const roll = Math.random();
    let kind: EntityKind = 'regular';
    if (roll < (diff === 'hard' ? 0.22 : diff === 'medium' ? 0.16 : 0.11)) {
      kind = 'decoy';
    } else if (roll < 0.31) {
      kind = 'golden';
    } else if (roll < 0.56) {
      kind = 'bonus';
    }

    const speedMul = diff === 'hard' ? 1.45 : diff === 'medium' ? 1.1 : 0.8;
    const angle = Math.random() * Math.PI * 2;
    const speed = (prefersReducedMotion ? 0.12 : 0.45 + Math.random() * 0.55) * speedMul;

    return {
      id: `ff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind,
      x: 10 + Math.random() * 80,
      y: 12 + Math.random() * 64,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: kind === 'golden' ? 54 : 50,
      phase: Math.random() * Math.PI * 2,
      ttl: kind === 'golden' ? 3.2 : kind === 'decoy' ? 4.4 : 5.2,
    };
  }, [prefersReducedMotion]);

  const finishGame = useCallback(
    async (didWin: boolean, remainingSeconds: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setPhase('summary');
      setWon(didWin);

      const timeBonus = didWin ? Math.max(0, remainingSeconds) * 5 : 0;
      const finalScore = Math.max(0, scoreRef.current + timeBonus);
      scoreRef.current = finalScore;
      setScore(finalScore);

      if (didWin) {
        gameSfx.victory();
        confetti({
          particleCount: 95,
          spread: 80,
          origin: { y: 0.62 },
          colors: ['#D6B477', '#FCE8E8', '#C98291', '#FFE58F'],
        });
      } else {
        gameSfx.wrong();
      }

      const elapsedSec = Math.max(1, Math.round((Date.now() - startTsRef.current) / 1000));
      setSavingResult(true);
      setSaveError(null);
      try {
        const res = await submitArcadeResult({
          roundNonce: roundNonceRef.current,
          gameId: 'firefly_hunt',
          difficulty,
          score: finalScore,
          xpEarned: didWin ? 140 + Math.round(finalScore / 5) : 35 + caughtRef.current * 5,
          completed: didWin,
          durationSec: elapsedSec,
        });
        setSaveInfo({
          savedToCloud: res.savedToCloud,
          newBadges: res.newlyUnlockedBadges,
        });
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Unable to save score right now.');
      } finally {
        setSavingResult(false);
      }
    },
    [difficulty, submitArcadeResult],
  );

  const startGame = (selectedDiff: ArcadeDifficulty = difficulty) => {
    setDifficulty(selectedDiff);
    scoreRef.current = 0;
    caughtRef.current = 0;
    timeLeftRef.current = MODE_SECONDS[selectedDiff];
    finishedRef.current = false;
    roundNonceRef.current = `ff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    startTsRef.current = Date.now();

    setScore(0);
    setCaughtCount(0);
    setWon(false);
    setTimeLeft(MODE_SECONDS[selectedDiff]);
    setBursts([]);
    setSaveInfo(null);
    setSaveError(null);
    setEntities([
      spawnEntity(selectedDiff),
      spawnEntity(selectedDiff),
      spawnEntity(selectedDiff),
      spawnEntity(selectedDiff),
    ]);
    setPhase('playing');
  };

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        void finishGame(caughtRef.current >= TARGET_COUNT, 0);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finishGame, phase]);

  // Spawn & gentle drift loop
  useEffect(() => {
    if (phase !== 'playing') return;
    const spawner = window.setInterval(() => {
      setEntities((prev) => {
        const active = prev.slice(-9);
        return [...active, spawnEntity(difficulty)];
      });
    }, SPAWN_RATE_MS[difficulty]);

    const mover = window.setInterval(() => {
      setEntities((prev) =>
        prev
          .map((item) => {
            const nextTtl = item.ttl - 0.08;
            if (nextTtl <= 0) return null;
            if (prefersReducedMotion) {
              return { ...item, ttl: nextTtl };
            }
            let nx = item.x + item.vx;
            let ny = item.y + item.vy;
            let nvx = item.vx;
            let nvy = item.vy;
            if (nx < 8 || nx > 92) {
              nvx = -nvx;
              nx = Math.max(8, Math.min(92, nx));
            }
            if (ny < 10 || ny > 76) {
              nvy = -nvy;
              ny = Math.max(10, Math.min(76, ny));
            }
            return {
              ...item,
              x: nx,
              y: ny,
              vx: nvx,
              vy: nvy,
              phase: item.phase + 0.18,
              ttl: nextTtl,
            };
          })
          .filter((item): item is GardenEntity => item !== null),
      );
    }, 80);

    return () => {
      window.clearInterval(spawner);
      window.clearInterval(mover);
    };
  }, [difficulty, phase, prefersReducedMotion, spawnEntity]);

  const addBurst = (x: number, y: number, label: string, tone: BurstEffect['tone']) => {
    const id = `burst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setBursts((prev) => [...prev.slice(-8), { id, x, y, label, tone }]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 850);
  };

  const handleCatch = (item: GardenEntity) => {
    if (phase !== 'playing' || finishedRef.current) return;

    setEntities((prev) => prev.filter((e) => e.id !== item.id));

    if (item.kind === 'decoy') {
      gameSfx.wrong();
      scoreRef.current = Math.max(0, scoreRef.current - 15);
      setScore(scoreRef.current);
      addBurst(item.x, item.y, '-15 Thorn Moth', 'warn');
      return;
    }

    const pts = item.kind === 'golden' ? 60 : item.kind === 'bonus' ? 30 : 15;
    const countInc = item.kind === 'golden' ? 2 : 1;

    if (item.kind === 'golden' || item.kind === 'bonus') {
      gameSfx.bonus();
    } else {
      gameSfx.tap();
    }

    scoreRef.current += pts;
    caughtRef.current = Math.min(TARGET_COUNT, caughtRef.current + countInc);
    setScore(scoreRef.current);
    setCaughtCount(caughtRef.current);
    addBurst(
      item.x,
      item.y,
      item.kind === 'golden' ? `+${pts} Golden!` : `+${pts}`,
      item.kind === 'bonus' ? 'rose' : 'gold',
    );

    if (caughtRef.current >= TARGET_COUNT) {
      void finishGame(true, timeLeftRef.current);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-[#D6B477]/60 bg-white/90 px-4 py-2 text-xs font-semibold text-[#542D3A] shadow-xs hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
        >
          <ArrowLeft className="h-4 w-4 text-[#C98291]" />
          <span>Back to Love Arcade</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#7D5260] dark:text-[#EAD0D9]">
          <Sparkles className="h-4 w-4 text-[#D6B477]" />
          <span>Firefly Hunt · Midnight Garden</span>
        </div>
      </div>

      {phase === 'ready' && (
        <section className="luxury-glass overflow-hidden rounded-[32px] border border-[#D6B477]/50 p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                Game Two · Nocturnal Sanctuary
              </p>
              <h2 className="font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
                Firefly Hunt — Magical Garden
              </h2>
              <p className="text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                When twilight settles over our enchanted roses, golden fireflies drift across the
                velvet sky. Collect <strong>10 glowing fireflies</strong> before time runs out to
                unlock {config.himName}&apos;s hidden love note!
              </p>

              <div className="grid gap-2.5 rounded-2xl border border-[#D6B477]/35 bg-white/75 p-4 text-xs dark:bg-[#1E0C15]/85">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                    Amber Firefly (Standard)
                  </span>
                  <span className="font-bold text-[#9E7328] tabular-nums dark:text-[#E7C38A]">
                    +1 count · +15 pts
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                    Rosefire Glowfly (Bonus)
                  </span>
                  <span className="font-bold text-[#C98291] tabular-nums dark:text-[#F4A6B8]">
                    +1 count · +30 pts
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                    Royal Golden Firefly
                  </span>
                  <span className="font-bold text-[#B37E22] tabular-nums dark:text-[#FFE58F]">
                    +2 count · +60 pts
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#D6B477]/25 pt-2">
                  <span className="font-semibold text-rose-700 dark:text-rose-300">
                    Avoid: Crimson Thorn Moth (Decoy)
                  </span>
                  <span className="font-bold text-rose-700 tabular-nums dark:text-rose-300">
                    -15 pts
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-[#D6B477]/45 bg-[#FFF9F2]/90 p-6 dark:bg-[#230E18]/90 lg:col-span-5">
              <p className="text-xs font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                Select Timer Challenge
              </p>
              <div className="space-y-2.5">
                {(['easy', 'medium', 'hard'] as ArcadeDifficulty[]).map((level) => {
                  const active = difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs transition-colors ${
                        active
                          ? 'border-[#C98291] bg-[#542D3A] text-[#FFF9F2] shadow-sm dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                          : 'border-[#D6B477]/45 bg-white text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#190A12] dark:text-[#FCE8E8]'
                      }`}
                    >
                      <span className="font-bold capitalize">{level}</span>
                      <span className="tabular-nums opacity-90">{MODE_SECONDS[level]} seconds</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => startGame(difficulty)}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C98291] px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#b56f7e]"
              >
                <Sparkles className="h-4 w-4" />
                <span>Enter the Midnight Garden</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === 'playing' && (
        <section className="space-y-4">
          {/* HUD Bar */}
          <div className="luxury-glass flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-5">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                  Fireflies Caught
                </p>
                <p className="font-serif-display text-2xl font-bold text-[#542D3A] tabular-nums dark:text-[#FFF5F0]">
                  {caughtCount} / {TARGET_COUNT}
                </p>
              </div>
              <div className="h-8 w-px bg-[#D6B477]/40" />
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                  Score
                </p>
                <p className="font-serif-display text-2xl font-bold text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                  {score}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold tabular-nums ${
                  timeLeft <= 6
                    ? 'border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200'
                    : 'border-[#D6B477]/60 bg-white text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]'
                }`}
              >
                <Clock className="h-4 w-4 text-[#C98291]" />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Interactive Nighttime Enchanted Garden */}
          <div
            className="relative h-[430px] w-full overflow-hidden rounded-[32px] border-2 border-[#D6B477]/60 shadow-2xl select-none sm:h-[490px]"
            style={{
              background:
                'radial-gradient(circle at 50% 18%, rgba(88, 56, 138, 0.55) 0%, #190e33 48%, #0e1730 78%, #0c211d 100%)',
              touchAction: 'manipulation',
            }}
          >
            {/* Glowing Moon */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-7 right-10 h-16 w-16 rounded-full bg-[#FFF7D6] opacity-90 shadow-[0_0_55px_18px_rgba(255,235,170,0.45)] sm:h-20 sm:w-20"
            />

            {/* Floating Twinkling Stars */}
            {stars.map((s) => (
              <span
                key={s.id}
                aria-hidden="true"
                className="pointer-events-none absolute rounded-full bg-[#FFF7E2]"
                style={{
                  left: s.left,
                  top: s.top,
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  opacity: 0.78,
                  animation: prefersReducedMotion
                    ? undefined
                    : `twinkleStar 3.4s ease-in-out ${s.delay} infinite`,
                }}
              />
            ))}

            {/* Glowing Rose Silhouettes & Green Foliage Foreground */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#081711] via-[#10291e]/85 to-transparent"
            />
            {roses.map((r, i) => (
              <svg
                key={i}
                aria-hidden="true"
                viewBox="0 0 80 100"
                className="pointer-events-none absolute bottom-0 -translate-x-1/2"
                style={{
                  left: r.left,
                  height: `${r.height}px`,
                  transform: `translateX(-50%) scale(${r.scale})`,
                }}
              >
                {/* Stem & Leaves */}
                <path
                  d="M40 98 C39 74, 42 54, 40 36"
                  stroke="#2f6f4e"
                  strokeWidth="3.5"
                  fill="none"
                />
                <path d="M40 72 C24 66, 18 54, 24 48 C33 50, 38 62, 40 72 Z" fill="#255f43" />
                <path d="M40 60 C56 54, 62 42, 56 36 C47 38, 42 50, 40 60 Z" fill="#2d7251" />
                {/* Glowing Pink Rose */}
                <circle cx="40" cy="30" r="17" fill="#c95b7e" opacity="0.35" />
                <circle cx="40" cy="30" r="12" fill="#e57297" />
                <circle cx="35" cy="27" r="7" fill="#f69cb9" />
                <circle cx="44" cy="29" r="6" fill="#ee85a8" />
                <circle cx="40" cy="30" r="4" fill="#ffd2e0" />
              </svg>
            ))}

            {/* Catchable Fireflies & Decoys */}
            {entities.map((item) => {
              const isDecoy = item.kind === 'decoy';
              const isGolden = item.kind === 'golden';
              const isBonus = item.kind === 'bonus';
              const glowColor = isDecoy
                ? 'rgba(225, 29, 72, 0.5)'
                : isGolden
                  ? 'rgba(255, 224, 102, 0.85)'
                  : isBonus
                    ? 'rgba(244, 166, 184, 0.8)'
                    : 'rgba(255, 232, 145, 0.72)';

              return (
                <button
                  key={item.id}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleCatch(item);
                  }}
                  aria-label={
                    isDecoy
                      ? 'Thorn moth decoy — do not tap'
                      : isGolden
                        ? 'Catch Royal Golden Firefly'
                        : isBonus
                          ? 'Catch Bonus Rose Firefly'
                          : 'Catch Firefly'
                  }
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-white"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${item.size}px`,
                    height: `${item.size}px`,
                    transition: prefersReducedMotion ? undefined : 'left 85ms linear, top 85ms linear',
                  }}
                >
                  {isDecoy ? (
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/70 bg-rose-950/90 text-rose-200 shadow-lg"
                      style={{ boxShadow: `0 0 18px 4px ${glowColor}` }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                  ) : (
                    <span
                      className="relative flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        background: isGolden
                          ? 'radial-gradient(circle, #FFFBEB 15%, #FCD34D 55%, rgba(214,180,119,0) 80%)'
                          : isBonus
                            ? 'radial-gradient(circle, #FFF1F5 15%, #F4A6B8 55%, rgba(201,130,145,0) 80%)'
                            : 'radial-gradient(circle, #FEFCE8 15%, #FDE047 52%, rgba(250,204,21,0) 80%)',
                        boxShadow: `0 0 22px 6px ${glowColor}`,
                      }}
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_#fff]" />
                    </span>
                  )}
                </button>
              );
            })}

            {/* Tap Feedback Floating Labels */}
            {bursts.map((b) => (
              <span
                key={b.id}
                aria-hidden="true"
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-xs font-bold drop-shadow-md ${
                  b.tone === 'warn'
                    ? 'text-rose-300'
                    : b.tone === 'rose'
                      ? 'text-pink-200'
                      : 'text-amber-200'
                }`}
                style={{ left: `${b.x}%`, top: `${b.y}%` }}
              >
                {b.label}
              </span>
            ))}

            {/* Subtle instructions corner */}
            <div className="pointer-events-none absolute top-3 left-4 rounded-full bg-black/35 px-3 py-1 text-[11px] font-medium text-[#FCE8E8]/90">
              Tap glowing fireflies ({caughtCount}/{TARGET_COUNT}) · Avoid thorn moths
            </div>
          </div>
        </section>
      )}

      {phase === 'summary' && (
        <section className="luxury-glass mx-auto max-w-3xl space-y-6 rounded-[32px] border border-[#D6B477]/55 p-6 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D6B477] bg-[#FCE8E8] text-[#542D3A] dark:bg-[#3A192A] dark:text-[#E7C38A]">
            {won ? <Trophy className="h-8 w-8" /> : <Sparkles className="h-8 w-8" />}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#C98291] uppercase dark:text-[#E7C38A]">
              {won ? 'Challenge Complete' : 'Time Up'}
            </p>
            <h2 className="font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
              {won
                ? `You Caught All ${TARGET_COUNT} Fireflies!`
                : `Collected ${caughtCount} of ${TARGET_COUNT} Fireflies`}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#D6B477]/45 bg-white/80 p-4 dark:bg-[#1E0C15]">
              <p className="text-[11px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                Final Score
              </p>
              <p className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] tabular-nums dark:text-[#FFF5F0]">
                {score}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D6B477]/45 bg-white/80 p-4 dark:bg-[#1E0C15]">
              <p className="text-[11px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                Fireflies
              </p>
              <p className="mt-1 font-serif-display text-3xl font-bold text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                {caughtCount} / {TARGET_COUNT}
              </p>
            </div>
            <div className="col-span-2 rounded-2xl border border-[#D6B477]/45 bg-white/80 p-4 sm:col-span-1 dark:bg-[#1E0C15]">
              <p className="text-[11px] font-semibold tracking-wider text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                Mode
              </p>
              <p className="mt-1 font-serif-display text-2xl font-bold text-[#542D3A] capitalize dark:text-[#FFF5F0]">
                {difficulty}
              </p>
            </div>
          </div>

          {won && (
            <div className="stationery-paper mx-auto max-w-xl rounded-2xl border border-[#D6B477] p-6 text-left shadow-md !bg-[#FFFDF9] !text-[#542D3A]">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-[#C98291] uppercase">
                <Heart className="h-3.5 w-3.5 fill-current" />
                <span>Unlocked Hidden Romantic Message</span>
              </p>
              <p className="font-handwriting mt-3 text-2xl leading-relaxed text-[#542D3A]">
                {arcadeConfig.fireflyRewardMessage}
              </p>
            </div>
          )}

          {savingResult && (
            <p className="text-xs font-medium text-[#7D5260] dark:text-[#D9B8C2]">
              Saving garden score &amp; rewards...
            </p>
          )}
          {saveError && <p className="text-xs font-semibold text-rose-600">{saveError}</p>}
          {saveInfo && !savingResult && (
            <div className="space-y-1 text-xs text-[#6c4150] dark:text-[#EAD0D9]">
              <p>Score &amp; XP saved locally on this device.</p>
              {saveInfo.newBadges.length > 0 && (
                <p className="font-semibold text-[#C98291] dark:text-[#E7C38A]">
                  New Badge Unlocked: {saveInfo.newBadges.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startGame(difficulty)}
              className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-sm hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-[#D6B477] bg-white px-6 py-2.5 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
            >
              <span>Back to Love Arcade</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
