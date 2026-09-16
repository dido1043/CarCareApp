import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { CategoryTotal, ExpenseTotals } from '@/types';
import { formatCurrency, formatCurrencyCompact } from '@/utils/format';
import { EXPENSE_ICONS } from '@/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface ExpenseSummaryProps {
  totals: ExpenseTotals;
  currency: string;
  /** How many category rows to show under the headline figure. */
  categoryLimit?: number;
}

/**
 * This month's spend as the headline, with the year beside it and the biggest
 * categories broken out underneath. The proportion bars are drawn relative to
 * the largest category, so the shape of the spending is readable at a glance.
 */
export function ExpenseSummary({
  totals,
  currency,
  categoryLimit = 3,
}: ExpenseSummaryProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const categories = totals.byCategory.slice(0, categoryLimit);
  const largest = categories[0]?.total ?? 0;

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headline}>
          <Text variant="overline" color={colors.textSecondary}>
            {t('dashboard.thisMonth')}
          </Text>
          <Text
            variant="display"
            numeric
            color={colors.primary}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {formatCurrencyCompact(totals.currentMonth, language, currency)}
          </Text>
        </View>

        <View style={styles.yearly}>
          <Text variant="overline" color={colors.textSecondary}>
            {t('dashboard.yearly')}
          </Text>
          <Text variant="heading" numeric numberOfLines={1}>
            {formatCurrencyCompact(totals.currentYear, language, currency)}
          </Text>
        </View>
      </View>

      {categories.length > 0 ? (
        <View style={styles.categories}>
          {categories.map((category) => (
            <CategoryRow
              key={category.category}
              category={category}
              currency={currency}
              largest={largest}
            />
          ))}
        </View>
      ) : (
        <Text variant="secondary" color={colors.textTertiary} style={styles.empty}>
          {t('dashboard.noExpensesYet')}
        </Text>
      )}
    </Card>
  );
}

function CategoryRow({
  category,
  currency,
  largest,
}: {
  category: CategoryTotal;
  currency: string;
  largest: number;
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const fraction = largest > 0 ? category.total / largest : 0;

  return (
    <View style={styles.categoryRow}>
      <Ionicons
        name={EXPENSE_ICONS[category.category]}
        size={15}
        color={colors.textSecondary}
      />
      <View style={styles.categoryBody}>
        <View style={styles.categoryLabels}>
          <Text variant="secondary" color={colors.textSecondary} numberOfLines={1}>
            {t(`expenseCategory.${category.category}`)}
          </Text>
          <Text variant="bodyMedium" numeric>
            {formatCurrency(category.total, language, currency)}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(fraction * 100, 2)}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headline: {
    flex: 1,
    gap: spacing.xs,
  },
  yearly: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  categories: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryBody: {
    flex: 1,
    gap: spacing.xs,
  },
  categoryLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  track: {
    height: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.cardElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  empty: {
    marginTop: spacing.lg,
  },
});
