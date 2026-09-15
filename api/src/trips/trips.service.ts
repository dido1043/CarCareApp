import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { Vehicle } from '../generated/prisma/client.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { CreateTripDto } from './dto/create-trip.dto.js';
import {
  DEFAULT_TRIP_PAGE_SIZE,
  ListTripsQueryDto,
} from './dto/list-trips-query.dto.js';
import { TripPageDto } from './dto/trip-page.dto.js';
import { metersToKm, toTripDto, TripDto } from './dto/trip.dto.js';

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
  ) {}

  /**
   * Stores a finished trip and moves the vehicle's GPS estimate on by its
   * distance, in one transaction so the two can never disagree.
   */
  async create(
    vehicleId: string,
    userId: string,
    dto: CreateTripDto,
  ): Promise<TripDto> {
    const vehicle = await this.vehicles.assertOwned(vehicleId, userId);

    if (dto.endedAt.getTime() < dto.startedAt.getTime()) {
      throw new BadRequestException('endedAt must not be before startedAt');
    }

    const countsTowardEstimate = isAfterBaseline(vehicle, dto.endedAt);

    const trip = await this.prisma.$transaction(async (tx) => {
      const created = await tx.trip.create({
        data: {
          vehicleId,
          startedAt: dto.startedAt,
          endedAt: dto.endedAt,
          distanceMeters: dto.distanceMeters,
          startLatitude: dto.startLatitude,
          startLongitude: dto.startLongitude,
          endLatitude: dto.endLatitude,
          endLongitude: dto.endLongitude,
        },
      });

      if (countsTowardEstimate) {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: {
            estimatedMileageKm: { increment: metersToKm(dto.distanceMeters) },
          },
        });
      }

      return created;
    });

    return toTripDto(trip);
  }

  async findAll(
    vehicleId: string,
    userId: string,
    query: ListTripsQueryDto,
  ): Promise<TripPageDto> {
    await this.vehicles.assertOwned(vehicleId, userId);

    const limit = query.limit ?? DEFAULT_TRIP_PAGE_SIZE;
    const offset = query.offset ?? 0;

    const [trips, total] = await Promise.all([
      this.prisma.trip.findMany({
        where: { vehicleId, vehicle: { userId } },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.trip.count({ where: { vehicleId, vehicle: { userId } } }),
    ]);

    return { items: trips.map(toTripDto), total, limit, offset };
  }

  async findOne(
    vehicleId: string,
    tripId: string,
    userId: string,
  ): Promise<TripDto> {
    // The ownership chain is part of the query, so a trip belonging to another
    // user simply does not match.
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, vehicleId, vehicle: { userId } },
    });

    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    return toTripDto(trip);
  }

  /**
   * Deleting a trip takes its distance back out of the estimate, but only if it
   * was contributing in the first place — a trip from before the last confirmed
   * reading never was.
   */
  async remove(
    vehicleId: string,
    tripId: string,
    userId: string,
  ): Promise<void> {
    await this.vehicles.assertOwned(vehicleId, userId);

    await this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id: tripId, vehicleId, vehicle: { userId } },
      });

      if (!trip) {
        throw new NotFoundException(`Trip ${tripId} not found`);
      }

      await tx.trip.delete({ where: { id: trip.id } });

      const vehicle = await tx.vehicle.findUniqueOrThrow({
        where: { id: vehicleId },
      });

      if (!isAfterBaseline(vehicle, trip.endedAt)) {
        return;
      }

      // Never let the estimate drop below the last reading the driver
      // confirmed: that number is ground truth regardless of trip history.
      const estimate =
        vehicle.estimatedMileageKm.toNumber() -
        metersToKm(trip.distanceMeters);

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          estimatedMileageKm: Math.max(
            estimate,
            vehicle.odometerKm.toNumber(),
          ),
        },
      });
    });
  }
}

/**
 * A trip moves the estimate only when it happened after the last confirmed
 * odometer reading. Anything earlier is already reflected in that reading, so
 * counting it again would inflate the estimate.
 */
function isAfterBaseline(vehicle: Vehicle, endedAt: Date): boolean {
  return (
    vehicle.odometerConfirmedAt === null ||
    endedAt.getTime() > vehicle.odometerConfirmedAt.getTime()
  );
}
