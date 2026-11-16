import { useEffect, useMemo, useState } from 'react';
import { CalendarHeart, Cake, Sparkles } from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { formatBirthdayLabel, formatFullDateLabel } from '../utils/dates';

type CountdownTargetMode = 'auto' | 'anniversary' | 'birthday';

interface TargetDetails {
  kind: 'anniversary' | 'birthday';
  label: string;
  subtitle: string;
  targetMs: number;
  dateDisplay: string;
  milestoneNote: string;
  isToday: boolean;
}

function isSameMonthDay(a: Date, month: number, day: number): boolean {
  return a.getMonth() === month && a.getDate() === day;
}

function getNextAnnualOccurrence(
  monthIndex: number,
  day: number,
  minYear?: number,
): { date: Date; year: number; isToday: boolean } {
  const now = new Date();
  const baseYear = Math.max(now.getFullYear(), minYear ?? now.getFullYear());
  if (!minYear || baseYear === now.getFullYear()) {
    if (isSameMonthDay(now, monthIndex, day)) {
      return {
        date: new Date(now.getFullYear(), monthIndex, day, 23, 59, 59),
        year: now.getFullYear(),
        isToday: true,
      };
    }
  }

  let candidate = new Date(baseYear, monthIndex, day, 0, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate = new Date(now.getFullYear() + 1, monthIndex, day, 0, 0, 0);
  }
  return {
    date: candidate,
    year: candidate.getFullYear(),
    isToday: false,
  };
}

function splitDiff(targetMs: number) {
  const now = Date.now();
  const diff = Math.max(0, targetMs - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalMs: diff,
  };
}

export function Countdown() {
  const { config } = useMemories();
  const [selectedMode, setSelectedMode] = useState<CountdownTargetMode>('auto');
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const targets = useMemo(() => {
    // Parse birthday (MM-DD)
    const [bMonthStr, bDayStr] = (config.birthdayMonthDay || '01-08').split('-');
    const bMonth = Math.max(0, Math.min(11, (Number(bMonthStr) || 1) - 1));
    const bDay = Math.max(1, Math.min(31, Number(bDayStr) || 8));
    const nextBday = getNextAnnualOccurrence(bMonth, bDay);
    const birthdayTarget: TargetDetails = {
      kind: 'birthday',
      label: `${config.herName}'s Birthday`,
      subtitle: `Celebrating ${config.herNickname}'s special day`,
      targetMs: nextBday.date.getTime(),
      dateDisplay: `${formatBirthdayLabel(config.birthdayMonthDay)}, ${nextBday.year}`,
      milestoneNote: nextBday.isToday
        ? `Happy Birthday, ${config.herNickname}! Today is your day!`
        : `Counting every heartbeat until ${formatBirthdayLabel(config.birthdayMonthDay)}`,
      isToday: nextBday.isToday,
    };

    // Parse anniversary (YYYY-MM-DD)
    const annMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec((config.anniversaryDate || '2026-06-16').trim());
    const startYear = annMatch ? Number(annMatch[1]) : 2026;
    const aMonth = annMatch ? Math.max(0, Math.min(11, Number(annMatch[2]) - 1)) : 5;
    const aDay = annMatch ? Math.max(1, Math.min(31, Number(annMatch[3]))) : 16;

    const now = new Date();
    const originalDate = new Date(startYear, aMonth, aDay, 0, 0, 0);
    let nextAnniv: { date: Date; year: number; isToday: boolean };
    if (originalDate.getTime() > now.getTime()) {
      nextAnniv = { date: originalDate, year: startYear, isToday: false };
    } else {
      nextAnniv = getNextAnnualOccurrence(aMonth, aDay);
    }

    const yearsCount = Math.max(0, nextAnniv.year - startYear);
    const anniversaryNote =
      yearsCount === 0
        ? `Counting down to our radiant beginning on ${formatFullDateLabel(config.anniversaryDate)}`
        : `Counting down to ${yearsCount} ${yearsCount === 1 ? 'year' : 'years'} together since ${formatFullDateLabel(config.anniversaryDate)}`;

    const anniversaryTarget: TargetDetails = {
      kind: 'anniversary',
      label: yearsCount === 0 ? 'Our Relationship Date' : `Anniversary Year ${yearsCount}`,
      subtitle: `${config.himName} & ${config.herName}'s forever milestone`,
      targetMs: nextAnniv.date.getTime(),
      dateDisplay: formatFullDateLabel(
        `${nextAnniv.year}-${String(aMonth + 1).padStart(2, '0')}-${String(aDay).padStart(2, '0')}`,
      ),
      milestoneNote: nextAnniv.isToday
        ? `Happy Anniversary, ${config.herNickname}! Celebrating our love today!`
        : anniversaryNote,
      isToday: nextAnniv.isToday,
    };

    const soonest =
      anniversaryTarget.isToday ||
      (!birthdayTarget.isToday && anniversaryTarget.targetMs <= birthdayTarget.targetMs)
        ? anniversaryTarget
        : birthdayTarget;

    return {
      birthday: birthdayTarget,
      anniversary: anniversaryTarget,
      soonest,
    };
  }, [
    config.anniversaryDate,
    config.birthdayMonthDay,
    config.herName,
    config.herNickname,
    config.himName,
    Math.floor(nowTick / 60000),
  ]);

  const activeTarget =
    selectedMode === 'anniversary'
      ? targets.anniversary
      : selectedMode === 'birthday'
        ? targets.birthday
        : targets.soonest;

  const remaining = splitDiff(activeTarget.targetMs);
  const yearMs = 365 * 24 * 60 * 60 * 1000;
  const progressPct = activeTarget.isToday
    ? 100
    : Math.max(4, Math.min(99, Math.round(((yearMs - Math.min(yearMs, remaining.totalMs)) / yearMs) * 100)));

  return (
    <div className="mt-10 border-t border-[#D6B477]/35 pt-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-[#C98291] uppercase dark:text-[#E7C38A]">
              {activeTarget.kind === 'birthday' ? (
                <Cake className="h-3.5 w-3.5" />
              ) : (
                <CalendarHeart className="h-3.5 w-3.5" />
              )}
              <span>
                {activeTarget.label} · {activeTarget.dateDisplay}
              </span>
            </span>
          </div>

          <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] sm:text-3xl dark:text-[#FFF5F0]">
            {activeTarget.milestoneNote}
          </h3>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div
              role="group"
              aria-label="Choose countdown milestone"
              className="inline-flex items-center gap-1 rounded-xl border border-[#D6B477]/45 bg-[#FFF9F2]/90 p-1 dark:bg-[#1B0B13]/90"
            >
              {(
                [
                  { id: 'auto', label: 'Next Celebration' },
                  { id: 'anniversary', label: 'Anniversary' },
                  { id: 'birthday', label: 'Birthday' },
                ] as { id: CountdownTargetMode; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedMode(opt.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    selectedMode === opt.id
                      ? 'bg-[#542D3A] text-[#FFF9F2] shadow-xs dark:bg-[#E7C38A] dark:text-[#1A0810]'
                      : 'text-[#6c4150] hover:bg-[#FCE8E8] dark:text-[#D9B8C2] dark:hover:bg-[#311622]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-[#7D5260] tabular-nums dark:text-[#D9B8C2]">
              {progressPct}% closer to this day
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {activeTarget.isToday ? (
            <div className="inline-flex items-center gap-2.5 rounded-2xl border border-[#D6B477] bg-gradient-to-r from-[#FCE8E8] to-[#FFF9F2] px-6 py-4 text-sm font-semibold text-[#542D3A] shadow-md dark:from-[#3A192A] dark:to-[#230E18] dark:text-[#FFE6B3]">
              <Sparkles className="h-5 w-5 text-[#C98291] dark:text-[#E7C38A]" />
              <span>It&apos;s Celebration Day! Enjoy every magical moment together.</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
              {[
                { label: 'Days', value: remaining.days },
                { label: 'Hours', value: remaining.hours },
                { label: 'Minutes', value: remaining.minutes },
                { label: 'Seconds', value: remaining.seconds },
              ].map((u) => (
                <div
                  key={u.label}
                  className="min-w-[66px] rounded-2xl border border-[#D6B477]/45 bg-white/95 px-3 py-2.5 text-center shadow-sm sm:min-w-[78px] dark:bg-[#240F1A]/95"
                >
                  <p className="font-serif-display text-2xl font-bold text-[#542D3A] tabular-nums sm:text-3xl dark:text-[#E7C38A]">
                    {String(u.value).padStart(2, '0')}
                  </p>
                  <p className="text-[11px] font-medium text-[#8c5263] dark:text-[#D9B8C2]">
                    {u.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div
            aria-hidden="true"
            className="h-1.5 w-full overflow-hidden rounded-full bg-[#FCE8E8] dark:bg-[#2F1522]"
          >
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#C98291] to-[#D6B477] transition-all duration-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
