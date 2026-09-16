const DAY_IN_MS = 24 * 60 * 60 * 1000;

/** Midnight local time, so day counts are not skewed by the clock. */
export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Whole days from today to `target`. Negative once the date has passed.
 * Both ends are normalised to midnight so "tomorrow" is always 1, never 0.9.
 */
export function daysUntil(target: string | Date, from: Date = new Date()): number {
  const end = startOfDay(new Date(target)).getTime();
  const start = startOfDay(from).getTime();
  return Math.round((end - start) / DAY_IN_MS);
}

export function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

/** Date-only ISO string (`YYYY-MM-DD`), for inputs that carry no time. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * The API stores instants, and a date the driver picked should mean the same
 * calendar day everywhere, so it is sent as UTC midnight.
 */
export function toApiDate(date: Date): string {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();
}

/** Reverses {@link toApiDate} back to a local date for display and editing. */
export function fromApiDate(iso: string): Date {
  const parsed = new Date(iso);
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

/** Month key (`YYYY-MM`) used to bucket expenses for the statistics chart. */
export function monthKey(value: string | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
}
