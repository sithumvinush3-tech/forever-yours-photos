import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Heart, Music, RotateCcw } from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { birthdayAudio } from '../utils/audioEngine';
import { formatBirthdayLabel, formatFullDateLabel } from '../utils/dates';
import { resolvePhotoSrc } from '../utils/photoHelpers';

interface IntroStageProps {
  onComplete: () => void;
}

export function IntroStage({ onComplete }: IntroStageProps) {
  const { config, photos } = useMemories();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const anniversaryLabel = formatFullDateLabel(config.anniversaryDate);
  const birthdayLabel = formatBirthdayLabel(config.birthdayMonthDay);

  // Use explicit uploaded couple photo first; if not uploaded yet, check if admin uploaded any real photo
  // NEVER combine two separate portraits or generate fake people!
  const firstValidPhoto = photos.map((p) => resolvePhotoSrc(p)).find(Boolean);
  const realTogetherPhoto =
    config.openingTogetherPhotoUrl || config.openingTogetherPhotoData || firstValidPhoto;

  useEffect(() => {
    if (!autoPlay) return;
    if (step === 2) return;
    const t = window.setTimeout(() => {
      setStep((prev) => (prev < 2 ? ((prev + 1) as 0 | 1 | 2) : prev));
    }, 3800);
    return () => window.clearTimeout(t);
  }, [step, autoPlay]);

  const handleEnterWorld = () => {
    birthdayAudio.start();
    onComplete();
  };

  const slides = [
    {
      index: 0,
      kicker: 'Act I · His Story',
      title: config.himName,
      subtitle: `Before ${anniversaryLabel} — waiting for the smile that would change everything.`,
      image: config.openingHisPhotoUrl || config.openingHisPhotoData,
    },
    {
      index: 1,
      kicker: 'Act II · Her Grace',
      title: `${config.herName} (${config.herNickname})`,
      subtitle: 'Warmth, pure kindness, and a light that made every ordinary day extraordinary.',
      image: config.openingHerPhotoUrl || config.openingHerPhotoData,
    },
    {
      index: 2,
      kicker: 'Act III · Forever Together',
      title: `${config.himName} & ${config.herName}`,
      subtitle:
        config.openingQuote ||
        'Two hearts united in one frame — our story, our adventures, our forever.',
      image: realTogetherPhoto,
    },
  ];

  const current = slides[step];

  return (
    <section className="relative mx-auto flex min-h-[calc(100vh-130px)] max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-8">
      {/* Romantic Editorial Header */}
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold tracking-[0.26em] text-[#C98291] uppercase dark:text-[#E7C38A]">
          For My Dearest {config.herNickname} · A Birthday Surprise · {birthdayLabel}
        </p>
        <h2 className="mt-2 font-serif-display text-4xl font-bold tracking-tight text-[#542D3A] sm:text-6xl dark:text-[#FFF5F0]">
          Forever Yours
        </h2>
        <p className="font-handwriting mt-1 text-2xl text-[#C98291] sm:text-3xl dark:text-[#E7C38A]">
          {config.himName} &amp; {config.herName}
        </p>
      </div>

      {/* 3-Act Cinematic Stage */}
      <div className="luxury-glass relative w-full max-w-4xl overflow-hidden rounded-[32px] p-6 sm:p-10">
        {/* Step Progress Indicator */}
        <div className="mb-6 flex items-center justify-center gap-3">
          {slides.map((s) => (
            <button
              key={s.index}
              type="button"
              onClick={() => {
                setAutoPlay(false);
                setStep(s.index as 0 | 1 | 2);
              }}
              className={`h-2 rounded-full transition-all ${
                step === s.index
                  ? 'w-12 bg-[#542D3A] dark:bg-[#E7C38A]'
                  : 'w-4 bg-[#D6B477]/45 hover:bg-[#C98291]'
              }`}
              aria-label={`View ${s.title}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.index}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="grid items-center gap-8 md:grid-cols-12"
          >
            {/* Photograph Frame with Gentle Ken Burns Zoom */}
            <div className="md:col-span-6">
              <div
                className={`relative mx-auto overflow-hidden rounded-3xl border-2 bg-[#FFF9F2] shadow-xl dark:bg-[#1E0C15] ${
                  step === 2
                    ? 'aspect-[4/3] max-w-md border-[#D6B477]'
                    : 'aspect-[3/4] max-w-xs border-[#D6B477]/60'
                }`}
              >
                {current.image && (
                  <motion.img
                    key={current.image}
                    src={current.image}
                    alt={current.title}
                    initial={{ scale: 1.0 }}
                    animate={{ scale: 1.07 }}
                    transition={{ duration: 5.5, ease: 'easeOut' }}
                    className="h-full w-full object-cover"
                  />
                )}

                {step === 2 && current.image && (
                  <div className="pointer-events-none absolute inset-0 ring-4 ring-inset ring-[#D6B477]/35" />
                )}
              </div>
            </div>

            {/* Poetic Narrative Column */}
            <div className="space-y-4 text-center md:col-span-6 md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#D6B477] uppercase">
                <Heart className="h-3.5 w-3.5 fill-[#C98291] text-[#C98291]" />
                <span>{current.kicker}</span>
              </div>
              <h3 className="font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
                {current.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#6c4150] sm:text-base dark:text-[#DEC6CE]">
                {current.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 md:justify-start">
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAutoPlay(false);
                      setStep((s) => (s + 1) as 0 | 1 | 2);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#D6B477] bg-white px-5 py-2.5 text-xs font-semibold text-[#542D3A] shadow-sm transition-colors hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
                  >
                    <span>Next Scene</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnterWorld}
                    className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-7 py-3 text-sm font-semibold text-[#FFF9F2] shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#6a3a4a] dark:bg-gradient-to-r dark:from-[#C98291] dark:to-[#D6B477] dark:text-[#1A0810]"
                  >
                    <Music className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
                    <span>Enter Our World &amp; Play Music</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStep(0);
                    setAutoPlay(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/45 bg-white/70 px-4 py-2.5 text-xs font-medium text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C]/80 dark:text-[#FCE8E8]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Replay</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip Link */}
      <button
        type="button"
        onClick={onComplete}
        className="mt-6 text-xs font-medium tracking-wider text-[#7D5260] underline-offset-4 hover:text-[#542D3A] hover:underline dark:text-[#D9B8C2] dark:hover:text-[#FFF5F0]"
      >
        Skip Opening Sequence →
      </button>
    </section>
  );
}
