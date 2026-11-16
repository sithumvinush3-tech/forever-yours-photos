export function parseDateMs(dateStr?: string): number {
  if (!dateStr) return Number.MAX_SAFE_INTEGER;
  const trimmed = dateStr.trim();
  if (!trimmed) return Number.MAX_SAFE_INTEGER;

  // Handle strict ISO YYYY-MM-DD cleanly in local time to avoid UTC off-by-one shifts
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    return new Date(year, month, day).getTime();
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    const year = Number(dmyMatch[3]);
    return new Date(year, month, day).getTime();
  }

  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

export function sortByDateAsc<
  T extends { date?: string; orderIndex?: number; title?: string },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aMs = parseDateMs(a.date);
    const bMs = parseDateMs(b.date);
    if (aMs !== bMs) return aMs - bMs;
    const aOrder = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.title || '').localeCompare(b.title || '');
  });
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatBirthdayLabel(monthDay?: string): string {
  const [mStr, dStr] = (monthDay || '01-08').split('-');
  const m = Number(mStr);
  const d = Number(dStr);
  if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
    return `${MONTH_NAMES[m - 1]} ${d}`;
  }
  return monthDay || 'January 8';
}

export function formatFullDateLabel(isoDate?: string): string {
  if (!isoDate) return 'June 16, 2026';
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(isoDate.trim());
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12) {
      return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
    }
  }
  return isoDate;
}
