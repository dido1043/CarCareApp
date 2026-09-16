import { toApiDate } from './date';
import type {
  CreateExpenseInput,
  CreateMaintenanceInput,
  CreateVehicleInput,
  UpdateExpenseInput,
  UpdateMaintenanceInput,
  UpdateVehicleInput,
} from '@/types';
import type {
  ExpenseFormOutput,
  MaintenanceFormOutput,
  VehicleFormOutput,
} from '@/validation/schemas';

/**
 * Form output to API payload.
 *
 * The API's validation pipe runs with `forbidNonWhitelisted`, so a stray key
 * fails the whole request — and an explicit `undefined` is dropped by
 * `JSON.stringify`, which is how optional fields are left unset.
 */

export function toVehiclePayload(values: VehicleFormOutput): CreateVehicleInput {
  return {
    make: values.make,
    model: values.model,
    year: values.year,
    fuelType: values.fuelType,
    engine: values.engine,
    licensePlate: values.licensePlate,
    vin: values.vin,
    odometerKm: values.odometerKm,
  };
}

export function toMaintenancePayload(
  values: MaintenanceFormOutput,
): CreateMaintenanceInput {
  return {
    type: values.type,
    title: values.title,
    description: values.description,
    cost: values.cost,
    mileageKm: values.mileageKm,
    date: toApiDate(values.date),
    nextDueDate: values.nextDueDate ? toApiDate(values.nextDueDate) : undefined,
    nextDueMileageKm: values.nextDueMileageKm,
    notes: values.notes,
  };
}

export function toExpensePayload(values: ExpenseFormOutput): CreateExpenseInput {
  return {
    category: values.category,
    amount: values.amount,
    currency: values.currency,
    date: toApiDate(values.date),
    mileageKm: values.mileageKm,
    description: values.description,
  };
}

/**
 * Update payloads differ from create in one way that matters: a field the user
 * cleared must be sent as `null` to unset it server-side, where `undefined`
 * would simply leave the stored value alone.
 */
export function toMaintenanceUpdatePayload(
  values: MaintenanceFormOutput,
): UpdateMaintenanceInput {
  return {
    ...toMaintenancePayload(values),
    description: values.description ?? null,
    cost: values.cost ?? null,
    mileageKm: values.mileageKm ?? null,
    nextDueDate: values.nextDueDate ? toApiDate(values.nextDueDate) : null,
    nextDueMileageKm: values.nextDueMileageKm ?? null,
    notes: values.notes ?? null,
  };
}

export function toExpenseUpdatePayload(values: ExpenseFormOutput): UpdateExpenseInput {
  return {
    ...toExpensePayload(values),
    mileageKm: values.mileageKm ?? null,
    description: values.description ?? null,
  };
}

export function toVehicleUpdatePayload(values: VehicleFormOutput): UpdateVehicleInput {
  return {
    make: values.make,
    model: values.model,
    year: values.year,
    fuelType: values.fuelType,
    engine: values.engine ?? null,
    licensePlate: values.licensePlate ?? null,
    vin: values.vin ?? null,
  };
}
