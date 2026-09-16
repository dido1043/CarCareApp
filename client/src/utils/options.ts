import type { SelectOption } from '@/components/form';
import {
  DOCUMENT_TYPES,
  DocumentType,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  FUEL_TYPES,
  FuelType,
  MAINTENANCE_TYPES,
  MaintenanceType,
} from '@/types';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { DOCUMENT_ICONS, EXPENSE_ICONS, FUEL_ICONS, MAINTENANCE_ICONS } from './icons';

/**
 * Translated option lists for the select fields. Built through hooks so the
 * labels re-render when the language changes, rather than being frozen at
 * module load.
 */

export function useFuelTypeOptions(): SelectOption<FuelType>[] {
  const { t, i18n } = useTranslation();
  return useMemo(
    () =>
      FUEL_TYPES.map((value) => ({
        value,
        label: t(`fuelType.${value}`),
        icon: FUEL_ICONS[value],
      })),
    // `i18n.language` is the dependency that actually changes on a switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}

export function useMaintenanceTypeOptions(): SelectOption<MaintenanceType>[] {
  const { t, i18n } = useTranslation();
  return useMemo(
    () =>
      MAINTENANCE_TYPES.map((value) => ({
        value,
        label: t(`maintenanceType.${value}`),
        icon: MAINTENANCE_ICONS[value],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}

export function useExpenseCategoryOptions(): SelectOption<ExpenseCategory>[] {
  const { t, i18n } = useTranslation();
  return useMemo(
    () =>
      EXPENSE_CATEGORIES.map((value) => ({
        value,
        label: t(`expenseCategory.${value}`),
        icon: EXPENSE_ICONS[value],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}

export function useDocumentTypeOptions(): SelectOption<DocumentType>[] {
  const { t, i18n } = useTranslation();
  return useMemo(
    () =>
      DOCUMENT_TYPES.map((value) => ({
        value,
        label: t(`documentType.${value}`),
        icon: DOCUMENT_ICONS[value],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}

/** Currencies the picker offers. The API defaults to EUR. */
export const CURRENCY_OPTIONS: SelectOption<string>[] = [
  { value: 'EUR', label: 'EUR €' },
  { value: 'BGN', label: 'BGN лв' },
  { value: 'USD', label: 'USD $' },
  { value: 'GBP', label: 'GBP £' },
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  BGN: 'лв',
  USD: '$',
  GBP: '£',
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}
