import * as Location from 'expo-location';

/**
 * The seam GPS trip tracking will plug into.
 *
 * Only what the MVP needs is implemented — permissions and a one-off fix.
 * Background tracking is deliberately absent: it needs a foreground service on
 * Android, a background location entitlement on iOS, and a store justification,
 * none of which belong in an MVP. What matters now is that {@link tripService}
 * and the screens above it already talk to this interface, so turning tracking
 * on later does not reach into the UI.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPermissionState {
  granted: boolean;
  /** True when the user denied it and the OS will not ask again. */
  blocked: boolean;
}

export const locationService = {
  async getPermissionState(): Promise<LocationPermissionState> {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === Location.PermissionStatus.GRANTED,
      blocked: status === Location.PermissionStatus.DENIED && !canAskAgain,
    };
  },

  async requestPermission(): Promise<LocationPermissionState> {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: status === Location.PermissionStatus.GRANTED,
      blocked: status === Location.PermissionStatus.DENIED && !canAskAgain,
    };
  },

  async getCurrentPosition(): Promise<Coordinates | null> {
    const { granted } = await this.getPermissionState();
    if (!granted) return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  },

  /** Whether automatic trip tracking is available. False for the MVP. */
  isTrackingSupported(): boolean {
    return false;
  },
};
