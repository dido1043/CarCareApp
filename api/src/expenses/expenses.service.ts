import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import {
  CreateExpenseDto,
  DEFAULT_CURRENCY,
} from './dto/create-expense.dto.js';
import { ExpenseTotalsDto } from './dto/expense-totals.dto.js';
import { ExpenseDto, toExpenseDto } from './dto/expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
  ) {}

  async create(
    vehicleId: string,
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    await this.vehicles.assertOwned(vehicleId, userId);

    const expense = await this.prisma.expense.create({
      data: {
        vehicleId,
        category: dto.category,
        amount: dto.amount,
        currency: dto.currency ?? DEFAULT_CURRENCY,
        date: dto.date,
        mileageKm: dto.mileageKm ?? null,
        description: dto.description ?? null,
      },
    });

    return toExpenseDto(expense);
  }

  async findAll(
    vehicleId: string,
    userId: string,
    limit?: number,
  ): Promise<ExpenseDto[]> {
    await this.vehicles.assertOwned(vehicleId, userId);

    const expenses = await this.prisma.expense.findMany({
      where: { vehicleId, vehicle: { userId } },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return expenses.map(toExpenseDto);
  }

  async findOne(
    vehicleId: string,
    expenseId: string,
    userId: string,
  ): Promise<ExpenseDto> {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, vehicleId, vehicle: { userId } },
    });

    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    return toExpenseDto(expense);
  }

  async update(
    vehicleId: string,
    expenseId: string,
    userId: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseDto> {
    await this.vehicles.assertOwned(vehicleId, userId);

    const { count } = await this.prisma.expense.updateMany({
      where: { id: expenseId, vehicleId, vehicle: { userId } },
      data: dto,
    });

    if (count === 0) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    const expense = await this.prisma.expense.findFirstOrThrow({
      where: { id: expenseId, vehicleId, vehicle: { userId } },
    });

    return toExpenseDto(expense);
  }

  async remove(
    vehicleId: string,
    expenseId: string,
    userId: string,
  ): Promise<void> {
    await this.vehicles.assertOwned(vehicleId, userId);

    const { count } = await this.prisma.expense.deleteMany({
      where: { id: expenseId, vehicleId, vehicle: { userId } },
    });

    if (count === 0) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }
  }

  /**
   * Month and year totals plus a per-category breakdown, all summed by
   * PostgreSQL. Rows are never pulled into the process to be added up.
   */
  async getTotals(
    vehicleId: string,
    userId: string,
    now: Date = new Date(),
  ): Promise<ExpenseTotalsDto> {
    await this.vehicles.assertOwned(vehicleId, userId);

    const owned: Prisma.ExpenseWhereInput = { vehicleId, vehicle: { userId } };
    const monthStart = startOfUtcMonth(now);
    const yearStart = startOfUtcYear(now);

    const [month, year, byCategory] = await Promise.all([
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { ...owned, date: { gte: monthStart } },
      }),
      this.prisma.expense.aggregate({
        _sum: { amount: true },
        where: { ...owned, date: { gte: yearStart } },
      }),
      this.prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
        where: { ...owned, date: { gte: yearStart } },
      }),
    ]);

    return {
      currentMonth: month._sum.amount?.toNumber() ?? 0,
      currentYear: year._sum.amount?.toNumber() ?? 0,
      byCategory: byCategory
        .map((row) => ({
          category: row.category,
          total: row._sum.amount?.toNumber() ?? 0,
        }))
        .sort((a, b) => b.total - a.total),
    };
  }
}

/**
 * Period boundaries are UTC calendar dates. The API has no notion of the
 * driver's timezone yet, so "this month" is the same window for everyone.
 */
function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function startOfUtcYear(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}
