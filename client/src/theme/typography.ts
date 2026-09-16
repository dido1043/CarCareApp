import { Platform, type TextStyle } from 'react-native';

/**
 * Inter, loaded at runtime. Weights are referenced by family name rather than
 * `fontWeight` because only the former is reliable across Android.
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_900Black',
} as const;

/**
 * Tabular figures keep mileage and money from jittering as values change.
 * iOS exposes this as a font variant; Android gets it through the feature tag.
 */
export const numericStyle: TextStyle = Platform.select({
  ios: { fontVariant: ['tabular-nums'] },
  default: { fontVariant: ['tabular-nums'] },
}) as TextStyle;

export const typography = {
  display: {
    fontFamily: fontFamily.black,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: fontFamily.semibold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 21,
  },
  secondary: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  /** Small all-caps label used for section headers and status chips. */
  overline: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
