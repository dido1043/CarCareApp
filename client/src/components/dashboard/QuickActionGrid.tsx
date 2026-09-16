import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

export interface GridAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  /** Count shown as a red pill, e.g. the number of open reminders. */
  badge?: number;
}

/**
 * The vehicle detail screen's navigation grid. Wraps to two columns on a narrow
 * phone and three on a wide one, without measuring the screen.
 */
export function QuickActionGrid({ actions }: { actions: GridAction[] }) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.iconRow}>
            <Ionicons name={action.icon} size={19} color={colors.primary} />
            {action.badge && action.badge > 0 ? (
              <View style={styles.badge}>
                <Text variant="caption" color={colors.text} numeric>
                  {action.badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="bodyMedium" numberOfLines={1}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 104,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
