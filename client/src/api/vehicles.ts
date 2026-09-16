import type { CreateVehicleInput, UpdateVehicleInput, Vehicle } from '@/types';
import { apiClient } from './client';

export const vehiclesApi = {
  list: (signal?: AbortSignal) => apiClient.get<Vehicle[]>('/vehicles', { signal }),

  get: (vehicleId: string, signal?: AbortSignal) =>
    apiClient.get<Vehicle>(`/vehicles/${vehicleId}`, { signal }),

  create: (input: CreateVehicleInput) => apiClient.post<Vehicle>('/vehicles', input),

  update: (vehicleId: string, input: UpdateVehicleInput) =>
    apiClient.patch<Vehicle>(`/vehicles/${vehicleId}`, input),

  /**
   * Confirms a hand-read odometer value. The API re-anchors the GPS estimate to
   * it, which is what stops trip distance being counted twice.
   */
  updateMileage: (vehicleId: string, odometerKm: number) =>
    apiClient.patch<Vehicle>(`/vehicles/${vehicleId}/mileage`, { odometerKm }),

  remove: (vehicleId: string) => apiClient.delete(`/vehicles/${vehicleId}`),
};
