import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { nullableDecimalToNumber } from '../../common/decimal.util.js';
import type { MaintenanceRecord } from '../../generated/prisma/client.js';
import { MaintenanceType } from '../../generated/prisma/enums.js';
import { MaintenanceStatus, resolveMaintenanceStatus } from '../maintenance-status.js';

export class MaintenanceRecordDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  vehicleId: string;

  @ApiProperty({ enum: MaintenanceType, enumName: 'MaintenanceType' })
  type: MaintenanceType;

  @ApiProperty({ example: 'Oil and filter change' })
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: 89.9, nullable: true })
  cost: number | null;

  @ApiPropertyOptional({
    example: 140000,
    nullable: true,
    description: 'Odometer reading when the work was done',
  })
  mileageKm: number | null;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional({ nullable: true })
  nextDueDate: Date | null;

  @ApiPropertyOptional({ example: 150000, nullable: true })
  nextDueMileageKm: number | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiPropertyOptional({
    enum: MaintenanceStatus,
    enumName: 'MaintenanceStatus',
    nullable: true,
    description:
      'Derived from the next-due markers and current mileage. Null when the ' +
      'record has no next-due date or mileage, i.e. nothing is scheduled.',
  })
  status: MaintenanceStatus | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toMaintenanceRecordDto(
  record: MaintenanceRecord,
  currentMileageKm: number,
  now?: Date,
): MaintenanceRecordDto {
  return {
    id: record.id,
    vehicleId: record.vehicleId,
    type: record.type,
    title: record.title,
    description: record.description,
    cost: nullableDecimalToNumber(record.cost),
    mileageKm: nullableDecimalToNumber(record.mileageKm),
    date: record.date,
    nextDueDate: record.nextDueDate,
    nextDueMileageKm: nullableDecimalToNumber(record.nextDueMileageKm),
    notes: record.notes,
    status: resolveMaintenanceStatus(record, currentMileageKm, now),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
