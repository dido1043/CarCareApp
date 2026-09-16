import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

export type BadgeTone = 'neutral' | 'danger' | 'warning' | 'success' | 'brand';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /**
   * Status must not be carried by colour alone, so tones that mean something
   * pair the fill with an icon.
   */
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
}

const TONES: Record<BadgeTone, { background: string; foreground: string }> = {
  neutral: { background: colors.infoSoft, foreground: colors.textSecondary },
  danger: { background: colors.dangerSoft, foreground: colors.danger },
  warning: { background: colors.warningSoft, foreground: colors.warning },
  success: { background: colors.successSoft, foreground: colors.success },
  brand: { background: colors.primarySoft, foreground: colors.primary },
};

export function Badge({ label, tone = 'neutral', icon, size = 'md' }: BadgeProps) {
  const palette = TONES[tone];

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.small : styles.medium,
        { backgroundColor: palette.background },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={size === 'sm' ? 10 : 12} color={palette.foreground} />
      ) : null}
      <Text variant="caption" color={palette.foreground} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.sm,
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
});
