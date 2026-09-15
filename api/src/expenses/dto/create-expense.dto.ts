import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ExpenseCategory } from '../../generated/prisma/enums.js';
import { MAX_ODOMETER_KM } from '../../vehicles/dto/create-vehicle.dto.js';

export const DEFAULT_CURRENCY = 'EUR';

const MAX_AMOUNT = 9_999_999.99;

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseCategory, enumName: 'ExpenseCategory' })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: 72.4 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_AMOUNT)
  amount: number;

  @ApiPropertyOptional({ example: DEFAULT_CURRENCY, default: DEFAULT_CURRENCY })
  @IsOptional()
  @IsISO4217CurrencyCode()
  currency?: string;

  @ApiProperty({ example: '2026-09-14T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiPropertyOptional({ example: 145060 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(MAX_ODOMETER_KM)
  mileageKm?: number;

  @ApiPropertyOptional({ example: 'Shell V-Power, 42 litres' })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;
}
