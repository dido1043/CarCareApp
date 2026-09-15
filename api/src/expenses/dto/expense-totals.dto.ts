import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '../../generated/prisma/enums.js';

export class CategoryTotalDto {
  @ApiProperty({ enum: ExpenseCategory, enumName: 'ExpenseCategory' })
  category: ExpenseCategory;

  @ApiProperty({ example: 1240.55 })
  total: number;
}

/**
 * Totals are summed by PostgreSQL over exact decimals. Amounts in different
 * currencies are added as-is — the MVP assumes one currency per vehicle and
 * performs no conversion.
 */
export class ExpenseTotalsDto {
  @ApiProperty({ example: 257.3, description: 'Total for the current calendar month (UTC)' })
  currentMonth: number;

  @ApiProperty({ example: 4230.9, description: 'Total for the current calendar year (UTC)' })
  currentYear: number;

  @ApiProperty({
    type: [CategoryTotalDto],
    description: 'Current-year totals per category, largest first',
  })
  byCategory: CategoryTotalDto[];
}
