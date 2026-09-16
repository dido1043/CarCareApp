import { useLanguage } from '@/hooks/useLanguage';
import type { MaintenanceRecord } from '@/types';
import { daysUntil } from '@/utils/date';
import { formatMileage } from '@/utils/format';
import { useTranslation } from 'react-i18next';

/**
 * Turns next-due markers into the one line a driver actually reads:
 * "Due in 1,200 km", "Overdue by 3 days".
 *
 * A record can carry a date, a mileage or both. When both are set the nearer of
 * the two is what gets said, because that is the one that will bite first.
 */
export function useMaintenanceDueLabel(): (
  record: MaintenanceRecord,
  currentMileageKm: number,
) => string | null {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (record, currentMileageKm) => {
    const days = record.nextDueDate ? daysUntil(record.nextDueDate) : null;
    const km =
      record.nextDueMileageKm === null
        ? null
        : Math.round(record.nextDueMileageKm - currentMileageKm);

    if (days === null && km === null) return null;

    // Anything already past due is the more urgent thing to say.
    if ((days !== null && days < 0) || (km !== null && km < 0)) {
      if (days !== null && days < 0 && (km === null || km >= 0)) {
        return t('maintenance.overdueByDays', { count: Math.abs(days) });
      }
      if (km !== null && km < 0 && (days === null || days >= 0)) {
        return t('maintenance.overdueByKm', {
          distance: formatMileage(Math.abs(km), language),
        });
      }
      // Both overdue: lead with the date, which is the harder deadline.
      return t('maintenance.overdueByDays', { count: Math.abs(days ?? 0) });
    }

    if (days !== null && days === 0) return t('maintenance.dueToday');

    // Compare the two horizons on a rough common scale to pick the nearer one.
    const daysAsUrgency = days ?? Number.MAX_SAFE_INTEGER;
    const kmAsUrgency = km === null ? Number.MAX_SAFE_INTEGER : km / 40;

    if (kmAsUrgency < daysAsUrgency && km !== null) {
      return t('maintenance.dueInKm', { distance: formatMileage(km, language) });
    }
    return t('maintenance.dueInDays', { count: days ?? 0 });
  };
}
