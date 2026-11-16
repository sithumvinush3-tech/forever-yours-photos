import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  HelpCircle,
  ImageOff,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useMemories } from '../../context/MemoryContext';
import type { ArcadeDifficulty } from '../../types';
import { formatFullDateLabel } from '../../utils/dates';
import { gameSfx } from '../../utils/gameSfx';
import { resolveCoverSrc, resolvePhotoFullSrc, resolvePhotoSrc } from '../../utils/photoHelpers';
import { SecurePhotoImg } from '../SecurePhotoImg';

interface MemoryDetectiveGameProps {
  onBack: () => void;
}

interface DetectiveRoundItem {
  id: string;
  imageData: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

const DIFFICULTY_SETTINGS: Record<
  ArcadeDifficulty,
  { label: string; blurClass: string; coverPanels: number; maxOptions: number; secondsPerQ: number }
> = {
  easy: {
    label: 'Easy',
    blurClass: 'blur-md scale-105',
    coverPanels: 0,
    maxOptions: 3,
    secondsPerQ: 25,
  },
  medium: {
    label: 'Medium',
    blurClass: 'blur-xl scale-110',
    coverPanels: 2,
    maxOptions: 4,
    secondsPerQ: 20,
  },
  hard: {
    label: 'Hard',
    blurClass: 'blur-2xl scale-115',
    coverPanels: 4,
    maxOptions: 4,
    secondsPerQ: 15,
  },
};

export function MemoryDetectiveGame({ onBack }: MemoryDetectiveGameProps) {
  const {
    arcadeConfig,
    arcadeQuestions,
    photos,
    milestones,
    submitArcadeResult,
  } = useMemories();

  const [difficulty, setDifficulty] = useState<ArcadeDifficulty>(
    arcadeConfig.detectiveDifficulty || 'medium',
  );
  const [phase, setPhase] = useState<'ready' | 'playing' | 'summary'>('ready');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [noHintCorrectCount, setNoHintCorrectCount] = useState(0);
  const [roundNonce, setRoundNonce] = useState('');
  const [savingResult, setSavingResult] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveInfo, setSaveInfo] = useState<{ savedToCloud: boolean; newBadges: string[] } | null>(
    null,
  );
  const gameStartTimeRef = useRef<number>(Date.now());

  const maxOptions = DIFFICULTY_SETTINGS[difficulty].maxOptions;

  // Build authentic deck from configured questions, photos, and milestones
  const deck: DetectiveRoundItem[] = useMemo(() => {
    const resolveImage = (photoId?: string, customPhotoData?: string) => {
      if (customPhotoData) return customPhotoData;
      if (photoId) {
        const photoMatch = photos.find((p) => p.id === photoId);
        const photoSrc = resolvePhotoFullSrc(photoMatch) || resolvePhotoSrc(photoMatch);
        if (photoSrc) return photoSrc;
        const milestoneMatch = milestones.find((m) => m.id === photoId);
        const coverSrc = resolveCoverSrc(milestoneMatch);
        if (coverSrc) return coverSrc;
      }
      return '';
    };

    const customDetective = arcadeQuestions
      .filter((q) => q.published && q.gameType === 'detective')
      .map((q) => {
        const img = resolveImage(q.photoId, q.customPhotoUrl || q.customPhotoData);
        if (!img || q.options.length < 2) return null;
        const trimmedOptions = q.options.slice(0, maxOptions);
        const safeIdx = q.correctIndex < trimmedOptions.length ? q.correctIndex : 0;
        if (!trimmedOptions.includes(q.options[q.correctIndex])) {
          trimmedOptions[0] = q.options[q.correctIndex];
        }
        const finalCorrectIdx = trimmedOptions.indexOf(q.options[q.correctIndex]);
        return {
          id: q.id,
          imageData: img,
          prompt: q.prompt,
          options: trimmedOptions,
          correctIndex: finalCorrectIdx >= 0 ? finalCorrectIdx : safeIdx,
          hint: q.hint || 'Look closely at the lighting and setting in this memory.',
          explanation: q.explanation || `Correct answer: ${q.options[q.correctIndex]}`,
        } as DetectiveRoundItem;
      })
      .filter((x): x is DetectiveRoundItem => Boolean(x));

    const difficultyFiltered = customDetective.filter((item) => {
      const orig = arcadeQuestions.find((q) => q.id === item.id);
      return orig?.difficulty === difficulty;
    });

    if (difficultyFiltered.length >= 3) {
      return difficultyFiltered.slice(0, 5);
    }
    if (customDetective.length >= 3) {
      return customDetective.slice(0, 5);
    }

    // Derive rounds from curated gallery photos & milestones
    const generated: DetectiveRoundItem[] = [...customDetective];
    const usedIds = new Set(generated.map((g) => g.id));
    const candidateSources: {
      id: string;
      imageData: string;
      title: string;
      location: string;
      date: string;
      caption: string;
    }[] = [];

    for (const p of photos) {
      const pSrc = resolvePhotoFullSrc(p) || resolvePhotoSrc(p);
      if (!pSrc || usedIds.has(p.id)) continue;
      const ms = milestones.find((m) => m.id === p.milestoneId);
      if (!ms) continue;
      candidateSources.push({
        id: p.id,
        imageData: pSrc,
        title: ms.title,
        location: p.location || ms.location,
        date: p.date || ms.date,
        caption: p.caption || ms.description,
      });
    }

    for (const ms of milestones) {
      const mSrc = resolveCoverSrc(ms);
      if (!mSrc || usedIds.has(ms.id)) continue;
      candidateSources.push({
        id: `ms-${ms.id}`,
        imageData: mSrc,
        title: ms.title,
        location: ms.location,
        date: ms.date,
        caption: ms.description,
      });
    }

    const uniqueMilestoneTitles = Array.from(new Set(milestones.map((m) => m.title)));
    if (uniqueMilestoneTitles.length >= 2) {
      for (const item of candidateSources) {
        if (generated.length >= 5) break;
        const distractors = uniqueMilestoneTitles
          .filter((t) => t !== item.title)
          .slice(0, maxOptions - 1);
        if (distractors.length === 0) continue;
        const combined = [item.title, ...distractors];
        // Deterministic rotate by item id char sum so answer isn't always option A
        const shift =
          item.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % combined.length;
        const rotated = [...combined.slice(shift), ...combined.slice(0, shift)];
        const correctIdx = rotated.indexOf(item.title);
        generated.push({
          id: item.id,
          imageData: item.imageData,
          prompt: 'Which chapter from our shared story is captured in this memory?',
          options: rotated,
          correctIndex: correctIdx,
          hint: `Clue: Recorded in ${item.location} (${formatFullDateLabel(item.date)}).`,
          explanation: `${item.title} (${formatFullDateLabel(item.date)}) — ${item.caption}`,
        });
      }
    }

    return generated.slice(0, 5);
  }, [arcadeQuestions, photos, milestones, difficulty, maxOptions]);

  const currentQuestion = deck[currentIndex] || null;
  const settings = DIFFICULTY_SETTINGS[difficulty];

  const startNewGame = () => {
    if (deck.length === 0) return;
    gameSfx.tap();
    setPhase('playing');
    setCurrentIndex(0);
    setSelectedOption(null);
    setHintUsed(false);
    setTimeLeft(settings.secondsPerQ);
    setScore(0);
    setCorrectCount(0);
    setNoHintCorrectCount(0);
    setSaveError(null);
    setSaveInfo(null);
    setRoundNonce(`md_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`);
    gameStartTimeRef.current = Date.now();
  };

  // Per-question countdown timer
  useEffect(() => {
    if (phase !== 'playing' || selectedOption !== null) return;
    if (timeLeft <= 0) {
      gameSfx.wrong();
      setSelectedOption(-1);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, selectedOption, timeLeft]);

  const handleSelectAnswer = (optionIdx: number) => {
    if (selectedOption !== null || !currentQuestion) return;
    setSelectedOption(optionIdx);
    if (optionIdx === currentQuestion.correctIndex) {
      const gained = hintUsed ? 100 : 150;
      setScore((prev) => prev + gained);
      setCorrectCount((prev) => prev + 1);
      if (!hintUsed) setNoHintCorrectCount((prev) => prev + 1);
      gameSfx.bonus();
    } else {
      gameSfx.wrong();
    }
  };

  const finishGame = useCallback(
    async (finalScore: number, totalCorrect: number) => {
      setPhase('summary');
      const durationSec = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
      const xpEarned = Math.min(400, 40 + totalCorrect * 45);
      const qualifiesMaster = finalScore >= 300 || totalCorrect === deck.length;

      if (finalScore > 0) {
        void confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C98291', '#D6B477', '#FCE8E8', '#542D3A'],
        });
      }

      setSavingResult(true);
      setSaveError(null);
      try {
        const res = await submitArcadeResult({
          roundNonce,
          gameId: 'memory_detective',
          difficulty,
          score: finalScore,
          xpEarned,
          completed: true,
          durationSec,
          qualifiesMaster,
        });
        setSaveInfo({
          savedToCloud: res.savedToCloud,
          newBadges: res.newlyUnlockedBadges,
        });
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : 'Score saved locally; cloud sync encountered an error.',
        );
      } finally {
        setSavingResult(false);
      }
    },
    [deck.length, difficulty, roundNonce, submitArcadeResult],
  );

  const handleNext = () => {
    gameSfx.tap();
    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setHintUsed(false);
      setTimeLeft(settings.secondsPerQ);
    } else {
      void finishGame(score, correctCount);
    }
  };

  const isRevealed = selectedOption !== null;
  const activeBlurClass = isRevealed
    ? 'blur-0 scale-100'
    : hintUsed
      ? 'blur-sm scale-102'
      : settings.blurClass;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#D6B477]/60 bg-white/90 px-4 py-2 text-xs font-semibold text-[#542D3A] transition-colors hover:bg-[#FCE8E8] dark:bg-[#240F1A] dark:text-[#FFF5F0] dark:hover:bg-[#3A192A]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Love Arcade</span>
        </button>

        <div className="flex items-center gap-3 text-xs font-semibold text-[#542D3A] tabular-nums dark:text-[#E7C38A]">
          <span>Difficulty: {settings.label}</span>
          {phase === 'playing' && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                Memory {currentIndex + 1} / {deck.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>Score: {score} pts</span>
            </>
          )}
        </div>
      </div>

      {/* Empty state if no photographs or questions exist */}
      {deck.length === 0 && (
        <div className="luxury-glass rounded-[32px] p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FCE8E8] text-[#C98291] dark:bg-[#311622] dark:text-[#E7C38A]">
            <ImageOff className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            Memory Rounds Unavailable
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6c4150] dark:text-[#DEC6CE]">
            No curated memory rounds are available for this difficulty right now.
          </p>
        </div>
      )}

      {/* Ready / Mode Selection Screen */}
      {deck.length > 0 && phase === 'ready' && (
        <section className="luxury-glass rounded-[32px] p-6 sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                Game 1 · Guess Our Memories
              </p>
              <h2 className="font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
                Memory Detective
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
                Inspect a veiled photograph from our story and identify the memory before the clock
                runs out. Answer without a hint for <strong>150 points</strong>, or reveal a hint
                for <strong>100 points</strong>.
              </p>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#D6B477]/60 bg-[#FCE8E8] text-[#542D3A] dark:bg-[#311622] dark:text-[#E7C38A]">
              <Search className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#7D5260] uppercase dark:text-[#D9B8C2]">
              Choose Difficulty
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['easy', 'medium', 'hard'] as ArcadeDifficulty[]).map((lvl) => {
                const cfg = DIFFICULTY_SETTINGS[lvl];
                const active = difficulty === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      gameSfx.tap();
                      setDifficulty(lvl);
                    }}
                    className={`min-h-[44px] rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] shadow-md dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                        : 'border-[#D6B477]/45 bg-white/85 text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#230E18] dark:text-[#FFF5F0] dark:hover:bg-[#3A192A]'
                    }`}
                  >
                    <p className="font-serif-display text-xl font-bold">{cfg.label}</p>
                    <p
                      className={`mt-1 text-xs ${active ? 'opacity-90' : 'text-[#7D5260] dark:text-[#D9B8C2]'}`}
                    >
                      {cfg.maxOptions} choices · {cfg.secondsPerQ}s per round ·{' '}
                      {cfg.coverPanels === 0 ? 'Soft haze' : `${cfg.coverPanels} mystery tiles`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#D6B477]/35 pt-6">
            <p className="text-xs text-[#7D5260] tabular-nums dark:text-[#D9B8C2]">
              {deck.length} genuine memory rounds ready
            </p>
            <button
              type="button"
              onClick={startNewGame}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#542D3A] px-7 py-3 text-sm font-semibold text-[#FFF9F2] shadow-lg transition-transform hover:scale-[1.02] dark:bg-gradient-to-r dark:from-[#C98291] dark:to-[#D6B477] dark:text-[#1A0810]"
            >
              <Sparkles className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
              <span>Start Investigation</span>
            </button>
          </div>
        </section>
      )}

      {/* Active Gameplay */}
      {phase === 'playing' && currentQuestion && (
        <section className="luxury-glass rounded-[32px] p-5 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
              <Clock className="h-4 w-4" />
              <span className="tabular-nums">
                {selectedOption !== null ? 'Revealed' : `${timeLeft}s remaining`}
              </span>
            </div>

            {selectedOption === null && (
              <button
                type="button"
                onClick={() => {
                  gameSfx.tap();
                  setHintUsed(true);
                }}
                disabled={hintUsed}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#D6B477] bg-white px-4 py-1.5 text-xs font-semibold text-[#542D3A] transition-colors hover:bg-[#FCE8E8] disabled:opacity-60 dark:bg-[#230E18] dark:text-[#FCE8E8]"
              >
                <HelpCircle className="h-3.5 w-3.5 text-[#D6B477]" />
                <span>{hintUsed ? 'Hint Revealed (100 pt max)' : 'Use Hint (-50 pt bonus)'}</span>
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            {/* Clued Photo Frame */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-2 border-[#D6B477]/60 bg-[#2A121D] shadow-xl md:col-span-6">
              <SecurePhotoImg
                src={currentQuestion.imageData}
                variant="full"
                lazy={false}
                alt="Mystery memory clue"
                className={`h-full w-full object-cover transition-all duration-700 ${activeBlurClass}`}
              />

              {/* Covered Frost Quadrants (gradually uncovered on reveal) */}
              {!isRevealed && settings.coverPanels > 0 && (
                <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                  {[0, 1, 2, 3].map((tile) => {
                    const isCovered =
                      tile < settings.coverPanels && !(hintUsed && tile === 0);
                    return (
                      <div
                        key={tile}
                        className={`flex items-center justify-center rounded-2xl transition-opacity duration-500 ${
                          isCovered
                            ? 'border border-[#D6B477]/45 bg-[#542D3A]/82 backdrop-blur-md opacity-100'
                            : 'opacity-0'
                        }`}
                      >
                        {isCovered && (
                          <Eye className="h-5 w-5 text-[#D6B477]/80" aria-hidden="true" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {hintUsed && !isRevealed && (
                <div className="absolute right-3 bottom-3 left-3 rounded-2xl border border-[#D6B477] bg-[#1A0810]/88 px-3.5 py-2.5 text-xs text-[#FFF9F2] shadow-lg">
                  <span className="font-semibold text-[#E7C38A]">Hint: </span>
                  {currentQuestion.hint}
                </div>
              )}
            </div>

            {/* Answer Choices & Post-Answer Reveal */}
            <div className="flex flex-col justify-between space-y-4 md:col-span-6">
              <div>
                <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                  {currentQuestion.prompt}
                </h3>

                <div className="mt-4 space-y-2.5">
                  {currentQuestion.options.map((opt, idx) => {
                    const isCorrect = idx === currentQuestion.correctIndex;
                    const isChosen = selectedOption === idx;
                    let cardStyle =
                      'border-[#D6B477]/50 bg-white/95 text-[#542D3A] hover:border-[#C98291] hover:bg-[#FCE8E8]/60 dark:bg-[#230E18] dark:text-[#FFF5F0] dark:hover:bg-[#3A192A]';
                    if (isRevealed) {
                      if (isCorrect) {
                        cardStyle =
                          'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100';
                      } else if (isChosen) {
                        cardStyle =
                          'border-rose-500 bg-rose-50 text-rose-950 dark:bg-rose-950/60 dark:text-rose-100';
                      } else {
                        cardStyle =
                          'border-[#D6B477]/25 bg-white/50 text-[#7D5260] opacity-65 dark:bg-[#190A12] dark:text-[#A98290]';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isRevealed}
                        onClick={() => handleSelectAnswer(idx)}
                        className={`flex min-h-[46px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all ${cardStyle}`}
                      >
                        <span>{opt}</span>
                        {isRevealed && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {isRevealed && isChosen && !isCorrect && (
                          <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isRevealed && (
                <div className="space-y-3 rounded-2xl border border-[#D6B477]/60 bg-[#FFF9F2] p-4 dark:bg-[#1B0B13]">
                  <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                    {selectedOption === currentQuestion.correctIndex
                      ? `+${hintUsed ? 100 : 150} points earned`
                      : selectedOption === -1
                        ? "Time's up · 0 points"
                        : '0 points — here is the full memory'}
                  </p>
                  <p className="text-xs leading-relaxed text-[#542D3A] dark:text-[#EAD0D9]">
                    {currentQuestion.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#542D3A] px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                  >
                    {currentIndex + 1 < deck.length ? 'Next Memory Clue →' : 'View Final Score'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Final Score Screen */}
      {phase === 'summary' && (
        <section className="luxury-glass rounded-[32px] p-8 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D6B477] bg-[#FCE8E8] text-[#542D3A] shadow-md dark:bg-[#311622] dark:text-[#E7C38A]">
            <Trophy className="h-8 w-8" />
          </div>
          <p className="mt-4 text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Investigation Complete
          </p>
          <h2 className="mt-1 font-serif-display text-4xl font-bold text-[#542D3A] tabular-nums dark:text-[#FFF5F0]">
            {score} Points
          </h2>
          <p className="mt-2 text-sm text-[#6c4150] tabular-nums dark:text-[#DEC6CE]">
            {correctCount} of {deck.length} memories identified · {noHintCorrectCount} solved
            without hints
          </p>

          {savingResult && (
            <p className="mt-3 text-xs text-[#9A6876] dark:text-[#D9B8C2]">
              Saving score and XP progress...
            </p>
          )}
          {saveError && (
            <p className="mt-3 text-xs font-medium text-rose-600 dark:text-rose-400">{saveError}</p>
          )}
          {saveInfo && (
            <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Score &amp; XP saved locally on this device.
              {saveInfo.newBadges.length > 0 && ` · New badge unlocked!`}
            </p>
          )}

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={startNewGame}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#542D3A] px-6 py-3 text-xs font-semibold text-[#FFF9F2] shadow-md dark:bg-[#E7C38A] dark:text-[#1A0810]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#D6B477] bg-white px-6 py-3 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#230E18] dark:text-[#FFF5F0]"
            >
              <span>Return to Arcade</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
