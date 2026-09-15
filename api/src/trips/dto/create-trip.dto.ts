import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsLatitude, IsLongitude, Max, Min } from 'class-validator';

/** One trip cannot plausibly exceed 10 000 km. */
export const MAX_TRIP_DISTANCE_METERS = 10_000_000;

export class CreateTripDto {
  @ApiProperty({ example: '2026-09-15T07:10:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startedAt: Date;

  @ApiProperty({ example: '2026-09-15T08:05:00.000Z' })
  @Type(() => Date)
  @IsDate()
  endedAt: Date;

  @ApiProperty({
    example: 18400,
    description: 'Distance the mobile app calculated from its GPS trace',
  })
  @IsInt()
  @Min(0)
  @Max(MAX_TRIP_DISTANCE_METERS)
  distanceMeters: number;

  @ApiProperty({ example: 42.1354 })
  @IsLatitude()
  startLatitude: number;

  @ApiProperty({ example: 24.7453 })
  @IsLongitude()
  startLongitude: number;

  @ApiProperty({ example: 42.6977 })
  @IsLatitude()
  endLatitude: number;

  @ApiProperty({ example: 23.3219 })
  @IsLongitude()
  endLongitude: number;
}
