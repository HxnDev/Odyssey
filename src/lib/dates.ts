/** Date helpers for ISO date strings (YYYY-MM-DD) used across the app. */

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseIso(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_NAMES = MONTHS;

/** "2024-06-15" -> "Jun 15, 2024" */
export function formatIso(date: string | null | undefined): string {
  if (!date) return "—";
  const d = parseIso(date);
  if (Number.isNaN(d.getTime())) return date;
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Compact date range, Been-style:
 * "27–28 Jul 2026" · "27 Jul – 3 Aug 2026" · "28 Dec 2026 – 2 Jan 2027".
 */
export function formatRange(start: string | null, end: string | null): string {
  const s = start ? parseIso(start) : null;
  const e = end ? parseIso(end) : null;
  const valid = (d: Date | null): d is Date => !!d && !Number.isNaN(d.getTime());
  const day = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;

  if (!valid(s) && !valid(e)) return "No dates";
  if (!valid(s)) return day(e as Date);
  if (!valid(e) || start === end) return day(s);

  if (s.getFullYear() === e.getFullYear()) {
    if (s.getMonth() === e.getMonth()) {
      return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} ${s.getFullYear()}`;
  }
  return `${day(s)} – ${day(e)}`;
}

/** Inclusive day count between two ISO dates; null when either is missing. */
export function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const ms = parseIso(end).getTime() - parseIso(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 86_400_000) + 1;
}

export function isPast(date: string | null): boolean {
  if (!date) return false;
  return date < todayIso();
}
