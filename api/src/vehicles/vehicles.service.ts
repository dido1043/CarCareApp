import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type.js';
import { PrismaService } from '../database/prisma.service.js';
import type { Vehicle } from '../generated/prisma/client.js';
import { UsersService } from '../users/users.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateMileageDto } from './dto/update-mileage.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { toVehicleDto, VehicleDto } from './dto/vehicle.dto.js';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  /**
   * The single ownership gate for the whole API. Trips, maintenance and
   * expenses all hang off a vehicle, so every one of those routes starts here.
   * A vehicle owned by somebody else is reported as missing rather than
   * forbidden, so a caller cannot probe for ids that exist.
   */
  async assertOwned(vehicleId: string, userId: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} not found`);
    }

    return vehicle;
  }

  async create(user: AuthUser, dto: CreateVehicleDto): Promise<VehicleDto> {
    // Supabase Auth owns the identity; the local profile row that `userId`
    // points at is created on first use.
    await this.users.ensureProvisioned(user);

    const odometerKm = dto.odometerKm ?? 0;
    const vehicle = await this.prisma.vehicle.create({
      data: {
        userId: user.id,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        fuelType: dto.fuelType,
        engine: dto.engine ?? null,
        licensePlate: dto.licensePlate ?? null,
        vin: dto.vin ?? null,
        odometerKm,
        // The reading given at registration is the first baseline, so the
        // estimate starts level with it rather than at zero.
        estimatedMileageKm: odometerKm,
        odometerConfirmedAt: dto.odometerKm === undefined ? null : new Date(),
      },
    });

    return toVehicleDto(vehicle);
  }

  async findAll(userId: string): Promise<VehicleDto[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map(toVehicleDto);
  }

  async findOne(vehicleId: string, userId: string): Promise<VehicleDto> {
    return toVehicleDto(await this.assertOwned(vehicleId, userId));
  }

  async update(
    vehicleId: string,
    userId: string,
    dto: UpdateVehicleDto,
  ): Promise<VehicleDto> {
    await this.assertOwned(vehicleId, userId);

    const vehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: dto,
    });

    return toVehicleDto(vehicle);
  }

  /**
   * Records a reading the driver confirmed by hand.
   *
   * The confirmed number supersedes the GPS estimate by definition, so the
   * estimate is re-anchored to it and `odometerConfirmedAt` moves to now. Trips
   * recorded before this moment stay in the history but stop contributing to
   * the estimate, which is what prevents their distance from being counted a
   * second time on top of a reading that already includes it.
   */
  async updateMileage(
    vehicleId: string,
    userId: string,
    dto: UpdateMileageDto,
  ): Promise<VehicleDto> {
    await this.assertOwned(vehicleId, userId);

    const vehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        odometerKm: dto.odometerKm,
        estimatedMileageKm: dto.odometerKm,
        odometerConfirmedAt: new Date(),
      },
    });

    return toVehicleDto(vehicle);
  }

  /** Cascades to the vehicle's trips, maintenance records and expenses. */
  async remove(vehicleId: string, userId: string): Promise<void> {
    await this.assertOwned(vehicleId, userId);
    await this.prisma.vehicle.delete({ where: { id: vehicleId } });
  }
}
