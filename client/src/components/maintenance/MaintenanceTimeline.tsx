import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { MaintenanceRecord } from '@/types';
import { formatCurrency, formatDate, formatMileage } from '@/utils/format';
import { MAINTENANCE_ICONS } from '@/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

interface MaintenanceTimelineProps {
  records: MaintenanceRecord[];
  onSelect: (record: MaintenanceRecord) => void;
}

/**
 * Service history as a vertical timeline. The connecting rule is what makes a
 * list of dates read as the life of one car rather than as unrelated rows.
 */
export function MaintenanceTimeline({ records, onSelect }: MaintenanceTimelineProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <View>
      {records.map((record, index) => {
        const isLast = index === records.length - 1;

        return (
          <Fragment key={record.id}>
            <Pressable
              onPress={() => onSelect(record)}
              accessibilityRole="button"
              accessibilityLabel={record.title}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.gutter}>
                <View style={styles.node}>
                  <Ionicons
                    name={MAINTENANCE_ICONS[record.type]}
                    size={15}
                    color={colors.primary}
                  />
                </View>
                {!isLast ? <View style={styles.connector} /> : null}
              </View>

              <View style={[styles.content, isLast && styles.contentLast]}>
                <Text variant="caption" color={colors.textSecondary}>
                  {formatDate(record.date, language).toUpperCase()}
                </Text>

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
                  {record.mileageKm !== null
                    ? ` • ${formatMileage(record.mileageKm, language)}`
                    : ''}
                </Text>
              </View>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  pressed: {
    opacity: 0.6,
  },
  gutter: {
    alignItems: 'center',
    width: 32,
  },
  node: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
  connector: {
    flex: 1,
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  content: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.xxl,
  },
  contentLast: {
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: 2,
  },
  title: {
    flex: 1,
  },
});
