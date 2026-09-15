import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto.js';

/**
 * The confirmed odometer is deliberately not editable here — it re-anchors the
 * GPS estimate, so it goes through `PATCH /vehicles/:vehicleId/mileage`.
 */
export class UpdateVehicleDto extends PartialType(
  OmitType(CreateVehicleDto, ['odometerKm'] as const),
) {}
