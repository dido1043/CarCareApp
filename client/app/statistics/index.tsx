import { ScreenHeader } from '@/components/brand';
import {
  ExpenseBreakdown,
  MonthlyBarChart,
  type MonthlyPoint,
} from '@/components/statistics';
import {
  Card,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  SkeletonCard,
  StatTile,
  Text,
} from '@/components/ui';
import { useExpenses, useSelectedVehicle } from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing } from '@/theme';
import { formatCostPerKm, formatCurrencyCompact, formatMonthShort } from '@/utils/format';
import { computeStatistics } from '@/utils/statistics';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * What the car costs, over the year.
 *
 * Every figure is derived from the expense list the API already returns — the
 * headline numbers are stat tiles rather than charts, because a single value
 * has no shape worth plotting.
 */
export default function StatisticsScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();

  const { vehicle, vehicleId } = useSelectedVehicle();
  const { data: expenses, isLoading, isError, error, refetch } = useExpenses(vehicleId);

  const stats = useMemo(
    () => (vehicle ? computeStatistics(expenses ?? [], vehicle) : null),
    [expenses, vehicle],
  );

  const currency = expenses?.[0]?.currency ?? 'EUR';

  const monthly: MonthlyPoint[] = useMemo(
    () =>
      (stats?.monthly ?? []).map((point) => ({
        key: point.key,
        // `YYYY-MM` needs a day to parse reliably across engines.
        label: formatMonthShort(`${point.key}-01`, language),
        value: point.value,
      })),
    [stats?.monthly, language],
  );

  return (
    <>
      <ScreenHeader
        title={t('statistics.title')}
        subtitle={vehicle ? `${vehicle.make} ${vehicle.model}` : undefined}
      />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {isLoading ? <SkeletonCard lines={4} /> : null}
          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {stats && !stats.hasData && !isLoading ? (
            <EmptyState
              icon="stats-chart-outline"
              title={t('statistics.empty')}
              body={t('statistics.emptyBody')}
              actionLabel={t('expenses.add')}
              onAction={() => router.push('/expenses/create')}
            />
          ) : null}

          {stats?.hasData ? (
            <>
              <View style={styles.tiles}>
                <StatTile
                  label={t('statistics.yearlyTotal')}
                  value={formatCurrencyCompact(stats.yearlyTotal, language, currency)}
                  emphasis
                />
                <StatTile
                  label={t('statistics.monthlyAverage')}
                  value={formatCurrencyCompact(stats.monthlyAverage, language, currency)}
                />
              </View>

              <StatTile
                label={t('statistics.costPerKm')}
                value={
                  stats.costPerKm !== null
                    ? formatCostPerKm(stats.costPerKm, language, currency)
                    : '—'
                }
                hint={
                  stats.costPerKm !== null
                    ? t('statistics.costPerKmHint')
                    : t('statistics.noMileageData')
                }
              />

              <View>
                <SectionHeader title={t('statistics.monthlySpending')} />
                <Card>
                  <MonthlyBarChart data={monthly} currency={currency} />
                </Card>
              </View>

              <View>
                <SectionHeader title={t('statistics.breakdown')} />
                <Card>
                  {stats.byCategory.length > 0 ? (
                    <ExpenseBreakdown
                      categories={stats.byCategory}
                      total={stats.yearlyTotal}
                      currency={currency}
                    />
                  ) : (
                    <Text variant="secondary" color={colors.textSecondary}>
                      {t('expenses.noBreakdown')}
                    </Text>
                  )}
                </Card>
              </View>
            </>
          ) : null}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
