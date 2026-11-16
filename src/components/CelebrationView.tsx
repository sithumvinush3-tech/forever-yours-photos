import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Gift,
  Heart,
  Mic,
  MicOff,
  Music,
  PartyPopper,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { DEFAULT_BIRTHDAY_WISHES, DEFAULT_SIGNATURE_LETTER } from '../data/seedData';
import { MUSIC_TRACKS, birthdayAudio, startMicBlowDetector } from '../utils/audioEngine';
import { formatBirthdayLabel } from '../utils/dates';

function getNextBirthdayCountdown(monthDay: string) {
  const [mStr, dStr] = (monthDay || '01-08').split('-');
  const m = Number(mStr) || 1;
  const d = Number(dStr) || 8;
  const now = new Date();
  let target = new Date(now.getFullYear(), m - 1, d, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target = new Date(now.getFullYear() + 1, m - 1, d, 0, 0, 0);
  }
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, year: target.getFullYear() };
}

export function CelebrationView() {
  const { config, letters, activityResetTick } = useMemories();
  const [countdown, setCountdown] = useState(() =>
    getNextBirthdayCountdown(config.birthdayMonthDay),
  );
  const [candlesLit, setCandlesLit] = useState([true, true, true, true, true]);
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [wishIndex, setWishIndex] = useState(0);
  const [surpriseOpened, setSurpriseOpened] = useState(false);
  const [audioState, setAudioState] = useState(birthdayAudio.getState());
  const stopMicRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (activityResetTick === 0) return;
    stopMicRef.current?.();
    stopMicRef.current = null;
    setMicActive(false);
    setMicError(null);
    setCandlesLit([true, true, true, true, true]);
    setWishIndex(0);
    setSurpriseOpened(false);
  }, [activityResetTick]);

  const birthdayLabel = formatBirthdayLabel(config.birthdayMonthDay);

  useEffect(() => {
    return birthdayAudio.subscribe(() => setAudioState(birthdayAudio.getState()));
  }, []);

  const signatureLetter = useMemo(() => {
    const custom = letters.find((l) => l.letterType === 'signature');
    return custom?.body || DEFAULT_SIGNATURE_LETTER;
  }, [letters]);

  const birthdayWishes = useMemo(() => {
    const customWishes = letters.filter((l) => l.letterType === 'birthday_wish').map((l) => l.body);
    return customWishes.length > 0 ? customWishes : DEFAULT_BIRTHDAY_WISHES;
  }, [letters]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(getNextBirthdayCountdown(config.birthdayMonthDay));
    }, 1000);
    return () => window.clearInterval(id);
  }, [config.birthdayMonthDay]);

  useEffect(() => {
    return () => {
      stopMicRef.current?.();
    };
  }, []);

  const allOut = candlesLit.every((c) => !c);

  const triggerFireworks = () => {
    birthdayAudio.start();
    void confetti({
      particleCount: 110,
      spread: 88,
      origin: { y: 0.58 },
      colors: ['#C98291', '#D6B477', '#FCE8E8', '#542D3A', '#FFFFFF'],
    });
    window.setTimeout(() => {
      void confetti({
        particleCount: 75,
        angle: 60,
        spread: 60,
        origin: { x: 0.14, y: 0.65 },
        colors: ['#C98291', '#D6B477'],
      });
      void confetti({
        particleCount: 75,
        angle: 120,
        spread: 60,
        origin: { x: 0.86, y: 0.65 },
        colors: ['#C98291', '#D6B477'],
      });
    }, 320);
  };

  const blowOutCandle = (idx: number) => {
    setCandlesLit((prev) => {
      const next = prev.map((lit, i) => (i === idx ? false : lit));
      if (next.every((v) => !v)) {
        triggerFireworks();
      }
      return next;
    });
  };

  const blowAllCandles = () => {
    setCandlesLit([false, false, false, false, false]);
    setMicActive(false);
    stopMicRef.current?.();
    stopMicRef.current = null;
    triggerFireworks();
  };

  const relightCandles = () => {
    setCandlesLit([true, true, true, true, true]);
  };

  const toggleMicrophoneBlow = async () => {
    setMicError(null);
    if (micActive) {
      stopMicRef.current?.();
      stopMicRef.current = null;
      setMicActive(false);
      return;
    }
    try {
      setMicActive(true);
      const stop = await startMicBlowDetector(() => {
        blowAllCandles();
      });
      stopMicRef.current = stop;
    } catch {
      setMicActive(false);
      setMicError('Microphone permission unavailable — tap the candles or use Blow All Candles below.');
    }
  };

  const handleOpenSurprise = () => {
    setSurpriseOpened(true);
    triggerFireworks();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      {/* Live Countdown Salon */}
      <section className="luxury-glass relative overflow-hidden rounded-[32px] p-6 text-center sm:p-10">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#FCE8E8] opacity-75 blur-3xl dark:bg-[#692B44]/40" />

        <div className="relative z-10">
          <p className="text-xs font-semibold tracking-[0.26em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Counting Every Second to {birthdayLabel}, {countdown.year}
          </p>
          <h2 className="mt-2 font-serif-display text-4xl font-bold text-[#542D3A] sm:text-5xl dark:text-[#FFF5F0]">
            Happy Birthday, {config.herName}{' '}
            <span className="italic text-[#C98291] dark:text-[#E7C38A]">
              ({config.herNickname})
            </span>
          </h2>
          <p className="font-handwriting mt-2 text-2xl text-[#8c5263] dark:text-[#E8BAC4]">
            May every candle carry a promise kept across every year ahead.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-4 gap-3 sm:gap-5">
            {[
              { label: 'Days', val: countdown.days },
              { label: 'Hours', val: countdown.hours },
              { label: 'Minutes', val: countdown.minutes },
              { label: 'Seconds', val: countdown.seconds },
            ].map((unit) => (
              <div
                key={unit.label}
                className="rounded-2xl border border-[#D6B477]/50 bg-white/90 px-3 py-4 shadow-sm dark:bg-[#240F1A]/90"
              >
                <p className="font-serif-display text-3xl font-bold text-[#542D3A] tabular-nums sm:text-4xl dark:text-[#E7C38A]">
                  {String(unit.val).padStart(2, '0')}
                </p>
                <p className="mt-1 text-xs font-medium text-[#8c5263] dark:text-[#D9B8C2]">
                  {unit.label}
                </p>
              </div>
            ))}
          </div>

          {/* Selectable Birthday & Romantic Music Jukebox */}
          <div className="mt-8 border-t border-[#D6B477]/30 pt-6">
            <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-[#C98291] uppercase dark:text-[#E7C38A]">
              <Music className="h-3.5 w-3.5" />
              <span>Birthday Soundtrack Selector</span>
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {MUSIC_TRACKS.map((track) => {
                const active = audioState.trackId === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      birthdayAudio.setTrack(track.id);
                      if (!audioState.playing) birthdayAudio.start();
                    }}
                    className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                        : 'border-[#D6B477]/50 bg-white text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
                    }`}
                  >
                    {track.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tiered Luxury Ivory & Champagne Gold Birthday Cake */}
      <section className="luxury-glass rounded-[32px] p-6 text-center sm:p-10">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
          Interactive Candle Ceremony
        </p>
        <h3 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
          Make a Wish &amp; Blow Out Your Candles
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[#6c4150] dark:text-[#DEC6CE]">
          Tap each warm candlelight flame—or turn on your microphone and gently blow toward your
          screen to release champagne-rose fireworks.
        </p>

        {/* Ornate Tiered Cake */}
        <div className="mx-auto mt-10 flex max-w-md flex-col items-center">
          {/* 5 Golden Stripes Candles */}
          <div className="flex items-end justify-center gap-6">
            {candlesLit.map((lit, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => blowOutCandle(idx)}
                aria-label={`Candle ${idx + 1} ${lit ? 'lit' : 'blown out'}`}
                className="group flex flex-col items-center focus-visible:outline-2 focus-visible:outline-[#C98291]"
              >
                <div className="flex h-9 items-end justify-center">
                  {lit ? (
                    <div className="animate-candle h-7 w-4 rounded-full bg-gradient-to-t from-[#EA580C] via-[#FACC15] to-[#FEF9C3] shadow-[0_0_20px_rgba(234,179,8,0.75)]" />
                  ) : (
                    <span className="text-xs font-semibold text-[#D6B477]">✦</span>
                  )}
                </div>
                <div className="h-12 w-3 rounded-t-sm border border-[#D6B477]/50 bg-gradient-to-b from-[#FCE8E8] via-[#C98291] to-[#542D3A] transition-transform group-hover:scale-105" />
              </button>
            ))}
          </div>

          {/* Top Ivory & Blush Frosting Tier */}
          <div className="relative h-14 w-64 rounded-t-3xl border-t-4 border-[#D6B477] bg-gradient-to-b from-[#FFFDF9] to-[#FCE8E8] shadow-md">
            <div className="flex justify-around pt-2 text-[#D6B477]">
              <span>✦</span>
              <span>❦</span>
              <span>✦</span>
            </div>
          </div>

          {/* Bottom Tier with Burgundy Ribbon & Gold Trim */}
          <div className="relative flex h-20 w-80 items-center justify-center rounded-t-lg rounded-b-2xl border-t-4 border-[#C98291] bg-gradient-to-b from-[#FFFFFF] via-[#FFF9F2] to-[#FCE8E8] shadow-xl">
            <div className="rounded-full border border-[#D6B477]/60 bg-[#542D3A] px-5 py-1 shadow-sm">
              <span className="font-handwriting text-xl text-[#FFF9F2]">
                For My Dearest {config.herNickname}
              </span>
            </div>
          </div>

          {/* Champagne Gold Cake Stand */}
          <div className="mt-1 h-3 w-88 rounded-full bg-gradient-to-r from-[#D6B477]/40 via-[#D6B477] to-[#D6B477]/40 shadow-sm" />
          <div className="h-4 w-24 rounded-b-xl bg-gradient-to-b from-[#D6B477] to-[#b59153]" />
        </div>

        {/* Candle Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void toggleMicrophoneBlow()}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${
              micActive
                ? 'bg-[#C98291] text-white'
                : 'border border-[#C98291]/60 bg-[#FCE8E8]/80 text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]'
            }`}
          >
            {micActive ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
            <span>{micActive ? 'Listening for Your Breath...' : 'Blow via Microphone'}</span>
          </button>

          <button
            type="button"
            onClick={blowAllCandles}
            className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810]"
          >
            <Flame className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
            <span>Blow All Candles</span>
          </button>

          {allOut && (
            <button
              type="button"
              onClick={relightCandles}
              className="inline-flex items-center gap-2 rounded-full border border-[#D6B477]/60 bg-white px-4 py-2.5 text-xs font-medium text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Relight Candles</span>
            </button>
          )}
        </div>

        {micError && (
          <p className="mt-3 text-xs font-medium text-[#9A3412] dark:text-amber-300">{micError}</p>
        )}

        {allOut && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-xl rounded-2xl border border-[#D6B477] bg-white/95 p-5 shadow-md dark:bg-[#240F1A]"
          >
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#542D3A] dark:text-[#FFF5F0]">
              <PartyPopper className="h-5 w-5 text-[#C98291] dark:text-[#E7C38A]" />
              <span>Every wish for you tonight is already my promise, {config.herNickname}!</span>
            </div>
          </motion.div>
        )}
      </section>

      {/* Interactive Surprise Reveal Box */}
      <section className="rounded-[32px] border border-[#D6B477]/60 bg-gradient-to-br from-[#FCE8E8]/85 via-white to-[#FFF9F2] p-6 text-center shadow-lg sm:p-10 dark:from-[#26101B] dark:via-[#190A12] dark:to-[#220E18]">
        <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
          Special Birthday Reveal
        </p>
        <h3 className="mt-1 font-serif-display text-2xl font-bold text-[#542D3A] sm:text-3xl dark:text-[#FFF5F0]">
          Your Birthday Surprise Box
        </h3>

        {!surpriseOpened ? (
          <div className="mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={handleOpenSurprise}
              className="group relative flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-[#D6B477] bg-white shadow-xl transition-transform hover:-translate-y-1 hover:scale-105 dark:bg-[#27111C]"
            >
              <Gift className="h-12 w-12 text-[#C98291] transition-transform group-hover:rotate-6 dark:text-[#E7C38A]" />
              <span className="absolute -top-2 -right-2 rounded-full bg-[#542D3A] px-2.5 py-0.5 text-[10px] font-bold text-[#FFF9F2] dark:bg-[#E7C38A] dark:text-[#1A0810]">
                OPEN
              </span>
            </button>
            <p className="mt-4 text-xs font-medium text-[#7D5260] dark:text-[#D9B8C2]">
              Tap the ribbon box to unveil {config.himName}&apos;s surprise celebration note.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mt-6 max-w-2xl rounded-3xl border border-[#D6B477] bg-white p-6 shadow-md sm:p-8 dark:bg-[#240F1A]"
          >
            <Heart className="mx-auto h-7 w-7 fill-[#C98291] text-[#C98291]" />
            <p className="font-handwriting mt-3 text-3xl text-[#542D3A] dark:text-[#FFF5F0]">
              &ldquo;To endless adventures, cozy evenings, and every {birthdayLabel} side by
              side.&rdquo;
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
              Happy Birthday, {config.herNickname}. Wherever we go—from Bambarakanda&apos;s mist to
              new horizons—my favorite home will always be wherever you are laughing beside me.
            </p>
          </motion.div>
        )}
      </section>

      {/* Birthday Wishes Carousel & Handwritten Stationery Letter */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="luxury-glass flex flex-col justify-between rounded-[28px] p-6 sm:p-8 lg:col-span-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#C98291] uppercase dark:text-[#E7C38A]">
              <Sparkles className="h-4 w-4 text-[#D6B477]" />
              <span className="tabular-nums">
                Birthday Wishes ({(wishIndex % birthdayWishes.length) + 1} / {birthdayWishes.length})
              </span>
            </div>
            <blockquote className="mt-6 font-serif-display text-2xl leading-relaxed italic text-[#542D3A] dark:text-[#FFF5F0]">
              &ldquo;{birthdayWishes[wishIndex % birthdayWishes.length]}&rdquo;
            </blockquote>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-[#D6B477]/35 pt-4">
            <button
              type="button"
              onClick={() =>
                setWishIndex((i) => (i - 1 + birthdayWishes.length) % birthdayWishes.length)
              }
              className="rounded-full border border-[#D6B477]/50 bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => setWishIndex((i) => (i + 1) % birthdayWishes.length)}
              className="rounded-full bg-[#542D3A] px-4 py-2 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810]"
            >
              Next Wish →
            </button>
          </div>
        </section>

        <section className="stationery-paper rounded-[28px] border border-[#D6B477]/65 p-6 shadow-md sm:p-10 lg:col-span-7">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Signature Keepsake Letter
          </p>
          <h3 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            My Dearest {config.herNickname}
          </h3>
          <div className="font-handwriting mt-5 space-y-4 whitespace-pre-line text-2xl leading-relaxed text-[#542D3A] dark:text-[#F5E7EC]">
            {signatureLetter}
          </div>
        </section>
      </div>
    </div>
  );
}
