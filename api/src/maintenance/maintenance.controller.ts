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
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { MaintenanceRecordDto } from './dto/maintenance-record.dto.js';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto.js';
import { MaintenanceService } from './maintenance.service.js';

@ApiTags('maintenance')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiParam({ name: 'vehicleId', format: 'uuid' })
@ApiUnauthorizedResponse({ description: 'Missing, malformed or invalid token' })
@ApiBadRequestResponse({ description: 'Validation failed' })
@ApiNotFoundResponse({ description: 'Vehicle or maintenance record not found' })
@Controller('vehicles/:vehicleId/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Log a service performed on the vehicle' })
  @ApiCreatedResponse({ type: MaintenanceRecordDto })
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMaintenanceDto,
  ): Promise<MaintenanceRecordDto> {
    return this.maintenanceService.create(vehicleId, user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List maintenance history, newest first',
    description:
      'Each record carries a derived UPCOMING/DUE/OVERDUE status, or null ' +
      'when nothing is scheduled for it.',
  })
  @ApiOkResponse({ type: [MaintenanceRecordDto] })
  findAll(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<MaintenanceRecordDto[]> {
    return this.maintenanceService.findAll(vehicleId, user.id);
  }

  @Get(':recordId')
  @ApiOperation({ summary: 'Get a single maintenance record' })
  @ApiParam({ name: 'recordId', format: 'uuid' })
  @ApiOkResponse({ type: MaintenanceRecordDto })
  findOne(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<MaintenanceRecordDto> {
    return this.maintenanceService.findOne(vehicleId, recordId, user.id);
  }

  @Patch(':recordId')
  @ApiOperation({ summary: 'Update a maintenance record' })
  @ApiParam({ name: 'recordId', format: 'uuid' })
  @ApiOkResponse({ type: MaintenanceRecordDto })
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMaintenanceDto,
  ): Promise<MaintenanceRecordDto> {
    return this.maintenanceService.update(vehicleId, recordId, user.id, dto);
  }

  @Delete(':recordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a maintenance record' })
  @ApiParam({ name: 'recordId', format: 'uuid' })
  @ApiNoContentResponse()
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.maintenanceService.remove(vehicleId, recordId, user.id);
  }
}
