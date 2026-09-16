import { vehiclesApi } from '@/api/vehicles';
import { documentStore } from '@/services/documents/documentStore';
import { usePreferences } from '@/store/preferences';
import type { CreateVehicleInput, UpdateVehicleInput, Vehicle } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from './queryKeys';

export function useVehicles() {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: ({ signal }) => vehiclesApi.list(signal),
  });
}

export function useVehicle(vehicleId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicle(vehicleId ?? 'none'),
    queryFn: ({ signal }) => vehiclesApi.get(vehicleId as string, signal),
    enabled: Boolean(vehicleId),
  });
}

/**
 * The vehicle every screen works against.
 *
 * The selection is remembered between launches, but it can point at a vehicle
 * that has since been deleted — or at nothing at all, on a fresh install — so it
 * is reconciled against the list and falls back to the first vehicle.
 */
export function useSelectedVehicle(): {
  vehicle: Vehicle | null;
  vehicles: Vehicle[];
  vehicleId: string | null;
  isLoading: boolean;
  isError: boolean;
  hasNoVehicles: boolean;
} {
  const { data: vehicles, isLoading, isError } = useVehicles();
  const selectedVehicleId = usePreferences((state) => state.selectedVehicleId);
  const selectVehicle = usePreferences((state) => state.selectVehicle);

  const resolved =
    vehicles?.find((vehicle) => vehicle.id === selectedVehicleId) ??
    vehicles?.[0] ??
    null;

  useEffect(() => {
    if (resolved && resolved.id !== selectedVehicleId) {
      selectVehicle(resolved.id);
    }
    if (!resolved && vehicles?.length === 0 && selectedVehicleId !== null) {
      selectVehicle(null);
    }
  }, [resolved, selectedVehicleId, selectVehicle, vehicles?.length]);

  return {
    vehicle: resolved,
    vehicles: vehicles ?? [],
    vehicleId: resolved?.id ?? null,
    isLoading,
    isError,
    hasNoVehicles: !isLoading && !isError && (vehicles?.length ?? 0) === 0,
  };
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const selectVehicle = usePreferences((state) => state.selectVehicle);

  return useMutation({
    mutationFn: (input: CreateVehicleInput) => vehiclesApi.create(input),
    onSuccess: (vehicle) => {
      queryClient.setQueryData(queryKeys.vehicle(vehicle.id), vehicle);
      // Seed the list too, not just invalidate it: the home screen sends a user
      // with an empty garage to onboarding, and a stale empty list would bounce
      // them straight back there while the refetch was still in flight.
      queryClient.setQueryData<Vehicle[]>(queryKeys.vehicles, (current) =>
        current ? [...current, vehicle] : [vehicle],
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
      // A vehicle the user just added is the one they want to look at.
      selectVehicle(vehicle.id);
    },
  });
}

export function useUpdateVehicle(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateVehicleInput) => vehiclesApi.update(vehicleId, input),
    onSuccess: (vehicle) => {
      queryClient.setQueryData(queryKeys.vehicle(vehicle.id), vehicle);
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(vehicle.id) });
    },
  });
}

/** Confirms a hand-read odometer value, which also re-anchors the GPS estimate. */
export function useUpdateMileage(vehicleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (odometerKm: number) => vehiclesApi.updateMileage(vehicleId, odometerKm),
    onSuccess: (vehicle) => {
      queryClient.setQueryData(queryKeys.vehicle(vehicle.id), vehicle);
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
      // Mileage drives maintenance due-status, so that list is stale now too.
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicle(vehicle.id) });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const selectVehicle = usePreferences((state) => state.selectVehicle);

  return useMutation({
    mutationFn: async (vehicleId: string) => {
      await vehiclesApi.remove(vehicleId);
      // The API cascades its own tables; locally stored documents are ours.
      await documentStore.removeForVehicle(vehicleId);
      return vehicleId;
    },
    onSuccess: (vehicleId) => {
      queryClient.removeQueries({ queryKey: queryKeys.vehicle(vehicleId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
      selectVehicle(null);
    },
  });
}
