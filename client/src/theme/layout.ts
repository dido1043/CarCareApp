/** Four-point spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Corners stay tight — the brief calls for angular and technical, so cards get
 * a hint of a radius rather than the pill shapes of a consumer SaaS app.
 */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/** Minimum tappable size, per the platform accessibility guidelines. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH_SIZE = 44;

export const screenPadding = spacing.xl;
