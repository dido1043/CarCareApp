import { expensesApi } from '@/api/expenses';
import type { CreateExpenseInput, UpdateExpenseInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export function useExpenses(vehicleId: string | null) {
  return useQuery({
    queryKey: queryKeys.expenses(vehicleId ?? 'none'),
    queryFn: ({ signal }) => expensesApi.list(vehicleId as string, signal),
    enabled: Boolean(vehicleId),
  });
}

export function useExpense(vehicleId: string | null, expenseId: string | null) {
  return useQuery({
    queryKey: queryKeys.expense(vehicleId ?? 'none', expenseId ?? 'none'),
    queryFn: ({ signal }) =>
      expensesApi.get(vehicleId as string, expenseId as string, signal),
    enabled: Boolean(vehicleId && expenseId),
  });
}

export function useExpenseTotals(vehicleId: string | null) {
  return useQuery({
    queryKey: queryKeys.expenseTotals(vehicleId ?? 'none'),
    queryFn: ({ signal }) => expensesApi.totals(vehicleId as string, signal),
    enabled: Boolean(vehicleId),
  });
}

/** Any change to an expense moves the totals and the dashboard along with it. */
function useInvalidateExpenseData(vehicleId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicle(vehicleId) });
}

export function useCreateExpense(vehicleId: string) {
  const invalidate = useInvalidateExpenseData(vehicleId);

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expensesApi.create(vehicleId, input),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateExpense(vehicleId: string, expenseId: string) {
  const invalidate = useInvalidateExpenseData(vehicleId);

  return useMutation({
    mutationFn: (input: UpdateExpenseInput) =>
      expensesApi.update(vehicleId, expenseId, input),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteExpense(vehicleId: string) {
  const invalidate = useInvalidateExpenseData(vehicleId);

  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.remove(vehicleId, expenseId),
    onSuccess: () => void invalidate(),
  });
}
