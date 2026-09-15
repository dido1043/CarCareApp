import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { currentMileageKm } from '../vehicles/dto/vehicle.dto.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import {
  MaintenanceRecordDto,
  toMaintenanceRecordDto,
} from './dto/maintenance-record.dto.js';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto.js';
import type { MaintenanceStatus } from './maintenance-status.js';

/** How many scheduled services the dashboard shows at once. */
const UPCOMING_LIMIT = 5;

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
  ) {}

  async create(
    vehicleId: string,
    userId: string,
    dto: CreateMaintenanceDto,
  ): Promise<MaintenanceRecordDto> {
    const vehicle = await this.vehicles.assertOwned(vehicleId, userId);

    const record = await this.prisma.maintenanceRecord.create({
      data: {
        vehicleId,
        type: dto.type,
        title: dto.title,
        description: dto.description ?? null,
        cost: dto.cost ?? null,
        mileageKm: dto.mileageKm ?? null,
        date: dto.date,
        nextDueDate: dto.nextDueDate ?? null,
        nextDueMileageKm: dto.nextDueMileageKm ?? null,
        notes: dto.notes ?? null,
      },
    });

    return toMaintenanceRecordDto(record, currentMileageKm(vehicle));
  }

  async findAll(
    vehicleId: string,
    userId: string,
  ): Promise<MaintenanceRecordDto[]> {
    const vehicle = await this.vehicles.assertOwned(vehicleId, userId);

    const records = await this.prisma.maintenanceRecord.findMany({
      where: { vehicleId, vehicle: { userId } },
      orderBy: { date: 'desc' },
    });

    const mileage = currentMileageKm(vehicle);
    return records.map((record) => toMaintenanceRecordDto(record, mileage));
  }

  /**
   * Scheduled services only, most urgent first. Used by the dashboard, so it
   * sorts by status severity rather than by date.
   */
  async findUpcoming(
    vehicleId: string,
    userId: string,
  ): Promise<MaintenanceRecordDto[]> {
    const vehicle = await this.vehicles.assertOwned(vehicleId, userId);

    const records = await this.prisma.maintenanceRecord.findMany({
      where: {
        vehicleId,
        vehicle: { userId },
        OR: [
          { nextDueDate: { not: null } },
          { nextDueMileageKm: { not: null } },
        ],
      },
      orderBy: { date: 'desc' },
    });

    const mileage = currentMileageKm(vehicle);

    return records
      .map((record) => toMaintenanceRecordDto(record, mileage))
      .sort((a, b) => urgency(a.status) - urgency(b.status))
      .slice(0, UPCOMING_LIMIT);
  }

  async findOne(
    vehicleId: string,
    recordId: string,
    userId: string,
  ): Promise<MaintenanceRecordDto> {
    const vehicle = await this.vehicles.assertOwned(vehicleId, userId);

    const record = await this.prisma.maintenanceRecord.findFirst({
      where: { id: recordId, vehicleId, vehicle: { userId } },
    });

    if (!record) {
      throw new NotFoundException(`Maintenance record ${recordId} not found`);
    }

    return toMaintenanceRecordDto(record, currentMileageKm(vehicle));
  }

  async update(
    vehicleId: string,
    recordId: string,
    userId: string,
    dto: UpdateMaintenanceDto,
  ): Promise<MaintenanceRecordDto> {
    const vehicle = await this.vehicles.assertOwned(vehicleId, userId);

    const { count } = await this.prisma.maintenanceRecord.updateMany({
      where: { id: recordId, vehicleId, vehicle: { userId } },
      data: dto,
    });

    if (count === 0) {
      throw new NotFoundException(`Maintenance record ${recordId} not found`);
    }

    const record = await this.prisma.maintenanceRecord.findFirstOrThrow({
      where: { id: recordId, vehicleId, vehicle: { userId } },
    });

    return toMaintenanceRecordDto(record, currentMileageKm(vehicle));
  }

  async remove(
    vehicleId: string,
    recordId: string,
    userId: string,
  ): Promise<void> {
    await this.vehicles.assertOwned(vehicleId, userId);

    const { count } = await this.prisma.maintenanceRecord.deleteMany({
      where: { id: recordId, vehicleId, vehicle: { userId } },
    });

    if (count === 0) {
      throw new NotFoundException(`Maintenance record ${recordId} not found`);
    }
  }
}

const URGENCY: Record<MaintenanceStatus, number> = {
  OVERDUE: 0,
  DUE: 1,
  UPCOMING: 2,
};

function urgency(status: MaintenanceStatus | null): number {
  return status === null ? URGENCY.UPCOMING + 1 : URGENCY[status];
}
