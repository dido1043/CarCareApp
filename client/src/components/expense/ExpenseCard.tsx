import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { Expense } from '@/types';
import { formatCurrency, formatDate, formatMileage } from '@/utils/format';
import { EXPENSE_ICONS } from '@/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
}

/**
 * A row in the expense ledger. Expenses are read in bulk, so this is a dense
 * row rather than a card — the amount sits right-aligned in a tabular figure so
 * a column of them lines up.
 */
export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const secondary = [
    formatDate(expense.date, language),
    expense.mileageKm !== null ? formatMileage(expense.mileageKm, language) : null,
    expense.description,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${t(`expenseCategory.${expense.category}`)} ${formatCurrency(
        expense.amount,
        language,
        expense.currency,
      )}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={EXPENSE_ICONS[expense.category]}
          size={17}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.body}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {t(`expenseCategory.${expense.category}`)}
        </Text>
        <Text variant="secondary" color={colors.textSecondary} numberOfLines={1}>
          {secondary}
        </Text>
      </View>

      <Text variant="cardTitle" numeric>
        {formatCurrency(expense.amount, language, expense.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.cardElevated,
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
    gap: 1,
  },
});
