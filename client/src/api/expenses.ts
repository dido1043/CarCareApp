import type {
  CreateExpenseInput,
  Expense,
  ExpenseTotals,
  UpdateExpenseInput,
} from '@/types';
import { apiClient } from './client';

export const expensesApi = {
  list: (vehicleId: string, signal?: AbortSignal) =>
    apiClient.get<Expense[]>(`/vehicles/${vehicleId}/expenses`, { signal }),

  /** Month and year totals, summed by PostgreSQL over exact decimals. */
  totals: (vehicleId: string, signal?: AbortSignal) =>
    apiClient.get<ExpenseTotals>(`/vehicles/${vehicleId}/expenses/totals`, { signal }),

  get: (vehicleId: string, expenseId: string, signal?: AbortSignal) =>
    apiClient.get<Expense>(`/vehicles/${vehicleId}/expenses/${expenseId}`, { signal }),

  create: (vehicleId: string, input: CreateExpenseInput) =>
    apiClient.post<Expense>(`/vehicles/${vehicleId}/expenses`, input),

  update: (vehicleId: string, expenseId: string, input: UpdateExpenseInput) =>
    apiClient.patch<Expense>(`/vehicles/${vehicleId}/expenses/${expenseId}`, input),

  remove: (vehicleId: string, expenseId: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/expenses/${expenseId}`),
};
