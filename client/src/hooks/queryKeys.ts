/**
 * Every cache key in one place, built as prefixes so a mutation can invalidate
 * a whole vehicle's data (`keys.vehicle(id)`) or just one list.
 */
export const queryKeys = {
  me: ['me'] as const,
  vehicles: ['vehicles'] as const,
  vehicle: (vehicleId: string) => ['vehicles', vehicleId] as const,
  dashboard: (vehicleId: string) => ['vehicles', vehicleId, 'dashboard'] as const,
  maintenance: (vehicleId: string) => ['vehicles', vehicleId, 'maintenance'] as const,
  maintenanceRecord: (vehicleId: string, recordId: string) =>
    ['vehicles', vehicleId, 'maintenance', recordId] as const,
  expenses: (vehicleId: string) => ['vehicles', vehicleId, 'expenses'] as const,
  expense: (vehicleId: string, expenseId: string) =>
    ['vehicles', vehicleId, 'expenses', expenseId] as const,
  expenseTotals: (vehicleId: string) =>
    ['vehicles', vehicleId, 'expenses', 'totals'] as const,
  documents: (vehicleId: string) => ['vehicles', vehicleId, 'documents'] as const,
  document: (vehicleId: string, documentId: string) =>
    ['vehicles', vehicleId, 'documents', documentId] as const,
  trips: (vehicleId: string) => ['vehicles', vehicleId, 'trips'] as const,
} as const;
