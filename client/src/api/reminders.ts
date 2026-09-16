import { DOCUMENT_EXPIRY_WARNING_DAYS, resolveDocumentStatus } from '@/utils/documents';
import { daysUntil } from '@/utils/date';
import type { MaintenanceRecord, Reminder, Vehicle, VehicleDocument } from '@/types';

/**
 * DERIVED — there is no reminders table.
 *
 * A reminder is what a next-due marker or an expiry date *means* today, so it is
 * computed from records the API already returns rather than stored separately.
 * If the backend later owns reminders, this module becomes an `apiClient` call
 * and the hook keeps its signature.
 */

/** A service counts as due within two weeks, matching the API's own threshold. */
const MAINTENANCE_DUE_SOON_DAYS = 14;
/** ...or within 500 km, likewise matching the API. */
const MAINTENANCE_DUE_SOON_KM = 500;

function severityRank(severity: Reminder['severity']): number {
  return severity === 'OVERDUE' ? 0 : severity === 'DUE' ? 1 : 2;
}

/**
 * Sorts by urgency, then by how soon the thing actually happens, so two
 * "upcoming" reminders do not appear in arbitrary order.
 */
function compareReminders(a: Reminder, b: Reminder): number {
  const bySeverity = severityRank(a.severity) - severityRank(b.severity);
  if (bySeverity !== 0) return bySeverity;

  const aDistance = a.daysRemaining ?? Number.MAX_SAFE_INTEGER;
  const bDistance = b.daysRemaining ?? Number.MAX_SAFE_INTEGER;
  if (aDistance !== bDistance) return aDistance - bDistance;

  return (
    (a.kmRemaining ?? Number.MAX_SAFE_INTEGER) -
    (b.kmRemaining ?? Number.MAX_SAFE_INTEGER)
  );
}

function maintenanceSeverity(
  daysRemaining: number | null,
  kmRemaining: number | null,
): Reminder['severity'] | null {
  const candidates: Reminder['severity'][] = [];

  if (daysRemaining !== null) {
    candidates.push(
      daysRemaining < 0
        ? 'OVERDUE'
        : daysRemaining <= MAINTENANCE_DUE_SOON_DAYS
          ? 'DUE'
          : 'UPCOMING',
    );
  }
  if (kmRemaining !== null) {
    candidates.push(
      kmRemaining < 0
        ? 'OVERDUE'
        : kmRemaining <= MAINTENANCE_DUE_SOON_KM
          ? 'DUE'
          : 'UPCOMING',
    );
  }

  if (candidates.length === 0) return null;
  // Either marker coming due means the service is needed: the worse one wins.
  return candidates.reduce((worst, next) =>
    severityRank(next) < severityRank(worst) ? next : worst,
  );
}

function fromMaintenance(
  record: MaintenanceRecord,
  currentMileageKm: number,
): Reminder | null {
  if (!record.nextDueDate && record.nextDueMileageKm === null) return null;

  const daysRemaining = record.nextDueDate ? daysUntil(record.nextDueDate) : null;
  const kmRemaining =
    record.nextDueMileageKm === null
      ? null
      : Math.round(record.nextDueMileageKm - currentMileageKm);

  const severity = maintenanceSeverity(daysRemaining, kmRemaining);
  if (!severity) return null;

  return {
    id: `maintenance:${record.id}`,
    vehicleId: record.vehicleId,
    source: 'MAINTENANCE',
    kind: record.type,
    title: record.title,
    severity,
    dueDate: record.nextDueDate,
    daysRemaining,
    dueMileageKm: record.nextDueMileageKm,
    kmRemaining,
    targetId: record.id,
  };
}

function fromDocument(document: VehicleDocument): Reminder | null {
  if (!document.expiresAt) return null;

  const status = resolveDocumentStatus(document.expiresAt);
  if (status === 'NO_EXPIRY' || status === 'VALID') return null;

  const daysRemaining = daysUntil(document.expiresAt);

  return {
    id: `document:${document.id}`,
    vehicleId: document.vehicleId,
    source: 'DOCUMENT',
    kind: document.type,
    title: document.title,
    severity: status === 'EXPIRED' ? 'OVERDUE' : 'DUE',
    dueDate: document.expiresAt,
    daysRemaining,
    dueMileageKm: null,
    kmRemaining: null,
    targetId: document.id,
  };
}

/**
 * Documents that are still valid are not reminders, but the ones inside the
 * warning window are — the same window the documents list uses for its badge.
 */
export function buildReminders(input: {
  vehicle: Vehicle;
  maintenance: MaintenanceRecord[];
  documents: VehicleDocument[];
}): Reminder[] {
  const currentMileageKm = Math.max(
    input.vehicle.odometerKm,
    input.vehicle.estimatedMileageKm,
  );

  const reminders = [
    ...input.maintenance
      .map((record) => fromMaintenance(record, currentMileageKm))
      .filter((reminder): reminder is Reminder => reminder !== null),
    ...input.documents
      .map(fromDocument)
      .filter((reminder): reminder is Reminder => reminder !== null),
  ];

  return reminders.sort(compareReminders);
}

export { DOCUMENT_EXPIRY_WARNING_DAYS };
