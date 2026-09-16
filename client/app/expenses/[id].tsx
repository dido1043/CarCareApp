import { HeaderIconButton, ScreenHeader } from '@/components/brand';
import { ExpenseForm } from '@/components/expense';
import {
  Button,
  Card,
  Divider,
  ErrorState,
  ListRow,
  Screen,
  SectionHeader,
  SkeletonCard,
  Text,
  useConfirm,
} from '@/components/ui';
import {
  useDeleteExpense,
  useExpense,
  useSelectedVehicle,
  useUpdateExpense,
} from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, spacing } from '@/theme';
import { formatCurrency, formatDate, formatMileage } from '@/utils/format';
import { EXPENSE_ICONS } from '@/utils/icons';
import { toExpenseUpdatePayload } from '@/utils/payload';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export default function ExpenseDetailScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const confirm = useConfirm();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editing, setEditing] = useState(false);

  const { vehicleId } = useSelectedVehicle();
  const { data: expense, isLoading, isError, error, refetch } = useExpense(vehicleId, id);
  const updateExpense = useUpdateExpense(vehicleId ?? '', id);
  const deleteExpense = useDeleteExpense(vehicleId ?? '');

  const onDelete = async (): Promise<void> => {
    if (!expense) return;
    const confirmed = await confirm({
      title: t('expenses.deleteTitle'),
      message: t('expenses.deleteMessage', {
        amount: formatCurrency(expense.amount, language, expense.currency),
        date: formatDate(expense.date, language),
      }),
    });
    if (!confirmed) return;

    await deleteExpense.mutateAsync(expense.id);
    router.back();
  };

  if (editing && expense) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title={t('expenses.editTitle')} onBack={() => setEditing(false)} />
        <ExpenseForm
          expense={expense}
          submitLabel={t('common.save')}
          onSubmit={async (values) => {
            await updateExpense.mutateAsync(toExpenseUpdatePayload(values));
            setEditing(false);
          }}
          secondaryAction={
            <Button
              label={t('common.delete')}
              variant="danger"
              icon="trash-outline"
              onPress={() => void onDelete()}
            />
          }
        />
      </View>
    );
  }

  const details = expense
    ? [
        {
          label: t('expenses.category'),
          value: t(`expenseCategory.${expense.category}`),
        },
        { label: t('expenses.date'), value: formatDate(expense.date, language) },
        {
          label: t('expenses.mileage'),
          value:
            expense.mileageKm !== null
              ? formatMileage(expense.mileageKm, language)
              : t('common.notSet'),
        },
        { label: t('expenses.currency'), value: expense.currency },
      ]
    : [];

  return (
    <>
      <ScreenHeader
        title={t('expenses.detailTitle')}
        actions={
          expense ? (
            <>
              <HeaderIconButton
                icon="create-outline"
                label={t('common.edit')}
                onPress={() => setEditing(true)}
              />
              <HeaderIconButton
                icon="trash-outline"
                label={t('common.delete')}
                tone="danger"
                onPress={() => void onDelete()}
              />
            </>
          ) : null
        }
      />

      <Screen onRefresh={refetch} bottomInset={spacing.xxl}>
        <View style={styles.content}>
          {isLoading ? <SkeletonCard lines={3} /> : null}
          {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

          {expense ? (
            <>
              <Card>
                <View style={styles.hero}>
                  <View style={styles.heroIcon}>
                    <Ionicons
                      name={EXPENSE_ICONS[expense.category]}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.heroBody}>
                    <Text variant="overline" color={colors.textSecondary}>
                      {t(`expenseCategory.${expense.category}`)}
                    </Text>
                    <Text
                      variant="display"
                      numeric
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {formatCurrency(expense.amount, language, expense.currency)}
                    </Text>
                  </View>
                </View>
              </Card>

              <View>
                <SectionHeader title={t('vehicle.details')} />
                <Card padded={false}>
                  {details.map((detail, index) => (
                    <Fragment key={detail.label}>
                      {index > 0 ? <Divider /> : null}
                      <ListRow label={detail.label} value={detail.value} />
                    </Fragment>
                  ))}
                </Card>
              </View>

              {expense.description ? (
                <View>
                  <SectionHeader title={t('expenses.description')} />
                  <Card>
                    <Text variant="body" color={colors.textSecondary}>
                      {expense.description}
                    </Text>
                  </Card>
                </View>
              ) : null}
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
  heroBody: {
    flex: 1,
    gap: 2,
  },
});
