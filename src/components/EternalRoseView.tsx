import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Flower2, Gift, Heart, RotateCcw } from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { PETAL_100_MESSAGES, SHOWCASE_ARTWORK } from '../data/seedData';

export function EternalRoseView() {
  const { config, activityResetTick } = useMemories();
  const totalPetals = PETAL_100_MESSAGES.length;
  const [pluckedCount, setPluckedCount] = useState(0);
  const [vipUnlocked, setVipUnlocked] = useState(false);

  useEffect(() => {
    if (activityResetTick === 0) return;
    setPluckedCount(0);
    setVipUnlocked(false);
  }, [activityResetTick]);

  const vipNick =
    config.herNickname
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') || 'FOREVER';
  const vipBday = config.birthdayMonthDay.replace(/[^0-9]/g, '') || '0108';
  const vipCode = `${vipNick}-FOREVER-${vipBday}`;

  const pluckNextPetal = () => {
    if (pluckedCount >= totalPetals) return;
    const next = pluckedCount + 1;
    setPluckedCount(next);
    if (next === totalPetals) {
      setVipUnlocked(true);
      void confetti({
        particleCount: 95,
        spread: 78,
        origin: { y: 0.65 },
        colors: ['#C98291', '#D6B477', '#FCE8E8', '#542D3A'],
      });
    }
  };

  const resetRose = () => {
    setPluckedCount(0);
    setVipUnlocked(false);
  };

  const currentMessage = pluckedCount > 0 ? PETAL_100_MESSAGES[pluckedCount - 1] : null;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <div className="border-b border-[#D6B477]/35 pb-5">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
          The Eternal Rose · Final Petal Keepsake
        </p>
        <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
          An Everlasting Rose for {config.herName} ({config.herNickname})
        </h2>
        <p className="mt-1 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
          Pluck each rose petal to uncover a reason {config.himName} adores you—all the way to your
          grand birthday keepsake promise.
        </p>
      </div>

      <div className="grid items-center gap-8 lg:grid-cols-12">
        <section className="luxury-glass flex flex-col items-center rounded-[32px] p-6 text-center sm:p-8 lg:col-span-6">
          <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-[#D6B477] bg-white p-1.5 shadow-xl dark:bg-[#230E18]">
            <img
              src={SHOWCASE_ARTWORK.eternalRose}
              alt="Eternal Velvet Rose"
              referrerPolicy="no-referrer"
              className="h-full w-full rounded-full object-cover"
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {PETAL_100_MESSAGES.map((_, idx) => {
              const isPlucked = idx < pluckedCount;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!isPlucked) pluckNextPetal();
                  }}
                  disabled={isPlucked}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-all ${
                    isPlucked
                      ? 'border-[#D6B477]/30 bg-[#FCE8E8]/50 text-[#9A6876] line-through dark:bg-[#2E1320]/60 dark:text-[#A98290]'
                      : 'border-[#C98291] bg-white text-[#542D3A] shadow-xs hover:scale-110 hover:bg-[#542D3A] hover:text-[#FFF9F2] dark:bg-[#27111C] dark:text-[#FFF5F0] dark:hover:bg-[#E7C38A] dark:hover:text-[#1A0810]'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={pluckNextPetal}
              disabled={pluckedCount >= totalPetals}
              className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6a3a4a] disabled:opacity-50 dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
            >
              <Flower2 className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
              <span>
                {pluckedCount >= totalPetals
                  ? 'All Petals Revealed'
                  : `Pluck Petal ${pluckedCount + 1} of ${totalPetals}`}
              </span>
            </button>
            {pluckedCount > 0 && (
              <button
                type="button"
                onClick={resetRose}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/60 bg-white px-4 py-2.5 text-xs font-medium text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Rose</span>
              </button>
            )}
          </div>
        </section>

        <section className="space-y-6 lg:col-span-6">
          <div className="stationery-paper rounded-[32px] border border-[#D6B477]/70 p-6 shadow-md sm:p-8">
            <p className="text-xs font-semibold tracking-wider text-[#C98291] uppercase tabular-nums dark:text-[#E7C38A]">
              Revealed Petal ({pluckedCount} / {totalPetals})
            </p>
            {currentMessage ? (
              <blockquote className="font-handwriting mt-4 text-3xl leading-relaxed text-[#542D3A] dark:text-[#FFF5F0]">
                &ldquo;{currentMessage}&rdquo;
              </blockquote>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                Tap any numbered petal or click &ldquo;Pluck Petal 1&rdquo; to reveal why you mean
                everything to {config.himName}.
              </p>
            )}
          </div>

          <div
            className={`rounded-[32px] border p-6 transition-all sm:p-8 ${
              vipUnlocked
                ? 'border-[#D6B477] bg-gradient-to-br from-[#FCE8E8] via-white to-[#FFF9F2] shadow-lg dark:from-[#2C131F] dark:via-[#1B0B13] dark:to-[#13070D]'
                : 'luxury-glass'
            }`}
          >
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <img
                src={SHOWCASE_ARTWORK.snRoseHeart}
                alt="S ♥ N Eternal Rose Heart Bouquet"
                className={`w-28 shrink-0 self-center transition-transform duration-700 sm:w-32 ${
                  vipUnlocked
                    ? 'scale-105 drop-shadow-[0_12px_24px_rgba(201,130,145,0.45)]'
                    : 'opacity-90 drop-shadow-md'
                }`}
              />
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                  <Gift className="h-4 w-4 text-[#D6B477]" />
                  <span>Real-Life Rose Keepsake Connection</span>
                </div>
                <h3 className="mt-2 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                  {vipUnlocked
                    ? 'VIP Everlasting Rose Promise Unlocked!'
                    : 'Pluck all petals to unlock your VIP Rose Keepsake'}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                  {vipUnlocked
                    ? `Happy Birthday, ${config.herNickname}! Show this screen to ${config.himName} whenever you receive your real roses to redeem a surprise candlelit dinner & hand-picked gift.`
                    : 'Just like real roses fade with time, this digital rose remains forever in bloom—keep plucking to unlock the final keepsake promise.'}
                </p>
                {vipUnlocked && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#D6B477] bg-[#542D3A] px-4 py-2 text-xs font-semibold text-[#FFF9F2] dark:bg-[#E7C38A] dark:text-[#1A0810]">
                    <Heart className="h-4 w-4 fill-[#C98291] text-[#C98291] dark:fill-[#1A0810] dark:text-[#1A0810]" />
                    <span>VIP CODE: {vipCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
