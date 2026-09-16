import { ScreenHeader } from '@/components/brand';
import { ExpenseCard, ExpenseSummary } from '@/components/expense';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  SkeletonList,
  Text,
  VehicleScopeNotice,
} from '@/components/ui';
import { useExpenseTotals, useExpenses, useSelectedVehicle } from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing } from '@/theme';
import type { Expense } from '@/types';
import { formatDate } from '@/utils/format';
import { useRouter } from 'expo-router';
import { Fragment, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/** Groups the ledger by day, which is how a fill-up history is actually read. */
function groupByDay(expenses: Expense[]): { date: string; items: Expense[] }[] {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const key = expense.date.slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), expense]);
  }

  return [...groups.entries()]
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export default function ExpensesScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();

  const { vehicle, vehicles, vehicleId } = useSelectedVehicle();
  const { data: expenses, isLoading, isError, error, refetch } = useExpenses(vehicleId);
  const { data: totals } = useExpenseTotals(vehicleId);

  const grouped = useMemo(() => groupByDay(expenses ?? []), [expenses]);
  const currency = expenses?.[0]?.currency ?? 'EUR';

  return (
    <>
      <ScreenHeader
        title={t('expenses.title')}
        showBack={false}
        subtitle={
          vehicle && vehicles.length > 1 ? `${vehicle.make} ${vehicle.model}` : undefined
        }
      />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {!vehicle && !isLoading ? (
            <EmptyState
              icon="car-sport-outline"
              title={t('vehicle.empty')}
              body={t('vehicle.emptyBody')}
              actionLabel={t('vehicle.add')}
              onAction={() => router.push('/vehicle/create')}
            />
          ) : null}

          {vehicle && totals ? (
            <ExpenseSummary totals={totals} currency={currency} categoryLimit={4} />
          ) : null}

          {isLoading ? <SkeletonList count={3} /> : null}

          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {vehicle && !isLoading && !isError && grouped.length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title={t('expenses.empty')}
              body={t('expenses.emptyBody')}
              actionLabel={t('expenses.add')}
              onAction={() => router.push('/expenses/create')}
            />
          ) : null}

          {grouped.length > 0 ? (
            <View>
              <SectionHeader title={t('expenses.history')} />
              <View style={styles.groups}>
                {grouped.map((group) => (
                  <View key={group.date}>
                    <Text
                      variant="caption"
                      color={colors.textTertiary}
                      style={styles.dayLabel}
                    >
                      {formatDate(group.date, language).toUpperCase()}
                    </Text>
                    <Card padded={false}>
                      {group.items.map((expense, index) => (
                        <Fragment key={expense.id}>
                          {index > 0 ? <Divider inset /> : null}
                          <ExpenseCard
                            expense={expense}
                            onPress={() => router.push(`/expenses/${expense.id}`)}
                          />
                        </Fragment>
                      ))}
                    </Card>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {vehicle ? (
            <Button
              label={t('expenses.add')}
              icon="add"
              onPress={() => router.push('/expenses/create')}
            />
          ) : null}

          {vehicle && vehicles.length > 1 ? (
            <VehicleScopeNotice vehicleName={`${vehicle.make} ${vehicle.model}`} />
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
  groups: {
    gap: spacing.lg,
  },
  dayLabel: {
    marginBottom: spacing.sm,
  },
});
