import { tripsApi } from '@/api/trips';
import type { CreateTripInput, Trip } from '@/types';
import type { Coordinates } from './locationService';

/**
 * Turns a recorded journey into the summary the API stores.
 *
 * Individual GPS points never leave the device — the backend's `Trip` model
 * holds only the endpoints and a total distance — so this is where a future
 * tracker will reduce its trace before anything is uploaded.
 */

export interface TripDraft {
  startedAt: Date;
  endedAt: Date;
  start: Coordinates;
  end: Coordinates;
  /** Total distance along the path travelled, not the straight line. */
  distanceMeters: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two fixes. Used to accumulate path length from
 * a stream of positions; at the sampling rates a phone reports, summing these
 * short hops tracks the road closely enough for a mileage estimate.
 */
export function haversineMeters(from: Coordinates, to: Coordinates): number {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/** Sums a position trace into a total path length. */
export function pathDistanceMeters(points: Coordinates[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    if (previous && current) total += haversineMeters(previous, current);
  }
  return total;
}

function toCreateInput(draft: TripDraft): CreateTripInput {
  return {
    startedAt: draft.startedAt.toISOString(),
    endedAt: draft.endedAt.toISOString(),
    // The API takes whole metres.
    distanceMeters: Math.round(draft.distanceMeters),
    startLatitude: draft.start.latitude,
    startLongitude: draft.start.longitude,
    endLatitude: draft.end.latitude,
    endLongitude: draft.end.longitude,
  };
}

export const tripService = {
  /** Uploads a finished trip; the API adds its distance to the GPS estimate. */
  async record(vehicleId: string, draft: TripDraft): Promise<Trip> {
    return tripsApi.create(vehicleId, toCreateInput(draft));
  },

  buildDraft(input: {
    startedAt: Date;
    endedAt: Date;
    points: Coordinates[];
  }): TripDraft | null {
    const start = input.points[0];
    const end = input.points[input.points.length - 1];
    if (!start || !end) return null;

    return {
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      start,
      end,
      distanceMeters: pathDistanceMeters(input.points),
    };
  },
};
