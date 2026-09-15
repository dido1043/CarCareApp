import { NotFoundException } from '@nestjs/common';
import { ExpensesService } from '../../src/expenses/expenses.service.js';
import { MaintenanceService } from '../../src/maintenance/maintenance.service.js';
import { TripsService } from '../../src/trips/trips.service.js';
import { VehiclesService } from '../../src/vehicles/vehicles.service.js';
import { TEST_USER_ID } from '../support/tokens.js';

/**
 * The e2e suites prove the ownership rules behave correctly. These tests pin
 * the shape of the queries themselves, so that an "optimisation" to a bare
 * `findUnique({ where: { id } })` — which would hand one user another user's
 * row — fails here rather than silently shipping.
 */
describe('ownership constraints in queries', () => {
  const VEHICLE_ID = '33333333-3333-4333-8333-333333333333';
  const RESOURCE_ID = '44444444-4444-4444-8444-444444444444';

  const ownedVehicle = {
    id: VEHICLE_ID,
    userId: TEST_USER_ID,
    odometerKm: { toNumber: () => 145000 },
    estimatedMileageKm: { toNumber: () => 145018.4 },
    odometerConfirmedAt: null,
  };

  const vehicles = {
    assertOwned: vi.fn().mockResolvedValue(ownedVehicle),
  } as unknown as VehiclesService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scopes a vehicle lookup to the caller', async () => {
    const prisma = { vehicle: { findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new VehiclesService(prisma as never, {} as never);

    await expect(service.assertOwned(VEHICLE_ID, TEST_USER_ID)).rejects.toThrow(
      NotFoundException,
    );

    expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
      where: { id: VEHICLE_ID, userId: TEST_USER_ID },
    });
  });

  it('walks the full chain when reading a trip', async () => {
    const prisma = { trip: { findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new TripsService(prisma as never, vehicles);

    await expect(
      service.findOne(VEHICLE_ID, RESOURCE_ID, TEST_USER_ID),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.trip.findFirst).toHaveBeenCalledWith({
      where: {
        id: RESOURCE_ID,
        vehicleId: VEHICLE_ID,
        vehicle: { userId: TEST_USER_ID },
      },
    });
  });

  it('walks the full chain when reading a maintenance record', async () => {
    const prisma = {
      maintenanceRecord: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const service = new MaintenanceService(prisma as never, vehicles);

    await expect(
      service.findOne(VEHICLE_ID, RESOURCE_ID, TEST_USER_ID),
    ).rejects.toThrow(NotFoundException);

    expect(vehicles.assertOwned).toHaveBeenCalledWith(VEHICLE_ID, TEST_USER_ID);
    expect(prisma.maintenanceRecord.findFirst).toHaveBeenCalledWith({
      where: {
        id: RESOURCE_ID,
        vehicleId: VEHICLE_ID,
        vehicle: { userId: TEST_USER_ID },
      },
    });
  });

  it('walks the full chain when reading an expense', async () => {
    const prisma = { expense: { findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new ExpensesService(prisma as never, vehicles);

    await expect(
      service.findOne(VEHICLE_ID, RESOURCE_ID, TEST_USER_ID),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.expense.findFirst).toHaveBeenCalledWith({
      where: {
        id: RESOURCE_ID,
        vehicleId: VEHICLE_ID,
        vehicle: { userId: TEST_USER_ID },
      },
    });
  });

  it('scopes expense aggregation to the caller vehicle', async () => {
    const sum = { _sum: { amount: null } };
    const prisma = {
      expense: {
        aggregate: vi.fn().mockResolvedValue(sum),
        groupBy: vi.fn().mockResolvedValue([]),
        findMany: vi.fn(),
      },
    };
    const service = new ExpensesService(prisma as never, vehicles);

    await service.getTotals(VEHICLE_ID, TEST_USER_ID, new Date('2026-09-15T12:00:00Z'));

    for (const call of prisma.expense.aggregate.mock.calls) {
      expect(call[0].where).toMatchObject({
        vehicleId: VEHICLE_ID,
        vehicle: { userId: TEST_USER_ID },
      });
    }
    expect(prisma.expense.groupBy.mock.calls[0][0].where).toMatchObject({
      vehicleId: VEHICLE_ID,
      vehicle: { userId: TEST_USER_ID },
    });

    // Totals come from the database, never from rows pulled into the process.
    expect(prisma.expense.findMany).not.toHaveBeenCalled();
  });

  it('uses the correct month and year windows', async () => {
    const prisma = {
      expense: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }),
        groupBy: vi.fn().mockResolvedValue([]),
      },
    };
    const service = new ExpensesService(prisma as never, vehicles);

    await service.getTotals(VEHICLE_ID, TEST_USER_ID, new Date('2026-09-15T12:00:00Z'));

    const [month, year] = prisma.expense.aggregate.mock.calls;
    expect(month[0].where.date.gte).toEqual(new Date('2026-09-01T00:00:00.000Z'));
    expect(year[0].where.date.gte).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });
});
