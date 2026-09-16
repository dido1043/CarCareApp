import { tripsApi } from '@/api/trips';
import type { CreateTripInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export function useTrips(vehicleId: string | null, limit = 20) {
  return useQuery({
    queryKey: [...queryKeys.trips(vehicleId ?? 'none'), limit],
    queryFn: ({ signal }) => tripsApi.list(vehicleId as string, { limit }, signal),
    enabled: Boolean(vehicleId),
  });
}

/**
 * Recording a trip moves the GPS estimate, so the vehicle and its dashboard are
 * both stale afterwards.
 */
export function useCreateTrip(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTripInput) => tripsApi.create(vehicleId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicle(vehicleId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
    },
  });
}
