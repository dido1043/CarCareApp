import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { CreateTripDto } from './dto/create-trip.dto.js';
import { ListTripsQueryDto } from './dto/list-trips-query.dto.js';
import { TripPageDto } from './dto/trip-page.dto.js';
import { TripDto } from './dto/trip.dto.js';
import { TripsService } from './trips.service.js';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiParam({ name: 'vehicleId', format: 'uuid' })
@ApiUnauthorizedResponse({ description: 'Missing, malformed or invalid token' })
@ApiBadRequestResponse({ description: 'Validation failed' })
@ApiNotFoundResponse({ description: 'Vehicle or trip not found' })
@Controller('vehicles/:vehicleId/trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @ApiOperation({
    summary: 'Record a completed trip',
    description:
      'Adds the trip distance to the vehicle GPS mileage estimate atomically.',
  })
  @ApiCreatedResponse({ type: TripDto })
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTripDto,
  ): Promise<TripDto> {
    return this.tripsService.create(vehicleId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List trip history, newest first' })
  @ApiOkResponse({ type: TripPageDto })
  findAll(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: ListTripsQueryDto,
  ): Promise<TripPageDto> {
    return this.tripsService.findAll(vehicleId, user.id, query);
  }

  @Get(':tripId')
  @ApiOperation({ summary: 'Get a single trip' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiOkResponse({ type: TripDto })
  findOne(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<TripDto> {
    return this.tripsService.findOne(vehicleId, tripId, user.id);
  }

  @Delete(':tripId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a trip',
    description: 'Removes its distance from the GPS mileage estimate.',
  })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiNoContentResponse()
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.tripsService.remove(vehicleId, tripId, user.id);
  }
}
