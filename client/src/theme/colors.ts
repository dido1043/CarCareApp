/**
 * The CarCare palette. Black is the surface, white is the content, red is
 * reserved for brand identity and things that need the driver's attention —
 * it stops meaning "important" the moment it is used for decoration.
 */
export const colors = {
  /** Page background. */
  background: '#000000',
  /** Raised surfaces: headers, tab bar, sheets. */
  surface: '#0B0B0D',
  /** Cards sitting on the background. */
  card: '#141416',
  /** Cards sitting on a card. */
  cardElevated: '#1C1C1F',

  /** Brand red — primary actions, active state, urgent status. */
  primary: '#FF1F2D',
  /** Pressed state and heavy red fills. */
  primaryDark: '#A9000B',
  /** Red at low opacity, for tinted backgrounds. */
  primarySoft: 'rgba(255, 31, 45, 0.12)',
  /** Red at medium opacity, for tinted borders. */
  primaryBorder: 'rgba(255, 31, 45, 0.35)',

  text: '#FFFFFF',
  textSecondary: '#A5A5A5',
  textTertiary: '#6E6E73',
  textInverse: '#000000',

  border: '#262626',
  borderStrong: '#3A3A3D',

  /** Status colours. Green is the one non-brand hue, kept desaturated. */
  success: '#3ECF8E',
  successSoft: 'rgba(62, 207, 142, 0.12)',
  warning: '#FF7A1A',
  warningSoft: 'rgba(255, 122, 26, 0.12)',
  danger: '#FF1F2D',
  dangerSoft: 'rgba(255, 31, 45, 0.12)',
  info: '#A5A5A5',
  infoSoft: 'rgba(165, 165, 165, 0.12)',

  overlay: 'rgba(0, 0, 0, 0.72)',
  skeleton: '#1C1C1F',
  skeletonHighlight: '#262629',
} as const;

export type ColorName = keyof typeof colors;
