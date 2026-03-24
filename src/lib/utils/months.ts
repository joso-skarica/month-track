import { CROATIAN_MONTHS } from '@/lib/constants/client-presets';

export function getCurrentPeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatCroatianMonth(month: number, year: number): string {
  const name = CROATIAN_MONTHS[month - 1];
  return `${name} ${year}`;
}

export const DEFAULT_OVERDUE_THRESHOLD_DAY = 10;

export const DEFAULT_FIRST_REMINDER_DAY_OFFSET = 3;
export const DEFAULT_FOLLOW_UP_REMINDER_DAY_OFFSET = 7;
export const DEFAULT_FINAL_REMINDER_DAY_OFFSET = 10;
export const OVERDUE_THRESHOLD_DAY_MIN = 1;
export const OVERDUE_THRESHOLD_DAY_MAX = 28;

export function normalizeOverdueThresholdDay(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (
    !Number.isInteger(n) ||
    n < OVERDUE_THRESHOLD_DAY_MIN ||
    n > OVERDUE_THRESHOLD_DAY_MAX
  ) {
    return DEFAULT_OVERDUE_THRESHOLD_DAY;
  }
  return n;
}

/**
 * End of the given calendar day (1–28) in the month immediately after the tracked period (local time).
 * e.g. January 2026 + day 10 → 23:59:59 on 10 February 2026.
 */
export function followingMonthDayEnd(
  periodYear: number,
  periodMonth: number,
  day: number,
): Date {
  const d = normalizeOverdueThresholdDay(day);
  const deadlineMonth = periodMonth + 1;
  const deadlineYear = deadlineMonth > 12 ? periodYear + 1 : periodYear;
  const normalized = deadlineMonth > 12 ? 1 : deadlineMonth;
  return new Date(deadlineYear, normalized - 1, d, 23, 59, 59);
}

/** True once `now` is strictly after {@link followingMonthDayEnd} for the given period and day. */
export function isPastFollowingMonthDay(
  periodYear: number,
  periodMonth: number,
  day: number,
  now: Date = new Date(),
): boolean {
  return now > followingMonthDayEnd(periodYear, periodMonth, day);
}

/**
 * Incomplete month is overdue after the configured day of the following calendar month (end of that local day).
 * e.g. threshold 10 and January 2026 → overdue after 23:59:59 on 10 February 2026.
 */
export function isOverdue(
  year: number,
  month: number,
  thresholdDay: number = DEFAULT_OVERDUE_THRESHOLD_DAY,
): boolean {
  return isPastFollowingMonthDay(year, month, thresholdDay, new Date());
}

/** Calendar month arithmetic (month 1–12). */
export function addCalendarMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export const OPEN_MONTH_YEAR_MIN = 2000;
export const OPEN_MONTH_YEAR_MAX = 2100;

export function isValidOpenMonthYearMonth(
  year: number,
  month: number,
): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    year >= OPEN_MONTH_YEAR_MIN &&
    year <= OPEN_MONTH_YEAR_MAX &&
    month >= 1 &&
    month <= 12
  );
}
