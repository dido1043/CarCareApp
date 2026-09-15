import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { FuelType } from '../../generated/prisma/enums.js';

/** Upper bound for every kilometre reading the API accepts. */
export const MAX_ODOMETER_KM = 9_999_999;

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @Length(1, 80)
  make: string;

  @ApiProperty({ example: 'Camry' })
  @IsString()
  @Length(1, 80)
  model: string;

  @ApiProperty({ example: 2020 })
  @IsInt()
  @Min(1886)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ enum: FuelType, enumName: 'FuelType', example: FuelType.PETROL })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiPropertyOptional({ example: '2.5 Dynamic Force' })
  @IsOptional()
  @IsString()
  @Length(1, 80)
  engine?: string;

  @ApiPropertyOptional({ example: 'CA1234AA' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  licensePlate?: string;

  @ApiPropertyOptional({
    example: '1HGBH41JXMN109186',
    minLength: 17,
    maxLength: 17,
  })
  @IsOptional()
  @IsString()
  @Length(17, 17)
  vin?: string;

  @ApiPropertyOptional({
    example: 145060,
    description:
      'Odometer reading at registration. Becomes the first confirmed mileage baseline.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(MAX_ODOMETER_KM)
  odometerKm?: number;
}
