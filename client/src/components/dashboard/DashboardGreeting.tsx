import { AppLogo } from '@/components/brand';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

interface DashboardGreetingProps {
  onOpenSettings: () => void;
  onOpenReminders: () => void;
  /** Open reminders, shown as a red dot on the bell. */
  reminderCount: number;
}

/** Time-of-day greeting from the device clock. */
function greetingKey(hour: number): string {
  if (hour < 12) return 'dashboard.greetingMorning';
  if (hour < 18) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

export function DashboardGreeting({
  onOpenSettings,
  onOpenReminders,
  reminderCount,
}: DashboardGreetingProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AppLogo size="sm" />

        <View style={styles.actions}>
          <Pressable
            onPress={onOpenReminders}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.openReminders')}
            accessibilityValue={{ text: String(reminderCount) }}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
            {reminderCount > 0 ? <View style={styles.dot} /> : null}
          </Pressable>

          <Pressable
            onPress={onOpenSettings}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.openSettings')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="settings-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <Text variant="body" color={colors.textSecondary}>
        {t(greetingKey(new Date().getHours()))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  pressed: {
    opacity: 0.6,
  },
});
