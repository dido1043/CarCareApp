/**
 * Analytics seam. Nothing is collected in the MVP; the interface exists so that
 * screens can name the events worth tracking without picking a vendor now.
 */
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

export const analyticsService = {
  track(_event: AnalyticsEvent): void {
    // Intentionally empty until an analytics provider is chosen.
  },

  screen(_name: string): void {
    // Intentionally empty.
  },
};
