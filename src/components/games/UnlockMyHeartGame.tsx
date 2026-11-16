import { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  DoorOpen,
  Heart,
  HelpCircle,
  KeyRound,
  Lock,
  RotateCcw,
  Sparkles,
  Trophy,
  Video,
  XCircle,
} from 'lucide-react';
import { useMemories } from '../../context/MemoryContext';
import { DEFAULT_QUIZ_QUESTIONS, SHOWCASE_ARTWORK } from '../../data/seedData';
import { gameSfx } from '../../utils/gameSfx';
import { resolveCoverSrc, resolvePhotoFullSrc, resolvePhotoSrc } from '../../utils/photoHelpers';
import { SecureDriveVideo, SecurePhotoImg, useDriveMediaUrl } from '../SecurePhotoImg';

interface UnlockMyHeartGameProps {
  onBack: () => void;
}

function shuffleGuaranteed<T>(arr: T[], isIdentity: (candidate: T[]) => boolean): T[] {
  const copy = [...arr];
  for (let attempt = 0; attempt < 15; attempt++) {
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (!isIdentity(copy)) return copy;
  }
  if (copy.length >= 2) {
    [copy[0], copy[1]] = [copy[1], copy[0]];
  }
  return copy;
}

const HEART_SHARD_POLYGONS = [
  { id: 0, label: 'I', points: '50,34 25,18 10,38 34,54', center: [28, 36] },
  { id: 1, label: 'II', points: '50,34 75,18 90,38 66,54', center: [72, 36] },
  { id: 2, label: 'III', points: '10,38 34,54 50,74 26,64', center: [28, 57] },
  { id: 3, label: 'IV', points: '34,54 50,34 66,54 50,74', center: [50, 54] },
  { id: 4, label: 'V', points: '90,38 66,54 50,74 74,64', center: [72, 57] },
  { id: 5, label: 'VI', points: '26,64 50,74 74,64 50,90', center: [50, 77] },
];

function isEmbedVideoUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

function toEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export function UnlockMyHeartGame({ onBack }: UnlockMyHeartGameProps) {
  const { arcadeConfig, arcadeQuestions, config, photos, milestones, submitArcadeResult } =
    useMemories();

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // Determine real photograph for Level 1 & final surprise
  const level1PhotoRaw = useMemo(() => {
    if (arcadeConfig.unlockRewardPhotoUrl) return arcadeConfig.unlockRewardPhotoUrl;
    if (arcadeConfig.unlockRewardPhotoData) return arcadeConfig.unlockRewardPhotoData;
    if (config.openingTogetherPhotoUrl) return config.openingTogetherPhotoUrl;
    if (config.openingTogetherPhotoData) return config.openingTogetherPhotoData;
    const firstPhoto = photos.find((p) => p.published && Boolean(resolvePhotoSrc(p)));
    if (firstPhoto) return resolvePhotoFullSrc(firstPhoto) || resolvePhotoSrc(firstPhoto);
    const firstMilestone = milestones.find((m) => m.published && Boolean(resolveCoverSrc(m)));
    if (firstMilestone) return resolveCoverSrc(firstMilestone);
    return SHOWCASE_ARTWORK.bakersBend;
  }, [
    arcadeConfig.unlockRewardPhotoUrl,
    arcadeConfig.unlockRewardPhotoData,
    config.openingTogetherPhotoUrl,
    config.openingTogetherPhotoData,
    milestones,
    photos,
  ]);

  const resolvedLevel1Photo = useDriveMediaUrl(level1PhotoRaw, SHOWCASE_ARTWORK.bakersBend);
  const level1Photo = resolvedLevel1Photo || SHOWCASE_ARTWORK.bakersBend;

  // Quiz pool for Level 2
  const secretQuizQuestions = useMemo(() => {
    const adminConfigured = arcadeQuestions
      .filter((q) => q.published && q.gameType === 'secret_code' && q.options.length >= 2)
      .map((q) => ({
        id: q.id,
        question: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex < q.options.length ? q.correctIndex : 0,
        hint: q.hint || 'Think back to the chapters stored in our story.',
        explanation: q.explanation,
      }));
    if (adminConfigured.length >= 3) return adminConfigured.slice(0, 3);

    const fallback = DEFAULT_QUIZ_QUESTIONS.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      hint: q.sweetNote,
      explanation: q.sweetNote,
    }));
    return [...adminConfigured, ...fallback].slice(0, 3);
  }, [arcadeQuestions]);

  // Stage progression
  const [stage, setStage] = useState<'level1' | 'level2' | 'level3' | 'doors'>('level1');
  const [score, setScore] = useState(0);
  const startTimeRef = useRef(Date.now());
  const roundNonceRef = useRef(`uh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  // Level 1: 3x3 swap puzzle
  const [tiles, setTiles] = useState<number[]>(() =>
    shuffleGuaranteed([0, 1, 2, 3, 4, 5, 6, 7, 8], (arr) => arr.every((v, i) => v === i)),
  );
  const [selectedTileIdx, setSelectedTileIdx] = useState<number | null>(null);
  const [showTileNumbers, setShowTileNumbers] = useState(true);
  const [key1Unlocked, setKey1Unlocked] = useState(false);

  // Level 2: Secret Code Quiz
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizShowHint, setQuizShowHint] = useState(false);
  const [key2Unlocked, setKey2Unlocked] = useState(false);

  // Level 3: Heart Mosaic 6-Piece Puzzle
  const [heartPieces, setHeartPieces] = useState<number[]>(() =>
    shuffleGuaranteed([0, 1, 2, 3, 4, 5], (arr) => arr.every((v, i) => v === i)),
  );
  const [selectedShardIdx, setSelectedShardIdx] = useState<number | null>(null);
  const [key3Unlocked, setKey3Unlocked] = useState(false);

  // Final Doors & Reward Reveal
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [showSpecialReward, setShowSpecialReward] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [saveInfo, setSaveInfo] = useState<{ savedToCloud: boolean; newBadges: string[] } | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const level1Solved = tiles.every((v, idx) => v === idx);
  const level3Solved = heartPieces.every((v, idx) => v === idx);

  const handleTilePress = (idx: number) => {
    if (key1Unlocked) return;
    if (selectedTileIdx === null) {
      gameSfx.tap();
      setSelectedTileIdx(idx);
      return;
    }
    if (selectedTileIdx === idx) {
      setSelectedTileIdx(null);
      return;
    }

    const next = [...tiles];
    [next[selectedTileIdx], next[idx]] = [next[idx], next[selectedTileIdx]];
    setTiles(next);
    setSelectedTileIdx(null);
    gameSfx.tap();

    if (next.every((v, i) => v === i)) {
      gameSfx.unlock();
      setKey1Unlocked(true);
      setScore((s) => s + 200);
    }
  };

  const handleQuizPick = (optIdx: number) => {
    if (quizSelected !== null) return;
    const current = secretQuizQuestions[quizIdx];
    setQuizSelected(optIdx);
    if (optIdx === current.correctIndex) {
      gameSfx.bonus();
      const nextCorrect = quizCorrect + 1;
      setQuizCorrect(nextCorrect);
      setScore((s) => s + (quizShowHint ? 80 : 120));
      if (nextCorrect >= secretQuizQuestions.length) {
        setKey2Unlocked(true);
      }
    } else {
      gameSfx.wrong();
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIdx + 1 < secretQuizQuestions.length) {
      setQuizIdx((i) => i + 1);
      setQuizSelected(null);
      setQuizShowHint(false);
    } else if (quizCorrect >= secretQuizQuestions.length) {
      gameSfx.unlock();
      setStage('level3');
    } else {
      // Replay quiz if any answer missed so player earns Key 2 cleanly
      setQuizIdx(0);
      setQuizCorrect(0);
      setQuizSelected(null);
      setQuizShowHint(false);
    }
  };

  const handleShardPress = async (slotIdx: number) => {
    if (key3Unlocked) return;
    if (selectedShardIdx === null) {
      gameSfx.tap();
      setSelectedShardIdx(slotIdx);
      return;
    }
    if (selectedShardIdx === slotIdx) {
      setSelectedShardIdx(null);
      return;
    }

    const next = [...heartPieces];
    [next[selectedShardIdx], next[slotIdx]] = [next[slotIdx], next[selectedShardIdx]];
    setHeartPieces(next);
    setSelectedShardIdx(null);
    gameSfx.tap();

    if (next.every((v, i) => v === i)) {
      gameSfx.victory();
      setKey3Unlocked(true);
      const finalScore = score + 250;
      setScore(finalScore);
      setStage('doors');

      window.setTimeout(
        () => {
          setDoorsOpen(true);
          confetti({
            particleCount: 110,
            spread: 85,
            origin: { y: 0.55 },
            colors: ['#D6B477', '#E7C38A', '#C98291', '#FCE8E8'],
          });
        },
        prefersReducedMotion ? 80 : 420,
      );

      const elapsedSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      setSavingResult(true);
      setSaveError(null);
      try {
        const res = await submitArcadeResult({
          roundNonce: roundNonceRef.current,
          gameId: 'unlock_my_heart',
          difficulty: 'medium',
          score: finalScore,
          xpEarned: 260,
          completed: true,
          durationSec: elapsedSec,
        });
        setSaveInfo({
          savedToCloud: res.savedToCloud,
          newBadges: res.newlyUnlockedBadges,
        });
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Unable to save completion.');
      } finally {
        setSavingResult(false);
      }
    }
  };

  const restartAdventure = () => {
    roundNonceRef.current = `uh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    startTimeRef.current = Date.now();
    setStage('level1');
    setScore(0);
    setTiles(
      shuffleGuaranteed([0, 1, 2, 3, 4, 5, 6, 7, 8], (arr) => arr.every((v, i) => v === i)),
    );
    setSelectedTileIdx(null);
    setKey1Unlocked(false);
    setQuizIdx(0);
    setQuizCorrect(0);
    setQuizSelected(null);
    setQuizShowHint(false);
    setKey2Unlocked(false);
    setHeartPieces(
      shuffleGuaranteed([0, 1, 2, 3, 4, 5], (arr) => arr.every((v, i) => v === i)),
    );
    setSelectedShardIdx(null);
    setKey3Unlocked(false);
    setDoorsOpen(false);
    setShowSpecialReward(false);
    setSaveInfo(null);
    setSaveError(null);
  };

  const keysEarned = [key1Unlocked, key2Unlocked, key3Unlocked].filter(Boolean).length;
  const activeQuiz = secretQuizQuestions[quizIdx];

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

        <div className="flex items-center gap-4 text-xs font-semibold text-[#542D3A] tabular-nums dark:text-[#FCE8E8]">
          <span className="inline-flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-[#D6B477]" />
            <span>Keys: {keysEarned} / 3</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#C98291] dark:text-[#E7C38A]">
            <Trophy className="h-4 w-4" />
            <span>Score: {score}</span>
          </span>
        </div>
      </div>

      {/* Three Golden Doors Progress Stepper */}
      <div className="luxury-glass grid grid-cols-3 gap-2 rounded-2xl p-3 sm:gap-4 sm:p-4">
        {[
          { num: 1, title: 'Level 1 · First Key', unlocked: key1Unlocked, active: stage === 'level1' },
          { num: 2, title: 'Level 2 · Secret Code', unlocked: key2Unlocked, active: stage === 'level2' },
          { num: 3, title: 'Level 3 · Final Heart', unlocked: key3Unlocked, active: stage === 'level3' },
        ].map((step) => (
          <div
            key={step.num}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors ${
              step.unlocked
                ? 'border-emerald-400/70 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                : step.active
                  ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                  : 'border-[#D6B477]/30 bg-white/60 text-[#9A6876] dark:bg-[#1E0C15]/60 dark:text-[#D9B8C2]'
            }`}
          >
            {step.unlocked ? (
              <KeyRound className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0 opacity-75" />
            )}
            <span className="truncate">{step.title}</span>
          </div>
        ))}
      </div>

      {/* LEVEL 1: Picture Swap Puzzle */}
      {stage === 'level1' && (
        <section className="luxury-glass rounded-[32px] border border-[#D6B477]/50 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                Door One · The First Key
              </p>
              <h2 className="font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Restore Our Photograph
              </h2>
              <p className="text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                Tap any two tiles to swap their places until our portrait aligns in sequence (1 to
                9).
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowTileNumbers((v) => !v)}
                  className="rounded-full border border-[#D6B477]/55 bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
                >
                  {showTileNumbers ? 'Hide Tile Numbers' : 'Show Tile Numbers'}
                </button>
              </div>

              {level1Solved && (
                <div className="space-y-3 rounded-2xl border border-emerald-400/60 bg-emerald-50/90 p-4 text-emerald-950 dark:bg-emerald-950/45 dark:text-emerald-100">
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase">
                    <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    <span>First Key Unlocked!</span>
                  </p>
                  <p className="text-xs">
                    Every piece of our story fits right where it belongs. Step forward to Door Two!
                  </p>
                  <button
                    type="button"
                    onClick={() => setStage('level2')}
                    className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                  >
                    <span>Unlock Door Two</span>
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              <div className="mx-auto grid max-w-md grid-cols-3 gap-1.5 rounded-2xl border-2 border-[#D6B477] bg-[#2D1420] p-2 shadow-xl">
                {tiles.map((pieceValue, slotIdx) => {
                  const row = Math.floor(pieceValue / 3);
                  const col = pieceValue % 3;
                  const isSelected = selectedTileIdx === slotIdx;
                  const isAligned = pieceValue === slotIdx;
                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      onClick={() => handleTilePress(slotIdx)}
                      aria-label={`Puzzle piece ${pieceValue + 1} at slot ${slotIdx + 1}`}
                      className={`relative aspect-square overflow-hidden rounded-lg transition-transform focus-visible:outline-2 focus-visible:outline-white ${
                        isSelected
                          ? 'scale-[0.95] ring-3 ring-[#FFE58F]'
                          : isAligned
                            ? 'ring-1 ring-emerald-300/60'
                            : 'hover:opacity-95'
                      }`}
                      style={{
                        backgroundImage: `url("${level1Photo}")`,
                        backgroundSize: '300% 300%',
                        backgroundPosition: `${col * 50}% ${row * 50}%`,
                      }}
                    >
                      {showTileNumbers && (
                        <span
                          className={`absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums shadow ${
                            isAligned
                              ? 'bg-emerald-600/85 text-white'
                              : 'bg-black/65 text-[#FFF9F2]'
                          }`}
                        >
                          {pieceValue + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LEVEL 2: Secret Code Quiz */}
      {stage === 'level2' && activeQuiz && (
        <section className="luxury-glass mx-auto max-w-3xl space-y-6 rounded-[32px] border border-[#D6B477]/50 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                Door Two · The Secret Code ({quizIdx + 1} / {secretQuizQuestions.length})
              </p>
              <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                {activeQuiz.question}
              </h2>
            </div>
            <span className="text-xs font-bold text-[#9E7328] tabular-nums dark:text-[#E7C38A]">
              Correct: {quizCorrect} / {secretQuizQuestions.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {activeQuiz.options.map((option, idx) => {
              const isPicked = quizSelected === idx;
              const isRight = idx === activeQuiz.correctIndex;
              let btnStyle =
                'border-[#D6B477]/45 bg-white text-[#542D3A] hover:border-[#C98291] hover:bg-[#FCE8E8]/60 dark:bg-[#190A12] dark:text-[#FCE8E8]';
              if (quizSelected !== null) {
                if (isRight) {
                  btnStyle =
                    'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100';
                } else if (isPicked) {
                  btnStyle =
                    'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200';
                } else {
                  btnStyle = 'border-[#D6B477]/20 bg-white/50 opacity-65 dark:bg-[#190A12]/50';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={quizSelected !== null}
                  onClick={() => handleQuizPick(idx)}
                  className={`flex min-h-[48px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${btnStyle}`}
                >
                  <span>{option}</span>
                  {quizSelected !== null && isRight && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {quizSelected !== null && isPicked && !isRight && (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {quizShowHint && quizSelected === null && (
            <div className="rounded-xl border border-[#D6B477] bg-[#FFF9F2] px-4 py-3 text-xs text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]">
              <strong className="text-[#C98291] dark:text-[#E7C38A]">Hint: </strong>
              {activeQuiz.hint}
            </div>
          )}

          {quizSelected !== null && (
            <div className="rounded-2xl border border-[#D6B477]/50 bg-[#FFF9F2] p-4 text-xs leading-relaxed text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FCE8E8]">
              <p className="font-semibold">
                {quizSelected === activeQuiz.correctIndex
                  ? 'Secret Lock Digit Accepted!'
                  : 'Not quite — need all 3 answers correct to forge Key Two.'}
              </p>
              <p className="mt-1 opacity-90">{activeQuiz.explanation}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              disabled={quizSelected !== null || quizShowHint}
              onClick={() => setQuizShowHint(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/60 bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] disabled:opacity-50 dark:bg-[#27111C] dark:text-[#FCE8E8]"
            >
              <HelpCircle className="h-4 w-4 text-[#C98291]" />
              <span>{quizShowHint ? 'Hint Shown' : 'Use Memory Hint'}</span>
            </button>

            {quizSelected !== null && (
              <button
                type="button"
                onClick={handleNextQuizQuestion}
                className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-sm hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810]"
              >
                <span>
                  {quizIdx + 1 < secretQuizQuestions.length
                    ? 'Next Lock Question'
                    : quizCorrect >= secretQuizQuestions.length
                      ? 'Proceed to Final Heart'
                      : 'Retry Secret Code'}
                </span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* LEVEL 3: Heart-Shaped Multi-Piece Puzzle */}
      {stage === 'level3' && (
        <section className="luxury-glass rounded-[32px] border border-[#D6B477]/50 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                Door Three · The Final Heart
              </p>
              <h2 className="font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Assemble the Six Shards of My Heart
              </h2>
              <p className="text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                Tap any two heart shards below to swap them until all six Roman numerals (I through
                VI) match the glowing heart key slots. Completing the heart opens the Golden Doors!
              </p>

              <div className="rounded-2xl border border-[#D6B477]/45 bg-white/80 p-4 text-xs text-[#6c4150] dark:bg-[#1E0C15] dark:text-[#EAD0D9]">
                <p className="font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                  Shards in Right Position:
                </p>
                <p className="mt-1 font-serif-display text-2xl font-bold text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                  {heartPieces.filter((v, idx) => v === idx).length} / 6
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-5 lg:col-span-7">
              <svg
                viewBox="0 0 100 100"
                className="h-64 w-64 drop-shadow-xl sm:h-72 sm:w-72"
                aria-label="Heart puzzle target preview"
              >
                <defs>
                  <linearGradient id="heartGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E57297" />
                    <stop offset="50%" stopColor="#C98291" />
                    <stop offset="100%" stopColor="#D6B477" />
                  </linearGradient>
                </defs>
                {HEART_SHARD_POLYGONS.map((poly, slotIdx) => {
                  const pieceId = heartPieces[slotIdx];
                  const isCorrect = pieceId === slotIdx;
                  const isSelected = selectedShardIdx === slotIdx;
                  return (
                    <g
                      key={poly.id}
                      onClick={() => void handleShardPress(slotIdx)}
                      className="cursor-pointer"
                    >
                      <polygon
                        points={poly.points}
                        fill={isCorrect ? 'url(#heartGoldGrad)' : isSelected ? '#F5D06B' : '#4a1c2b'}
                        stroke={isSelected ? '#FFFFFF' : '#D6B477'}
                        strokeWidth={isSelected ? '2.2' : '1.2'}
                      />
                      <text
                        x={poly.center[0]}
                        y={poly.center[1]}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="6.5"
                        fontWeight="bold"
                        fill="#FFF9F2"
                      >
                        {HEART_SHARD_POLYGONS[pieceId].label}
                      </text>
                      <text
                        x={poly.center[0]}
                        y={poly.center[1] + 6}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="3.4"
                        fill="#FCE8E8"
                        opacity="0.85"
                      >
                        slot {poly.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Large accessible swap buttons underneath SVG for effortless mobile tapping */}
              <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:grid-cols-6">
                {heartPieces.map((pieceId, slotIdx) => {
                  const isCorrect = pieceId === slotIdx;
                  const isSelected = selectedShardIdx === slotIdx;
                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      onClick={() => void handleShardPress(slotIdx)}
                      className={`min-h-[48px] rounded-xl border px-2 py-2 text-center text-xs font-bold transition-colors ${
                        isSelected
                          ? 'border-amber-400 bg-amber-100 text-[#542D3A] dark:bg-amber-900/60 dark:text-white'
                          : isCorrect
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                            : 'border-[#D6B477]/50 bg-white text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]'
                      }`}
                    >
                      <span className="block text-[10px] opacity-70">
                        Slot {HEART_SHARD_POLYGONS[slotIdx].label}
                      </span>
                      <span>Piece {HEART_SHARD_POLYGONS[pieceId].label}</span>
                    </button>
                  );
                })}
              </div>

              {level3Solved && (
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Heart Complete! Opening the Golden Doors...
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FINAL REWARD: Golden Doors Opening + Personal Letter + Special Photo/Video */}
      {stage === 'doors' && (
        <section className="relative overflow-hidden rounded-[32px] border-2 border-[#D6B477] bg-gradient-to-b from-[#230c18] via-[#341223] to-[#1a0912] p-6 text-[#FFF9F2] shadow-2xl sm:p-10">
          {/* Spreading Golden Light Behind Doors */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
              doorsOpen ? 'opacity-100' : 'opacity-20'
            }`}
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(231, 195, 138, 0.36) 0%, rgba(201, 130, 145, 0.16) 45%, transparent 75%)',
            }}
          />

          {/* Falling CSS Petals inside the Sanctuary */}
          {!prefersReducedMotion &&
            doorsOpen &&
            Array.from({ length: 14 }, (_, idx) => (
              <span
                key={idx}
                aria-hidden="true"
                className="pointer-events-none absolute -top-6 h-3.5 w-2.5 rounded-full bg-gradient-to-br from-[#FCE8E8] to-[#C98291] opacity-80"
                style={{
                  left: `${(idx * 7 + 5) % 95}%`,
                  animation: `petalFall ${5 + (idx % 4)}s linear ${(idx % 5) * 0.45}s infinite`,
                }}
              />
            ))}

          {/* Animated Left & Right Golden Doors Overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 border-r-2 border-[#D6B477] bg-gradient-to-r from-[#3a1627] via-[#4b1e34] to-[#2d101e]"
            style={{
              transform: doorsOpen ? 'translateX(-102%)' : 'translateX(0%)',
              transition: prefersReducedMotion ? 'none' : 'transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div className="flex h-full items-center justify-end pr-5">
              <span className="h-12 w-3 rounded-full bg-[#D6B477] shadow-[0_0_20px_#D6B477]" />
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-1/2 border-l-2 border-[#D6B477] bg-gradient-to-l from-[#3a1627] via-[#4b1e34] to-[#2d101e]"
            style={{
              transform: doorsOpen ? 'translateX(102%)' : 'translateX(0%)',
              transition: prefersReducedMotion ? 'none' : 'transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div className="flex h-full items-center justify-start pl-5">
              <span className="h-12 w-3 rounded-full bg-[#D6B477] shadow-[0_0_20px_#D6B477]" />
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-3xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6B477]/65 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-[#E7C38A] uppercase">
              <DoorOpen className="h-4 w-4" />
              <span>All Three Keys United</span>
            </div>

            <h2 className="font-serif-display text-3xl font-bold text-[#FFF9F2] sm:text-5xl">
              {arcadeConfig.unlockLetterTitle}
            </h2>

            {/* Sealed Letter */}
            <article className="stationery-paper mx-auto max-w-2xl rounded-2xl border border-[#D6B477] p-6 text-left shadow-2xl sm:p-8 !bg-[#FFFDF9] !text-[#542D3A]">
              <p className="font-handwriting whitespace-pre-line text-2xl leading-relaxed text-[#542D3A]">
                {arcadeConfig.unlockLetterBody}
              </p>
            </article>

            {/* Reveal Special Photo / Video Button */}
            <div className="space-y-4">
              {!showSpecialReward ? (
                <button
                  type="button"
                  onClick={() => {
                    gameSfx.bonus();
                    setShowSpecialReward(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#D6B477] px-7 py-3 text-sm font-bold text-[#1A0810] shadow-[0_0_25px_rgba(214,180,119,0.5)] hover:bg-[#e5c78e]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Reveal Special Keepsake Surprise</span>
                </button>
              ) : (
                <div className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-[#D6B477]/65 bg-black/35 p-5">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#E7C38A] uppercase">
                    <Heart className="h-3.5 w-3.5 fill-current text-[#C98291]" />
                    <span>Golden Door Keepsake</span>
                  </p>
                  <SecurePhotoImg
                    src={level1PhotoRaw}
                    fallbackSrc={SHOWCASE_ARTWORK.bakersBend}
                    variant="full"
                    lazy={false}
                    alt={`${config.himName} and ${config.herName}`}
                    className="max-h-[420px] w-full rounded-2xl border border-[#D6B477]/50 object-cover"
                  />
                  {arcadeConfig.unlockRewardVideoUrl && (
                    <div className="space-y-2 pt-2 text-left">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E7C38A]">
                        <Video className="h-4 w-4" />
                        <span>Special Memory Video</span>
                      </p>
                      {isEmbedVideoUrl(arcadeConfig.unlockRewardVideoUrl) ? (
                        <iframe
                          src={toEmbedUrl(arcadeConfig.unlockRewardVideoUrl)}
                          title="Unlock My Heart Special Video"
                          allowFullScreen
                          className="aspect-video w-full rounded-2xl border border-[#D6B477]/50"
                        />
                      ) : (
                        <SecureDriveVideo
                          src={arcadeConfig.unlockRewardVideoUrl}
                          controls
                          playsInline
                          className="w-full rounded-2xl border border-[#D6B477]/50"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {savingResult && <p className="text-xs text-[#E7C38A]">Recording victory &amp; XP...</p>}
            {saveError && <p className="text-xs text-rose-300">{saveError}</p>}
            {saveInfo && !savingResult && (
              <div className="space-y-1 text-xs text-[#EAD0D9]">
                <p>Heart unlocked! Progress saved locally on this device.</p>
                {saveInfo.newBadges.length > 0 && (
                  <p className="font-semibold text-[#E7C38A]">
                    New Badge Unlocked: {saveInfo.newBadges.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={restartAdventure}
                className="inline-flex items-center gap-2 rounded-full border border-[#D6B477]/70 bg-white/10 px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full bg-[#C98291] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#b56f7e]"
              >
                <span>Return to Love Arcade</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
