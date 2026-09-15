import { ApiProperty } from '@nestjs/swagger';
import { decimalToNumber } from '../../common/decimal.util.js';
import type { Trip } from '../../generated/prisma/client.js';

export class TripDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  vehicleId: string;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  endedAt: Date;

  @ApiProperty({ example: 18400, description: 'Distance travelled, in metres' })
  distanceMeters: number;

  @ApiProperty({ example: 18.4, description: 'Same distance, in kilometres' })
  distanceKm: number;

  @ApiProperty({ example: 42.1354 })
  startLatitude: number;

  @ApiProperty({ example: 24.7453 })
  startLongitude: number;

  @ApiProperty({ example: 42.6977 })
  endLatitude: number;

  @ApiProperty({ example: 23.3219 })
  endLongitude: number;

  @ApiProperty()
  createdAt: Date;
}

/** Metres are the wire format; kilometres are what mileage is expressed in. */
export function metersToKm(distanceMeters: number): number {
  return distanceMeters / 1000;
}

export function toTripDto(trip: Trip): TripDto {
  return {
    id: trip.id,
    vehicleId: trip.vehicleId,
    startedAt: trip.startedAt,
    endedAt: trip.endedAt,
    distanceMeters: trip.distanceMeters,
    distanceKm: metersToKm(trip.distanceMeters),
    startLatitude: decimalToNumber(trip.startLatitude),
    startLongitude: decimalToNumber(trip.startLongitude),
    endLatitude: decimalToNumber(trip.endLatitude),
    endLongitude: decimalToNumber(trip.endLongitude),
    createdAt: trip.createdAt,
  };
}
