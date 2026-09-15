import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseTotalsDto } from '../../expenses/dto/expense-totals.dto.js';
import { ExpenseDto } from '../../expenses/dto/expense.dto.js';
import { MaintenanceRecordDto } from '../../maintenance/dto/maintenance-record.dto.js';
import { TripDto } from '../../trips/dto/trip.dto.js';
import { VehicleDto } from '../../vehicles/dto/vehicle.dto.js';

export class MileageDto {
  @ApiProperty({
    example: 145320,
    description: 'Last reading the driver confirmed',
  })
  odometerKm: number;

  @ApiProperty({
    example: 145338.4,
    description: 'Confirmed reading plus GPS distance recorded since',
  })
  estimatedMileageKm: number;

  @ApiPropertyOptional({ nullable: true })
  odometerConfirmedAt: Date | null;
}

/** Everything the mobile home screen needs, in one request. */
export class DashboardDto {
  @ApiProperty({ type: VehicleDto })
  vehicle: VehicleDto;

  @ApiProperty({ type: MileageDto })
  mileage: MileageDto;

  @ApiProperty({ type: [TripDto], description: 'Five most recent trips' })
  recentTrips: TripDto[];

  @ApiProperty({
    type: [MaintenanceRecordDto],
    description: 'Scheduled services, most urgent first',
  })
  upcomingMaintenance: MaintenanceRecordDto[];

  @ApiProperty({ type: [ExpenseDto], description: 'Five most recent expenses' })
  recentExpenses: ExpenseDto[];

  @ApiProperty({ type: ExpenseTotalsDto })
  expenses: ExpenseTotalsDto;
}
