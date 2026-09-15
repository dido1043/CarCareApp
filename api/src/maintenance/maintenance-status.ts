import type { Prisma } from '../generated/prisma/client.js';

export const MaintenanceStatus = {
  UPCOMING: 'UPCOMING',
  DUE: 'DUE',
  OVERDUE: 'OVERDUE',
} as const;

export type MaintenanceStatus =
  (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

/** A service counts as due once it is within two weeks of its date. */
export const DUE_SOON_DAYS = 14;

/** ...or within 500 km of its mileage marker. */
export const DUE_SOON_KM = 500;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const SEVERITY: Record<MaintenanceStatus, number> = {
  UPCOMING: 0,
  DUE: 1,
  OVERDUE: 2,
};

interface DueMarkers {
  nextDueDate: Date | null;
  nextDueMileageKm: Prisma.Decimal | null;
}

/**
 * Works out how urgent a service is from whichever next-due markers were set.
 *
 * A record can carry a date marker, a mileage marker, both or neither. When
 * both are present the more urgent of the two wins, because either one coming
 * due means the service is needed. Records with no markers are not scheduled at
 * all and get `null` rather than a status.
 */
export function resolveMaintenanceStatus(
  record: DueMarkers,
  currentMileageKm: number,
  now: Date = new Date(),
): MaintenanceStatus | null {
  const byDate = record.nextDueDate
    ? statusFromDate(record.nextDueDate, now)
    : null;
  const byMileage = record.nextDueMileageKm
    ? statusFromMileage(record.nextDueMileageKm.toNumber(), currentMileageKm)
    : null;

  if (byDate === null) {
    return byMileage;
  }

  if (byMileage === null) {
    return byDate;
  }

  return SEVERITY[byDate] >= SEVERITY[byMileage] ? byDate : byMileage;
}

function statusFromDate(nextDueDate: Date, now: Date): MaintenanceStatus {
  const remainingDays = (nextDueDate.getTime() - now.getTime()) / DAY_IN_MS;

  if (remainingDays < 0) {
    return MaintenanceStatus.OVERDUE;
  }

  return remainingDays <= DUE_SOON_DAYS
    ? MaintenanceStatus.DUE
    : MaintenanceStatus.UPCOMING;
}

function statusFromMileage(
  nextDueMileageKm: number,
  currentMileageKm: number,
): MaintenanceStatus {
  const remainingKm = nextDueMileageKm - currentMileageKm;

  if (remainingKm < 0) {
    return MaintenanceStatus.OVERDUE;
  }

  return remainingKm <= DUE_SOON_KM
    ? MaintenanceStatus.DUE
    : MaintenanceStatus.UPCOMING;
}
