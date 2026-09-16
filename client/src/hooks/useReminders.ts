import { buildReminders } from '@/api/reminders';
import type { Reminder, Vehicle } from '@/types';
import { useMemo } from 'react';
import { useDocuments } from './useDocuments';
import { useMaintenanceRecords } from './useMaintenance';

/**
 * Reminders are a view over data the other queries already hold, so this hook
 * composes them rather than fetching anything of its own.
 */
export function useReminders(vehicle: Vehicle | null): {
  reminders: Reminder[];
  isLoading: boolean;
  isError: boolean;
} {
  const vehicleId = vehicle?.id ?? null;
  const maintenance = useMaintenanceRecords(vehicleId);
  const documents = useDocuments(vehicleId);

  const reminders = useMemo(() => {
    if (!vehicle) return [];
    return buildReminders({
      vehicle,
      maintenance: maintenance.data ?? [],
      documents: documents.data ?? [],
    });
  }, [vehicle, maintenance.data, documents.data]);

  return {
    reminders,
    isLoading: maintenance.isLoading || documents.isLoading,
    isError: maintenance.isError,
  };
}

/** The single most urgent reminder, for the dashboard's attention card. */
export function useTopReminder(vehicle: Vehicle | null): Reminder | null {
  const { reminders } = useReminders(vehicle);
  return reminders.find((reminder) => reminder.severity !== 'UPCOMING') ?? null;
}
