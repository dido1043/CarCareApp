import type { Reminder } from '@/types';

/**
 * Placeholder for push/local reminder delivery.
 *
 * Reminders are computed and displayed today; *delivering* them when the app is
 * closed needs a notification permission flow and a scheduling backend, which is
 * out of MVP scope. The interface exists so the reminder screens can call it
 * once it is real, rather than growing notification logic of their own.
 */
export const notificationService = {
  isSupported(): boolean {
    return false;
  },

  /** No-op until local notifications are wired up. */
  async scheduleForReminder(_reminder: Reminder): Promise<void> {
    return Promise.resolve();
  },

  async cancelForReminder(_reminderId: string): Promise<void> {
    return Promise.resolve();
  },
};
