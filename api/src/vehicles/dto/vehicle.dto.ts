import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { decimalToNumber } from '../../common/decimal.util.js';
import type { Vehicle } from '../../generated/prisma/client.js';
import { FuelType } from '../../generated/prisma/enums.js';

export class VehicleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid', description: 'Supabase Auth id of the owner' })
  userId: string;

  @ApiProperty({ example: 'Toyota' })
  make: string;

  @ApiProperty({ example: 'Camry' })
  model: string;

  @ApiProperty({ example: 2020 })
  year: number;

  @ApiProperty({ enum: FuelType, enumName: 'FuelType' })
  fuelType: FuelType;

  @ApiPropertyOptional({ example: '2.5 Dynamic Force', nullable: true })
  engine: string | null;

  @ApiPropertyOptional({ example: 'CA1234AA', nullable: true })
  licensePlate: string | null;

  @ApiPropertyOptional({ example: '1HGBH41JXMN109186', nullable: true })
  vin: string | null;

  @ApiProperty({
    example: 145060,
    description: 'Last odometer reading confirmed by the driver, in kilometres',
  })
  odometerKm: number;

  @ApiProperty({
    example: 145338.4,
    description:
      'Confirmed odometer plus GPS distance recorded since it was confirmed',
  })
  estimatedMileageKm: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'When the odometer was last confirmed',
  })
  odometerConfirmedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toVehicleDto(vehicle: Vehicle): VehicleDto {
  return {
    id: vehicle.id,
    userId: vehicle.userId,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    fuelType: vehicle.fuelType,
    engine: vehicle.engine,
    licensePlate: vehicle.licensePlate,
    vin: vehicle.vin,
    odometerKm: decimalToNumber(vehicle.odometerKm),
    estimatedMileageKm: decimalToNumber(vehicle.estimatedMileageKm),
    odometerConfirmedAt: vehicle.odometerConfirmedAt,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

/**
 * Best estimate of how far the vehicle has actually travelled. The estimate is
 * re-anchored whenever the driver confirms a reading, so it is never below the
 * confirmed odometer — the `max` only guards against data written by hand.
 */
export function currentMileageKm(vehicle: Vehicle): number {
  return Math.max(
    decimalToNumber(vehicle.odometerKm),
    decimalToNumber(vehicle.estimatedMileageKm),
  );
}
