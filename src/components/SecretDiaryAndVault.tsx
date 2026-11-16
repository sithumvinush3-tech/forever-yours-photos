import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Archive,
  CheckCircle2,
  Gift,
  HelpCircle,
  KeyRound,
  Lock,
  Search,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { DEFAULT_QUIZ_QUESTIONS } from '../data/seedData';
import { LocalAssistantService } from '../services';
import { formatFullDateLabel } from '../utils/dates';
import { resolvePhotoSrc } from '../utils/photoHelpers';
import { SecurePhotoImg } from './SecurePhotoImg';

export function SecretDiaryAndVault() {
  const {
    letters,
    diaryEntries: sheetDiaryEntries,
    milestones,
    photos,
    keepsakes,
    claimLocalCoupon,
    claimedCouponIds,
    suppressCloudCouponClaimed,
    activityResetTick,
    config,
  } = useMemories();

  // 1. Secret Diary Lock & Key
  const [passcode, setPasscode] = useState('');
  const [diaryUnlocked, setDiaryUnlocked] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  // 2. Treasure Chest Memory Vault toggle
  const [chestOpen, setChestOpen] = useState(true);

  // 3. Ask Our Memories AI Search
  const [question, setQuestion] = useState('');
  const [searching, setSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [matchedPhotoIds, setMatchedPhotoIds] = useState<string[]>([]);

  // 4. Memory Jar
  const reasons = useMemo(() => keepsakes.filter((k) => k.kind === 'reason'), [keepsakes]);
  const [drawnReasonIdx, setDrawnReasonIdx] = useState(0);

  // 5. Coupons
  const coupons = useMemo(() => keepsakes.filter((k) => k.kind === 'coupon'), [keepsakes]);

  // 6. Quiz
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    if (activityResetTick === 0) return;
    setPasscode('');
    setDiaryUnlocked(false);
    setLockError(null);
    setChestOpen(true);
    setQuestion('');
    setAiAnswer(null);
    setMatchedPhotoIds([]);
    setDrawnReasonIdx(0);
    setQuizIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
  }, [activityResetTick]);

  const diaryEntries = useMemo(() => {
    const legacyDiaryLetters = letters
      .filter((l) => l.letterType === 'diary')
      .map((l) => ({
        id: l.id,
        title: l.title,
        body: l.body,
      }));
    return [
      ...sheetDiaryEntries.map((d) => ({
        id: d.id,
        title: `${d.title}${d.entryDate ? ` · ${d.entryDate}` : ''}`,
        body: d.body,
      })),
      ...legacyDiaryLetters,
    ];
  }, [letters, sheetDiaryEntries]);
  const bdayMmDd = config.birthdayMonthDay.replace(/[^0-9]/g, '') || '0108';
  const annivMmDd = config.anniversaryDate.slice(5).replace(/[^0-9]/g, '') || '0616';
  const annivFull = config.anniversaryDate.replace(/[^0-9]/g, '');

  const handleUnlockDiary = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const herNameClean = config.herName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const herNickClean = config.herNickname.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const validCodes = [
      '0108',
      '20260108',
      '0616',
      '20260616',
      'manika',
      'nihara',
      bdayMmDd,
      annivMmDd,
      annivFull,
      herNameClean,
      herNickClean,
    ].filter(Boolean);
    if (validCodes.includes(clean)) {
      setDiaryUnlocked(true);
      setLockError(null);
    } else {
      setLockError(
        `Try ${config.herName}’s birthday (${bdayMmDd}), anniversary (${annivMmDd}), or ${config.herNickname}.`,
      );
    }
  };

  const handleAskMemories = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSearching(true);
    try {
      const res = LocalAssistantService.searchLocalMemories({
        question: question.trim(),
        milestones,
        photos,
        letters,
        diaryEntries: sheetDiaryEntries,
      });
      setAiAnswer(res.answer);
      setMatchedPhotoIds(res.matchedPhotoIds);
    } finally {
      setSearching(false);
    }
  };

  const drawFromJar = () => {
    if (reasons.length === 0) return;
    setDrawnReasonIdx((prev) => (prev + 1) % reasons.length);
  };

  const currentQuestion = DEFAULT_QUIZ_QUESTIONS[quizIndex];
  const handleSelectAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === currentQuestion.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (quizIndex + 1 < DEFAULT_QUIZ_QUESTIONS.length) {
      setQuizIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
    }
  };

  const matchedPhotos = photos.filter((p) => matchedPhotoIds.includes(p.id));
  const drawnReason = reasons[drawnReasonIdx];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D6B477]/35 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Linen Secret Diary &amp; Heirloom Treasure Vault
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
            Secret Diary, Memory Jar, Coupons &amp; Quiz
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setChestOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-[#D6B477] bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] shadow-sm hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
        >
          <Archive className="h-4 w-4 text-[#C98291] dark:text-[#E7C38A]" />
          <span>{chestOpen ? 'Latch Memory Vault' : 'Open Treasure Chest Vault'}</span>
        </button>
      </div>

      {/* 1. Linen-Bound Secret Diary + Ask Our Memories */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border-2 border-[#D6B477]/70 bg-gradient-to-br from-[#FCE8E8]/80 via-[#FFF9F2] to-white p-6 shadow-md sm:p-8 dark:from-[#26111C] dark:via-[#1B0B13] dark:to-[#13070D]">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
            {diaryUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            <span>Linen-Bound Secret Diary</span>
          </div>

          {!diaryUnlocked ? (
            <form onSubmit={handleUnlockDiary} className="mt-4 space-y-4">
              <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Turn the Brass Key to Unlock
              </h3>
              <p className="text-sm text-[#6c4150] dark:text-[#EAD0D9]">
                Hint: Try {config.herName}&apos;s birthday (
                <span className="font-mono font-semibold">{bdayMmDd}</span>) or our relationship
                start (<span className="font-mono font-semibold">{annivMmDd}</span>).
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder={`Enter key (e.g. ${bdayMmDd})`}
                  className="flex-1 rounded-xl border border-[#D6B477]/70 bg-white px-4 py-2.5 text-sm text-[#542D3A] focus:border-[#542D3A] focus:outline-none dark:bg-[#190A12] dark:text-[#FFF5F0] dark:placeholder:text-[#A98290] dark:focus:border-[#E7C38A]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#542D3A] px-4 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
                >
                  <KeyRound className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
                  <span>Unlock</span>
                </button>
              </div>
              {lockError && (
                <p className="text-xs font-medium text-[#9A3412] dark:text-rose-300">{lockError}</p>
              )}
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-4"
            >
              <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Unlocked Private Reflections
              </h3>
              {diaryEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="stationery-paper rounded-2xl border border-[#D6B477]/65 p-5 shadow-sm"
                >
                  <p className="font-serif-display text-xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {entry.title}
                  </p>
                  <p className="font-handwriting mt-2 whitespace-pre-line text-2xl leading-relaxed text-[#542D3A] dark:text-[#F5DCE4]">
                    {entry.body}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Search Cached & Synced Memories */}
        <section className="luxury-glass rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
            <Sparkles className="h-4 w-4 text-[#D6B477]" />
            <span>Search Our Memories (Local Keyword Search)</span>
          </div>
          <h3 className="mt-2 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            Search Saved Trips, Captions &amp; Letters
          </h3>
          <form onSubmit={(e) => void handleAskMemories(e)} className="mt-4 flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Show me our waterfall trips in July"
              className="flex-1 rounded-xl border border-[#D6B477]/70 bg-white px-4 py-2.5 text-sm text-[#542D3A] focus:border-[#542D3A] focus:outline-none dark:bg-[#190A12] dark:text-[#FFF5F0] dark:placeholder:text-[#A98290] dark:focus:border-[#E7C38A]"
            />
            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#542D3A] px-4 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6a3a4a] disabled:opacity-60 dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
            >
              <Search className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
              <span>{searching ? 'Searching...' : 'Ask'}</span>
            </button>
          </form>

          {aiAnswer && (
            <div className="mt-4 space-y-3 rounded-2xl border border-[#D6B477]/50 bg-[#FFF9F2] p-4 dark:bg-[#230E18]">
              <p className="text-sm leading-relaxed text-[#542D3A] dark:text-[#FFF5F0]">
                {aiAnswer}
              </p>
              {matchedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {matchedPhotos.map((p) => {
                    const src = resolvePhotoSrc(p);
                    if (!src) return null;
                    return (
                      <SecurePhotoImg
                        key={p.id}
                        src={src}
                        alt={p.caption}
                        className="aspect-square rounded-xl object-cover"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Vault Treasure Chest Contents */}
      {chestOpen && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* 2. Memory Jar & Reasons Collection */}
          <section className="rounded-[32px] border border-[#D6B477]/65 bg-gradient-to-br from-[#FCE8E8]/80 via-white to-[#FFF9F2] p-6 text-center shadow-md sm:p-10 dark:from-[#26111C] dark:via-[#1B0B13] dark:to-[#13070D]">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
              The Crystal Memory Jar · Reasons Why I Love You
            </p>
            <h3 className="mt-2 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              Pull a Handwritten Slip From Our Jar
            </h3>
            {drawnReason && (
              <div className="stationery-paper mx-auto mt-6 max-w-2xl rounded-2xl border border-[#D6B477] p-6 shadow-sm">
                <p className="text-xs font-semibold text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                  Reason #{drawnReason.numberIndex ?? drawnReasonIdx + 1} of {reasons.length}
                </p>
                <p className="font-handwriting mt-2 text-3xl text-[#542D3A] dark:text-[#FFF5F0]">
                  &ldquo;{drawnReason.title}&rdquo;
                </p>
                {drawnReason.detail && (
                  <p className="mt-2 text-sm text-[#6c4150] dark:text-[#EAD0D9]">
                    {drawnReason.detail}
                  </p>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={drawFromJar}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-6 py-3 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
            >
              <Sparkles className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
              <span>Draw Another Reason</span>
            </button>
          </section>

          {/* 3. Digital Love Coupon Book & Compatibility Trivia Quiz */}
          <div className="grid gap-6 lg:grid-cols-12">
            <section className="luxury-glass space-y-4 rounded-[28px] p-6 lg:col-span-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
                <Gift className="h-4 w-4 text-[#D6B477]" />
                <span>Digital Love Coupon Book</span>
              </div>
              <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Redeem Anytime, {config.herNickname}
              </h3>
              <div className="space-y-3">
                {coupons.map((coupon) => {
                  const isClaimed =
                    (!suppressCloudCouponClaimed && Boolean(coupon.claimed)) ||
                    claimedCouponIds.includes(coupon.id);
                  return (
                    <div
                      key={coupon.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-[#D6B477] bg-white p-4 shadow-xs dark:bg-[#230E18]"
                    >
                      <div>
                        <p className="font-serif-display text-lg font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                          {coupon.title}
                        </p>
                        <p className="mt-1 text-xs text-[#6c4150] dark:text-[#EAD0D9]">
                          {coupon.detail}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isClaimed}
                        onClick={() => claimLocalCoupon(coupon.id)}
                        className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                          isClaimed
                            ? 'border border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                            : 'bg-[#542D3A] text-[#FFF9F2] hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]'
                        }`}
                      >
                        {isClaimed ? 'Claimed ✓' : 'Claim Voucher'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="luxury-glass rounded-[28px] p-6 lg:col-span-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
                <HelpCircle className="h-4 w-4 text-[#D6B477]" />
                <span>Quiz: How Well Do You Know Us?</span>
              </div>

              {!quizFinished ? (
                <div className="mt-4 space-y-4">
                  <p className="text-xs font-semibold text-[#8c5263] tabular-nums dark:text-[#D9B8C2]">
                    Question {quizIndex + 1} of {DEFAULT_QUIZ_QUESTIONS.length} · Score: {score}
                  </p>
                  <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {currentQuestion.question}
                  </h3>

                  <div className="space-y-2">
                    {currentQuestion.options.map((opt, idx) => {
                      const chosen = selectedOption === idx;
                      const isCorrect = idx === currentQuestion.correctIndex;
                      let style =
                        'border-[#D6B477]/50 bg-white text-[#542D3A] hover:bg-[#FCE8E8]/70 dark:bg-[#230E18] dark:text-[#FFF5F0] dark:hover:bg-[#3A192A]';
                      if (selectedOption !== null) {
                        if (isCorrect) {
                          style =
                            'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200';
                        } else if (chosen) {
                          style =
                            'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200';
                        }
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectAnswer(idx)}
                          className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${style}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption !== null && (
                    <div className="space-y-3 rounded-xl border border-[#D6B477]/60 bg-[#FFF9F2] p-4 dark:bg-[#230E18]">
                      <p className="text-xs leading-relaxed text-[#542D3A] dark:text-[#FFF5F0]">
                        {selectedOption === currentQuestion.correctIndex
                          ? currentQuestion.sweetNote
                          : `Close! ${currentQuestion.sweetNote}`}
                      </p>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="rounded-full bg-[#542D3A] px-4 py-2 text-xs font-semibold text-[#FFF9F2] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                      >
                        {quizIndex + 1 < DEFAULT_QUIZ_QUESTIONS.length
                          ? 'Next Question →'
                          : 'See Results'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 space-y-4 rounded-2xl border border-[#D6B477] bg-white p-6 text-center dark:bg-[#230E18]">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-[#C98291] dark:text-[#E7C38A]" />
                  <h4 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    You scored {score} / {DEFAULT_QUIZ_QUESTIONS.length}!
                  </h4>
                  <p className="text-sm text-[#6c4150] dark:text-[#EAD0D9]">
                    No matter the score, every moment with you since{' '}
                    {formatFullDateLabel(config.anniversaryDate)} is my favorite memory,{' '}
                    {config.herNickname}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizIndex(0);
                      setSelectedOption(null);
                      setScore(0);
                      setQuizFinished(false);
                    }}
                    className="rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </section>
          </div>
        </motion.div>
      )}
    </div>
  );
}
