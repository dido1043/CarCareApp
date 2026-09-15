import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseTotalsDto } from './dto/expense-totals.dto.js';
import { ExpenseDto } from './dto/expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiParam({ name: 'vehicleId', format: 'uuid' })
@ApiUnauthorizedResponse({ description: 'Missing, malformed or invalid token' })
@ApiBadRequestResponse({ description: 'Validation failed' })
@ApiNotFoundResponse({ description: 'Vehicle or expense not found' })
@Controller('vehicles/:vehicleId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Record an expense against the vehicle' })
  @ApiCreatedResponse({ type: ExpenseDto })
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    return this.expensesService.create(vehicleId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses, newest first' })
  @ApiOkResponse({ type: [ExpenseDto] })
  findAll(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ExpenseDto[]> {
    return this.expensesService.findAll(vehicleId, user.id);
  }

  @Get('totals')
  @ApiOperation({
    summary: 'Current month and year expense totals',
    description: 'Aggregated by PostgreSQL over exact decimal amounts.',
  })
  @ApiOkResponse({ type: ExpenseTotalsDto })
  getTotals(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ExpenseTotalsDto> {
    return this.expensesService.getTotals(vehicleId, user.id);
  }

  @Get(':expenseId')
  @ApiOperation({ summary: 'Get a single expense' })
  @ApiParam({ name: 'expenseId', format: 'uuid' })
  @ApiOkResponse({ type: ExpenseDto })
  findOne(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ExpenseDto> {
    return this.expensesService.findOne(vehicleId, expenseId, user.id);
  }

  @Patch(':expenseId')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiParam({ name: 'expenseId', format: 'uuid' })
  @ApiOkResponse({ type: ExpenseDto })
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpenseDto> {
    return this.expensesService.update(vehicleId, expenseId, user.id, dto);
  }

  @Delete(':expenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiParam({ name: 'expenseId', format: 'uuid' })
  @ApiNoContentResponse()
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.expensesService.remove(vehicleId, expenseId, user.id);
  }
}
