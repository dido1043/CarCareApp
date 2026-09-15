import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../database/prisma.module.js';
import { UsersModule } from '../users/users.module.js';
import { VehiclesController } from './vehicles.controller.js';
import { VehiclesService } from './vehicles.service.js';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  // Trips, maintenance, expenses and the dashboard all gate on
  // `VehiclesService.assertOwned`.
  exports: [VehiclesService],
})
export class VehiclesModule {}
