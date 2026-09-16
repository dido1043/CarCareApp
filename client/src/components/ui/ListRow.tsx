import { colors, MIN_TOUCH_SIZE, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';

interface ListRowProps {
  label: string;
  value?: string;
  /** Rendered instead of `value`, for badges or custom trailing content. */
  trailing?: ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  destructive?: boolean;
  accessibilityHint?: string;
}

/** Settings-style row: label on the left, value or control on the right. */
export function ListRow({
  label,
  value,
  trailing,
  icon,
  iconColor,
  onPress,
  destructive = false,
  accessibilityHint,
}: ListRowProps) {
  const labelColor = destructive ? colors.primary : colors.text;

  const content = (
    <>
      {icon ? (
        <View style={styles.iconWrap}>
          <Ionicons
            name={icon}
            size={17}
            color={iconColor ?? (destructive ? colors.primary : colors.textSecondary)}
          />
        </View>
      ) : null}

      <Text
        variant="bodyMedium"
        color={labelColor}
        style={styles.label}
        numberOfLines={1}
      >
        {label}
      </Text>

      {trailing ??
        (value ? (
          <Text variant="body" color={colors.textSecondary} numberOfLines={1}>
            {value}
          </Text>
        ) : null)}

      {onPress && !trailing ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_SIZE + 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
  },
  label: {
    flex: 1,
  },
  pressed: {
    backgroundColor: colors.cardElevated,
  },
});
