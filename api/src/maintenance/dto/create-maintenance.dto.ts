import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { MaintenanceType } from '../../generated/prisma/enums.js';
import { MAX_ODOMETER_KM } from '../../vehicles/dto/create-vehicle.dto.js';

const MAX_COST = 9_999_999.99;

export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType, enumName: 'MaintenanceType' })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: 'Oil and filter change' })
  @IsString()
  @Length(1, 120)
  title: string;

  @ApiPropertyOptional({ example: 'Castrol 5W-30, OEM filter' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @ApiPropertyOptional({ example: 89.9 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_COST)
  cost?: number;

  @ApiPropertyOptional({ example: 140000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(MAX_ODOMETER_KM)
  mileageKm?: number;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiPropertyOptional({ example: '2027-03-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextDueDate?: Date;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(MAX_ODOMETER_KM)
  nextDueMileageKm?: number;

  @ApiPropertyOptional({ example: 'Next time also check the cabin filter' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  notes?: string;
}
