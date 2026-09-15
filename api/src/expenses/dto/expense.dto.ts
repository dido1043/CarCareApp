import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  decimalToNumber,
  nullableDecimalToNumber,
} from '../../common/decimal.util.js';
import type { Expense } from '../../generated/prisma/client.js';
import { ExpenseCategory } from '../../generated/prisma/enums.js';

export class ExpenseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  vehicleId: string;

  @ApiProperty({ enum: ExpenseCategory, enumName: 'ExpenseCategory' })
  category: ExpenseCategory;

  @ApiProperty({ example: 72.4 })
  amount: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional({ example: 145060, nullable: true })
  mileageKm: number | null;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toExpenseDto(expense: Expense): ExpenseDto {
  return {
    id: expense.id,
    vehicleId: expense.vehicleId,
    category: expense.category,
    amount: decimalToNumber(expense.amount),
    currency: expense.currency,
    date: expense.date,
    mileageKm: nullableDecimalToNumber(expense.mileageKm),
    description: expense.description,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}
