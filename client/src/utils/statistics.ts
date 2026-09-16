import type { CategoryTotal, Expense, Vehicle } from '@/types';
import { monthKey } from './date';

export interface VehicleStatistics {
  yearlyTotal: number;
  /** Averaged over months elapsed this year, not over 12. */
  monthlyAverage: number;
  /** Null when there is not enough mileage spread to divide by. */
  costPerKm: number | null;
  byCategory: CategoryTotal[];
  monthly: { key: string; value: number }[];
  hasData: boolean;
}

/** Totals per category for the given expenses, largest first. */
function totalsByCategory(expenses: Expense[]): CategoryTotal[] {
  const totals = new Map<CategoryTotal['category'], number>();

  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Distance the vehicle covered over the period the expenses span.
 *
 * Expenses carry the odometer reading at the time, so the spread between the
 * lowest and highest of those is the distance the money actually bought. Without
 * at least two readings there is nothing to divide by, and cost per km is left
 * null rather than invented from the current odometer.
 */
function distanceCovered(expenses: Expense[], vehicle: Vehicle): number | null {
  const readings = expenses
    .map((expense) => expense.mileageKm)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  const lowest = readings[0];
  if (lowest === undefined) return null;

  // The current odometer is the upper bound — it is never behind a past reading.
  const highest = Math.max(readings[readings.length - 1] ?? lowest, vehicle.odometerKm);
  const distance = highest - lowest;

  return distance > 0 ? distance : null;
}

/** Every month of the current year up to today, so gaps read as zero spend. */
function monthlySeries(expenses: Expense[], now: Date): { key: string; value: number }[] {
  const year = now.getFullYear();
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const key = monthKey(expense.date);
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }

  return Array.from({ length: now.getMonth() + 1 }, (_, month) => {
    const key = `${year}-${`${month + 1}`.padStart(2, '0')}`;
    return { key, value: totals.get(key) ?? 0 };
  });
}

export function computeStatistics(
  expenses: Expense[],
  vehicle: Vehicle,
  now: Date = new Date(),
): VehicleStatistics {
  const thisYear = expenses.filter(
    (expense) => new Date(expense.date).getFullYear() === now.getFullYear(),
  );

  const yearlyTotal = thisYear.reduce((sum, expense) => sum + expense.amount, 0);
  const monthsElapsed = now.getMonth() + 1;
  const distance = distanceCovered(expenses, vehicle);
  const allTimeTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    yearlyTotal,
    monthlyAverage: monthsElapsed > 0 ? yearlyTotal / monthsElapsed : 0,
    costPerKm: distance !== null && distance > 0 ? allTimeTotal / distance : null,
    byCategory: totalsByCategory(thisYear),
    monthly: monthlySeries(thisYear, now),
    hasData: expenses.length > 0,
  };
}
