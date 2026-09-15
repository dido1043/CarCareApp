import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ExpensesModule } from '../expenses/expenses.module.js';
import { MaintenanceModule } from '../maintenance/maintenance.module.js';
import { TripsModule } from '../trips/trips.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [
    AuthModule,
    VehiclesModule,
    TripsModule,
    MaintenanceModule,
    ExpensesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
