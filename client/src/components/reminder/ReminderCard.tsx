import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { DocumentType, MaintenanceType, Reminder } from '@/types';
import { formatMileage } from '@/utils/format';
import { DOCUMENT_ICONS, MAINTENANCE_ICONS } from '@/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface ReminderCardProps {
  reminder: Reminder;
  onPress?: () => void;
}

const SEVERITY_COLORS: Record<Reminder['severity'], string> = {
  OVERDUE: colors.danger,
  DUE: colors.warning,
  UPCOMING: colors.textSecondary,
};

/** The one line that says how close the thing is. */
function useRemainingLabel(): (reminder: Reminder) => string {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (reminder) => {
    const parts: string[] = [];

    if (reminder.daysRemaining !== null) {
      parts.push(
        reminder.daysRemaining < 0
          ? t('reminders.daysOverdue', { count: Math.abs(reminder.daysRemaining) })
          : t('reminders.daysRemaining', { count: reminder.daysRemaining }),
      );
    }

    if (reminder.kmRemaining !== null) {
      parts.push(
        reminder.kmRemaining < 0
          ? t('maintenance.overdueByKm', {
              distance: formatMileage(Math.abs(reminder.kmRemaining), language),
            })
          : formatMileage(reminder.kmRemaining, language),
      );
    }

    return parts.join(' • ');
  };
}

export function ReminderCard({ reminder, onPress }: ReminderCardProps) {
  const { t } = useTranslation();
  const remaining = useRemainingLabel();
  const tint = SEVERITY_COLORS[reminder.severity];

  const icon =
    reminder.source === 'MAINTENANCE'
      ? MAINTENANCE_ICONS[reminder.kind as MaintenanceType]
      : DOCUMENT_ICONS[reminder.kind as DocumentType];

  return (
    <Card
      onPress={onPress}
      accentColor={reminder.severity === 'UPCOMING' ? undefined : tint}
      accessibilityLabel={`${reminder.title}. ${remaining(reminder)}`}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { borderColor: tint }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>

        <View style={styles.body}>
          <Text variant="cardTitle" numberOfLines={1}>
            {reminder.title}
          </Text>
          <Text variant="secondary" color={colors.textSecondary} numberOfLines={1}>
            {reminder.source === 'MAINTENANCE'
              ? t(`maintenanceType.${reminder.kind as MaintenanceType}`)
              : t(`documentType.${reminder.kind as DocumentType}`)}
          </Text>
        </View>

        <View style={styles.trailing}>
          {reminder.severity !== 'UPCOMING' ? (
            <Badge
              label={t(
                reminder.severity === 'OVERDUE'
                  ? 'reminders.overdue'
                  : 'reminders.dueSoon',
              )}
              tone={reminder.severity === 'OVERDUE' ? 'danger' : 'warning'}
              icon={reminder.severity === 'OVERDUE' ? 'alert-circle' : 'time'}
              size="sm"
            />
          ) : null}
          <Text variant="caption" color={tint} numberOfLines={1}>
            {remaining(reminder)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    maxWidth: 130,
  },
});
