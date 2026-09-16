import { maintenanceApi } from '@/api/maintenance';
import type { CreateMaintenanceInput, UpdateMaintenanceInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export function useMaintenanceRecords(vehicleId: string | null) {
  return useQuery({
    queryKey: queryKeys.maintenance(vehicleId ?? 'none'),
    queryFn: ({ signal }) => maintenanceApi.list(vehicleId as string, signal),
    enabled: Boolean(vehicleId),
  });
}

export function useMaintenanceRecord(vehicleId: string | null, recordId: string | null) {
  return useQuery({
    queryKey: queryKeys.maintenanceRecord(vehicleId ?? 'none', recordId ?? 'none'),
    queryFn: ({ signal }) =>
      maintenanceApi.get(vehicleId as string, recordId as string, signal),
    enabled: Boolean(vehicleId && recordId),
  });
}

/**
 * A service record changes the dashboard (next-due) and, when it carries a
 * cost, the expense totals are unaffected — cost lives on the record itself, not
 * in the expenses table — so only the vehicle subtree is invalidated.
 */
function useInvalidateVehicleData(vehicleId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicle(vehicleId) });
}

export function useCreateMaintenance(vehicleId: string) {
  const invalidate = useInvalidateVehicleData(vehicleId);

  return useMutation({
    mutationFn: (input: CreateMaintenanceInput) =>
      maintenanceApi.create(vehicleId, input),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateMaintenance(vehicleId: string, recordId: string) {
  const invalidate = useInvalidateVehicleData(vehicleId);

  return useMutation({
    mutationFn: (input: UpdateMaintenanceInput) =>
      maintenanceApi.update(vehicleId, recordId, input),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteMaintenance(vehicleId: string) {
  const invalidate = useInvalidateVehicleData(vehicleId);

  return useMutation({
    mutationFn: (recordId: string) => maintenanceApi.remove(vehicleId, recordId),
    onSuccess: () => void invalidate(),
  });
}
