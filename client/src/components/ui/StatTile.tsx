import { colors, radius, spacing } from '@/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  /** Draws the value in brand red — for the one number that matters most. */
  emphasis?: boolean;
}

/** A single figure with its label. Used in rows of two or three. */
export function StatTile({ label, value, hint, emphasis = false }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text variant="overline" color={colors.textSecondary} numberOfLines={1}>
        {label}
      </Text>
      <Text
        variant="title"
        color={emphasis ? colors.primary : colors.text}
        numeric
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        style={styles.value}
      >
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color={colors.textTertiary} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  value: {
    marginTop: spacing.xs,
  },
});
