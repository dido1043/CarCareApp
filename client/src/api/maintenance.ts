import type {
  CreateMaintenanceInput,
  MaintenanceRecord,
  UpdateMaintenanceInput,
} from '@/types';
import { apiClient } from './client';

export const maintenanceApi = {
  list: (vehicleId: string, signal?: AbortSignal) =>
    apiClient.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance`, { signal }),

  get: (vehicleId: string, recordId: string, signal?: AbortSignal) =>
    apiClient.get<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance/${recordId}`, {
      signal,
    }),

  create: (vehicleId: string, input: CreateMaintenanceInput) =>
    apiClient.post<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance`, input),

  update: (vehicleId: string, recordId: string, input: UpdateMaintenanceInput) =>
    apiClient.patch<MaintenanceRecord>(
      `/vehicles/${vehicleId}/maintenance/${recordId}`,
      input,
    ),

  remove: (vehicleId: string, recordId: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/maintenance/${recordId}`),
};
