import { Prisma } from '../../src/generated/prisma/client.js';
import {
  DUE_SOON_DAYS,
  DUE_SOON_KM,
  resolveMaintenanceStatus,
} from '../../src/maintenance/maintenance-status.js';

const NOW = new Date('2026-09-15T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

const inDays = (days: number) => new Date(NOW.getTime() + days * DAY);
const km = (value: number) => new Prisma.Decimal(value);

describe('resolveMaintenanceStatus', () => {
  it('has no status when nothing is scheduled', () => {
    expect(
      resolveMaintenanceStatus(
        { nextDueDate: null, nextDueMileageKm: null },
        145000,
        NOW,
      ),
    ).toBeNull();
  });

  describe('date markers', () => {
    it.each([
      ['far in the future', 'UPCOMING', inDays(90)],
      ['just outside the window', 'UPCOMING', inDays(DUE_SOON_DAYS + 1)],
      ['on the edge of the window', 'DUE', inDays(DUE_SOON_DAYS)],
      ['inside the window', 'DUE', inDays(3)],
      ['today', 'DUE', NOW],
      ['yesterday', 'OVERDUE', inDays(-1)],
      ['long past', 'OVERDUE', inDays(-400)],
    ])('due date %s -> %s', (_label, expected, nextDueDate) => {
      expect(
        resolveMaintenanceStatus(
          { nextDueDate: nextDueDate as Date, nextDueMileageKm: null },
          145000,
          NOW,
        ),
      ).toBe(expected);
    });
  });

  describe('mileage markers', () => {
    it.each([
      ['far away', 'UPCOMING', 160000],
      ['just outside the window', 'UPCOMING', 145000 + DUE_SOON_KM + 1],
      ['on the edge of the window', 'DUE', 145000 + DUE_SOON_KM],
      ['inside the window', 'DUE', 145100],
      ['exactly reached', 'DUE', 145000],
      ['passed', 'OVERDUE', 144000],
    ])('due mileage %s -> %s', (_label, expected, nextDueMileageKm) => {
      expect(
        resolveMaintenanceStatus(
          { nextDueDate: null, nextDueMileageKm: km(nextDueMileageKm as number) },
          145000,
          NOW,
        ),
      ).toBe(expected);
    });
  });

  describe('both markers', () => {
    it('takes the more urgent of the two', () => {
      expect(
        resolveMaintenanceStatus(
          { nextDueDate: inDays(200), nextDueMileageKm: km(144000) },
          145000,
          NOW,
        ),
      ).toBe('OVERDUE');

      expect(
        resolveMaintenanceStatus(
          { nextDueDate: inDays(-1), nextDueMileageKm: km(900000) },
          145000,
          NOW,
        ),
      ).toBe('OVERDUE');

      expect(
        resolveMaintenanceStatus(
          { nextDueDate: inDays(3), nextDueMileageKm: km(900000) },
          145000,
          NOW,
        ),
      ).toBe('DUE');
    });

    it('stays upcoming only when neither marker is close', () => {
      expect(
        resolveMaintenanceStatus(
          { nextDueDate: inDays(200), nextDueMileageKm: km(900000) },
          145000,
          NOW,
        ),
      ).toBe('UPCOMING');
    });
  });
});
