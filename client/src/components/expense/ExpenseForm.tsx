import {
  DateField,
  FormScreen,
  FormSection,
  NumberField,
  SelectField,
  TextField,
} from '@/components/form';
import { Text, useErrorMessage } from '@/components/ui';
import { useDefaultCurrency } from '@/store/preferences';
import { colors, spacing } from '@/theme';
import type { Expense } from '@/types';
import { fromApiDate } from '@/utils/date';
import {
  CURRENCY_OPTIONS,
  currencySymbol,
  useExpenseCategoryOptions,
} from '@/utils/options';
import {
  expenseSchema,
  type ExpenseFormInput,
  type ExpenseFormOutput,
} from '@/validation/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface ExpenseFormProps {
  expense?: Expense;
  currentMileageKm?: number;
  onSubmit: (values: ExpenseFormOutput) => Promise<void>;
  submitLabel: string;
  secondaryAction?: ReactNode;
}

/**
 * Adding an expense is the app's most repeated action, so the form defaults
 * everything it can — today's date, the current odometer, the last currency —
 * leaving category and amount as the only required taps.
 */
export function ExpenseForm({
  expense,
  currentMileageKm,
  onSubmit,
  submitLabel,
  secondaryAction,
}: ExpenseFormProps) {
  const { t } = useTranslation();
  const categories = useExpenseCategoryOptions();
  const defaultCurrency = useDefaultCurrency();
  const toMessage = useErrorMessage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(() => expenseSchema(t), [t]);
  const { control, handleSubmit, formState } = useForm<
    ExpenseFormInput,
    unknown,
    ExpenseFormOutput
  >({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      category: expense?.category,
      amount: expense ? String(expense.amount) : '',
      currency: expense?.currency ?? defaultCurrency,
      date: expense ? fromApiDate(expense.date) : new Date(),
      mileageKm:
        expense?.mileageKm !== undefined && expense.mileageKm !== null
          ? String(expense.mileageKm)
          : currentMileageKm !== undefined
            ? String(Math.round(currentMileageKm))
            : '',
      description: expense?.description ?? '',
    },
  });

  // The amount field's prefix follows the currency the user picked.
  const currency = useWatch({ control, name: 'currency' });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(toMessage(error));
    }
  });

  return (
    <FormScreen
      submitLabel={submitLabel}
      onSubmit={() => void submit()}
      isSubmitting={formState.isSubmitting}
      secondaryAction={secondaryAction}
    >
      <FormSection>
        <SelectField
          control={control}
          name="category"
          label={t('expenses.category')}
          options={categories}
          placeholder={t('common.select')}
        />
        <NumberField
          control={control}
          name="amount"
          label={t('expenses.amount')}
          placeholder="0.00"
          prefix={currencySymbol(currency ?? defaultCurrency)}
        />
        <SelectField
          control={control}
          name="currency"
          label={t('expenses.currency')}
          options={CURRENCY_OPTIONS}
          placeholder={t('common.select')}
        />
        <DateField
          control={control}
          name="date"
          label={t('expenses.date')}
          maximumDate={new Date()}
        />
        <NumberField
          control={control}
          name="mileageKm"
          label={t('expenses.mileage')}
          placeholder="145320"
          suffix={t('common.km')}
          optional
        />
        <TextField
          control={control}
          name="description"
          label={t('expenses.description')}
          placeholder={t('expenses.descriptionPlaceholder')}
          optional
        />
      </FormSection>

      {submitError ? (
        <View style={styles.errorBox}>
          <Text variant="secondary" color={colors.primary}>
            {submitError}
          </Text>
        </View>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    padding: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
});
