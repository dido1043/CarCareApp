import { dashboardApi } from '@/api/dashboard';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export function useDashboard(vehicleId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard(vehicleId ?? 'none'),
    queryFn: ({ signal }) => dashboardApi.get(vehicleId as string, signal),
    enabled: Boolean(vehicleId),
  });
}
