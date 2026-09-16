import type { CreateTripInput, Trip, TripPage } from '@/types';
import { apiClient } from './client';

export const tripsApi = {
  list: (
    vehicleId: string,
    params: { limit?: number; offset?: number } = {},
    signal?: AbortSignal,
  ) =>
    apiClient.get<TripPage>(`/vehicles/${vehicleId}/trips`, {
      query: { limit: params.limit, offset: params.offset },
      signal,
    }),

  get: (vehicleId: string, tripId: string, signal?: AbortSignal) =>
    apiClient.get<Trip>(`/vehicles/${vehicleId}/trips/${tripId}`, { signal }),

  /** Adds the distance to the vehicle's GPS estimate, atomically, server-side. */
  create: (vehicleId: string, input: CreateTripInput) =>
    apiClient.post<Trip>(`/vehicles/${vehicleId}/trips`, input),

  remove: (vehicleId: string, tripId: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/trips/${tripId}`),
};
