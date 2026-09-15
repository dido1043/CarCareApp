import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { DashboardService } from './dashboard.service.js';
import { DashboardDto } from './dto/dashboard.dto.js';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('vehicles/:vehicleId/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Vehicle overview for the mobile home screen',
    description:
      'Mileage, the five most recent trips and expenses, scheduled ' +
      'maintenance with its status, and month/year expense totals.',
  })
  @ApiParam({ name: 'vehicleId', format: 'uuid' })
  @ApiOkResponse({ type: DashboardDto })
  @ApiUnauthorizedResponse({ description: 'Missing, malformed or invalid token' })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  get(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardDto> {
    return this.dashboardService.getForVehicle(vehicleId, user.id);
  }
}
