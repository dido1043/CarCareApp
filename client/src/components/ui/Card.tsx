import { colors, radius, spacing } from '@/theme';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** `elevated` sits on top of another card; `outlined` drops the fill. */
  variant?: 'default' | 'elevated' | 'outlined';
  /** Red rule down the leading edge, for cards that need attention. */
  accentColor?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * The dark surface everything sits on. Cards are bordered rather than shadowed —
 * on a black background a shadow is invisible, and a 1px border is what gives
 * the interface its technical, instrument-panel feel.
 */
export function Card({
  children,
  onPress,
  variant = 'default',
  accentColor,
  padded = true,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const content = (
    <>
      {accentColor ? (
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={padded ? styles.padding : undefined}>{children}</View>
    </>
  );

  const containerStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    accentColor ? styles.withAccent : null,
    style,
  ];

  if (!onPress) {
    return <View style={containerStyle}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.cardElevated,
  },
  outlined: {
    backgroundColor: 'transparent',
  },
  withAccent: {
    // Room for the 3px rule pinned to the leading edge.
    paddingLeft: 3,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  padding: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.75,
  },
});
