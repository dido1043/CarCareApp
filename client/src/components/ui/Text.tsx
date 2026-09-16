import { colors, numericStyle, typography, type TypographyVariant } from '@/theme';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  /** Tabular figures, so changing numbers don't shift the layout. */
  numeric?: boolean;
  align?: TextStyle['textAlign'];
}

/**
 * The only text primitive in the app. Going through it is what keeps the type
 * scale and the palette consistent instead of re-declared per screen.
 */
export function Text({
  variant = 'body',
  color = colors.text,
  numeric = false,
  align,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color },
        numeric ? numericStyle : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
