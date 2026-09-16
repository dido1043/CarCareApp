import { colors, spacing } from '@/theme';
import { Pressable, StyleSheet, View } from 'react-native';
import { RedAccent } from './RedAccent';
import { Text } from './Text';

interface SectionHeaderProps {
  title: string;
  /** Optional trailing link, e.g. "View all". */
  actionLabel?: string;
  onAction?: () => void;
  /** Red accent marks the sections that carry urgency. */
  accent?: boolean;
  accentColor?: string;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  accent = true,
  accentColor,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleGroup}>
        {accent ? (
          <RedAccent orientation="vertical" length={14} color={accentColor} />
        ) : null}
        <Text variant="overline" color={colors.textSecondary}>
          {title}
        </Text>
      </View>

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text variant="caption" color={colors.primary}>
            {actionLabel.toUpperCase()}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  pressed: { opacity: 0.6 },
});
