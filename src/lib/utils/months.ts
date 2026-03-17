import { CROATIAN_MONTHS } from '@/lib/constants/client-presets';

export function getCurrentPeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function formatCroatianMonth(month: number, year: number): string {
  const name = CROATIAN_MONTHS[month - 1];
  return `${name} ${year}`;
}

/**
 * A month is overdue if today is past the 10th of the following month.
 * e.g. January 2026 becomes overdue after 10 February 2026 at 23:59:59.
 */
export function isOverdue(year: number, month: number): boolean {
  const now = new Date();
  const deadlineMonth = month + 1;
  const deadlineYear = deadlineMonth > 12 ? year + 1 : year;
  const normalized = deadlineMonth > 12 ? 1 : deadlineMonth;
  const deadline = new Date(deadlineYear, normalized - 1, 10, 23, 59, 59);
  return now > deadline;
}
