import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';
import { MAX_ODOMETER_KM } from './create-vehicle.dto.js';

export class UpdateMileageDto {
  @ApiProperty({
    example: 145060,
    description: 'Odometer reading the driver has read off the dashboard',
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(MAX_ODOMETER_KM)
  odometerKm: number;
}
