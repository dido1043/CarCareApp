import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { configuration } from './config/configuration.js';
import { validateEnv } from './config/validation.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { PrismaModule } from './database/prisma.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { HealthModule } from './health/health.module.js';
import { MaintenanceModule } from './maintenance/maintenance.module.js';
import { TripsModule } from './trips/trips.module.js';
import { UsersModule } from './users/users.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    TripsModule,
    MaintenanceModule,
    ExpensesModule,
    DashboardModule,
    HealthModule,
  ],
})
export class AppModule {}
