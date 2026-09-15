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
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateMileageDto } from './dto/update-mileage.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleDto } from './dto/vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiUnauthorizedResponse({ description: 'Missing, malformed or invalid token' })
@ApiBadRequestResponse({ description: 'Validation failed' })
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new vehicle for the current user' })
  @ApiCreatedResponse({ type: VehicleDto })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateVehicleDto,
  ): Promise<VehicleDto> {
    return this.vehiclesService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all vehicles owned by the current user' })
  @ApiOkResponse({ type: [VehicleDto] })
  findAll(@CurrentUser() user: AuthUser): Promise<VehicleDto[]> {
    return this.vehiclesService.findAll(user.id);
  }

  @Get(':vehicleId')
  @ApiOperation({ summary: 'Get a single vehicle owned by the current user' })
  @ApiParam({ name: 'vehicleId', format: 'uuid' })
  @ApiOkResponse({ type: VehicleDto })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  findOne(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<VehicleDto> {
    return this.vehiclesService.findOne(vehicleId, user.id);
  }

  @Patch(':vehicleId')
  @ApiOperation({ summary: 'Update a vehicle owned by the current user' })
  @ApiParam({ name: 'vehicleId', format: 'uuid' })
  @ApiOkResponse({ type: VehicleDto })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateVehicleDto,
  ): Promise<VehicleDto> {
    return this.vehiclesService.update(vehicleId, user.id, dto);
  }

  @Patch(':vehicleId/mileage')
  @ApiOperation({
    summary: 'Confirm the real odometer reading',
    description:
      'Sets the confirmed odometer and re-anchors the GPS estimate to it. ' +
      'Trip history is preserved; trips recorded before this reading stop ' +
      'contributing to the estimate so their distance is not counted twice.',
  })
  @ApiParam({ name: 'vehicleId', format: 'uuid' })
  @ApiOkResponse({ type: VehicleDto })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  updateMileage(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMileageDto,
  ): Promise<VehicleDto> {
    return this.vehiclesService.updateMileage(vehicleId, user.id, dto);
  }

  @Delete(':vehicleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a vehicle',
    description: 'Also deletes its trips, maintenance records and expenses.',
  })
  @ApiParam({ name: 'vehicleId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.vehiclesService.remove(vehicleId, user.id);
  }
}
