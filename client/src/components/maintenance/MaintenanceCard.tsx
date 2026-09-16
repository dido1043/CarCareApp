import { Card } from '@/components/ui/Card';
import { MaintenanceStatusBadge } from '@/components/ui/StatusBadge';
import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { MaintenanceRecord } from '@/types';
import { formatCurrency, formatDate, formatMileage } from '@/utils/format';
import { MAINTENANCE_ICONS } from '@/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useMaintenanceDueLabel } from './useMaintenanceDue';

interface MaintenanceCardProps {
  record: MaintenanceRecord;
  onPress?: () => void;
  currentMileageKm: number;
  /** Upcoming cards lead with the due line; history cards lead with the date. */
  mode?: 'history' | 'upcoming';
}

export function MaintenanceCard({
  record,
  onPress,
  currentMileageKm,
  mode = 'history',
}: MaintenanceCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const dueLabel = useMaintenanceDueLabel();

  const due = dueLabel(record, currentMileageKm);
  const isUpcoming = mode === 'upcoming';
  const accent =
    record.status === 'OVERDUE'
      ? colors.danger
      : record.status === 'DUE'
        ? colors.warning
        : undefined;

  return (
    <Card
      onPress={onPress}
      accentColor={isUpcoming ? accent : undefined}
      accessibilityLabel={record.title}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={MAINTENANCE_ICONS[record.type]}
            size={18}
            color={accent ?? colors.textSecondary}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text variant="cardTitle" numberOfLines={1} style={styles.title}>
              {record.title}
            </Text>
            {record.cost !== null ? (
              <Text variant="cardTitle" numeric>
                {formatCurrency(record.cost, language)}
              </Text>
            ) : null}
          </View>

          <Text variant="secondary" color={colors.textSecondary} numberOfLines={1}>
            {t(`maintenanceType.${record.type}`)}
            {' • '}
            {formatDate(record.date, language)}
            {record.mileageKm !== null
              ? ` • ${formatMileage(record.mileageKm, language)}`
              : ''}
          </Text>

          {isUpcoming && due ? (
            <View style={styles.dueRow}>
              {record.status ? (
                <MaintenanceStatusBadge status={record.status} size="sm" />
              ) : null}
              <Text variant="caption" color={accent ?? colors.textSecondary}>
                {due}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
});
