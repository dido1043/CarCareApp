import { Text } from '@/components/ui/Text';
import { useLanguage } from '@/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import type { CategoryTotal } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/format';
import { EXPENSE_ICONS } from '@/utils/icons';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface ExpenseBreakdownProps {
  categories: CategoryTotal[];
  total: number;
  currency: string;
}

/**
 * Where the money went, ranked.
 *
 * Ranked bars rather than a pie: the question is "which is biggest, and by how
 * much", which lengths on a shared baseline answer and angles do not. Every row
 * is directly labelled with its name, amount and share, so nothing depends on
 * matching a colour to a legend.
 */
export function ExpenseBreakdown({ categories, total, currency }: ExpenseBreakdownProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <View style={styles.list}>
      {categories.map((entry) => {
        const share = total > 0 ? entry.total / total : 0;

        return (
          <View
            key={entry.category}
            style={styles.row}
            accessible
            accessibilityLabel={`${t(`expenseCategory.${entry.category}`)}: ${formatCurrency(
              entry.total,
              language,
              currency,
            )}, ${formatPercent(share, language)}`}
          >
            <View style={styles.header}>
              <Ionicons
                name={EXPENSE_ICONS[entry.category]}
                size={15}
                color={colors.textSecondary}
              />
              <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
                {t(`expenseCategory.${entry.category}`)}
              </Text>
              <Text variant="bodyMedium" numeric color={colors.textSecondary}>
                {formatPercent(share, language)}
              </Text>
              <Text variant="bodyMedium" numeric style={styles.amount}>
                {formatCurrency(entry.total, language, currency)}
              </Text>
            </View>

            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(share * 100, 1)}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  row: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
  amount: {
    minWidth: 68,
    textAlign: 'right',
  },
  track: {
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.cardElevated,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
});
