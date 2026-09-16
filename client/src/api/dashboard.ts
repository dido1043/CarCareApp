import type { Dashboard } from '@/types';
import { apiClient } from './client';

export const dashboardApi = {
  /** Everything the home screen needs, in one request. */
  get: (vehicleId: string, signal?: AbortSignal) =>
    apiClient.get<Dashboard>(`/vehicles/${vehicleId}/dashboard`, { signal }),
};
