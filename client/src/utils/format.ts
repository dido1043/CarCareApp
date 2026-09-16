import type { Language } from '@/i18n';

/**
 * Locale-aware formatting, in one place. Screens never build a number or a
 * currency string by hand — Bulgarian groups with spaces and puts the currency
 * after the amount, English groups with commas and puts it before.
 */

const LOCALE_TAG: Record<Language, string> = {
  en: 'en-GB',
  bg: 'bg-BG',
};

function localeTag(language: string): string {
  return LOCALE_TAG[language as Language] ?? LOCALE_TAG.en;
}

export const DEFAULT_CURRENCY = 'EUR';

export function formatCurrency(
  amount: number,
  language: string,
  currency: string = DEFAULT_CURRENCY,
  options: { maximumFractionDigits?: number } = {},
): string {
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  return new Intl.NumberFormat(localeTag(language), {
    style: 'currency',
    currency,
    maximumFractionDigits,
    minimumFractionDigits: Math.min(maximumFractionDigits, 2),
  }).format(amount);
}

/** Drops the decimals — for headline totals where the cents are noise. */
export function formatCurrencyCompact(
  amount: number,
  language: string,
  currency: string = DEFAULT_CURRENCY,
): string {
  return formatCurrency(amount, language, currency, { maximumFractionDigits: 0 });
}

export function formatNumber(
  value: number,
  language: string,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(localeTag(language), options).format(value);
}

/**
 * Mileage always carries its unit, because a bare five-digit number on a car
 * screen is ambiguous. `145,320 km` in English, `145 320 км` in Bulgarian.
 */
export function formatMileage(
  km: number,
  language: string,
  options: { unit?: string; maximumFractionDigits?: number } = {},
): string {
  const unit = options.unit ?? (language === 'bg' ? 'км' : 'km');
  const value = formatNumber(km, language, {
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  });
  return `${value} ${unit}`;
}

/** Signed distance, for the GPS estimate delta. */
export function formatMileageDelta(km: number, language: string): string {
  const sign = km > 0 ? '+' : '';
  return `${sign}${formatMileage(km, language, { maximumFractionDigits: 0 })}`;
}

export function formatDate(
  value: string | Date,
  language: string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(localeTag(language), options).format(date);
}

export function formatDateLong(value: string | Date, language: string): string {
  return formatDate(value, language, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatMonthShort(value: string | Date, language: string): string {
  return formatDate(value, language, { month: 'short' });
}

export function formatTime(value: string | Date, language: string): string {
  return formatDate(value, language, { hour: '2-digit', minute: '2-digit' });
}

/** Percentage for the expense breakdown, rounded to whole points. */
export function formatPercent(fraction: number, language: string): string {
  return new Intl.NumberFormat(localeTag(language), {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(fraction);
}

/** Cost per kilometre needs two decimals to be meaningful. */
export function formatCostPerKm(
  value: number,
  language: string,
  currency: string = DEFAULT_CURRENCY,
): string {
  const unit = language === 'bg' ? 'км' : 'km';
  return `${formatCurrency(value, language, currency, { maximumFractionDigits: 2 })}/${unit}`;
}

/** Initials for the vehicle avatar, e.g. `BMW 320d` → `BM`. */
export function vehicleInitials(make: string, model: string): string {
  const first = make.trim().charAt(0);
  const second = model.trim().charAt(0) || make.trim().charAt(1);
  return `${first}${second}`.toUpperCase();
}
