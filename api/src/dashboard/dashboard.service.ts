import { Injectable } from '@nestjs/common';
import { ExpensesService } from '../expenses/expenses.service.js';
import { MaintenanceService } from '../maintenance/maintenance.service.js';
import { TripsService } from '../trips/trips.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { DashboardDto } from './dto/dashboard.dto.js';

const RECENT_LIMIT = 5;

@Injectable()
export class DashboardService {
  constructor(
    private readonly vehicles: VehiclesService,
    private readonly trips: TripsService,
    private readonly maintenance: MaintenanceService,
    private readonly expenses: ExpensesService,
  ) {}

  /**
   * Pure aggregation over the feature services — no dashboard-specific tables
   * and no queries of its own. Each service re-checks ownership, so the
   * endpoint cannot accidentally widen access by composing them.
   */
  async getForVehicle(vehicleId: string, userId: string): Promise<DashboardDto> {
    const [vehicle, recentTrips, upcomingMaintenance, recentExpenses, totals] =
      await Promise.all([
        this.vehicles.findOne(vehicleId, userId),
        this.trips.findAll(vehicleId, userId, { limit: RECENT_LIMIT }),
        this.maintenance.findUpcoming(vehicleId, userId),
        this.expenses.findAll(vehicleId, userId, RECENT_LIMIT),
        this.expenses.getTotals(vehicleId, userId),
      ]);

    return {
      vehicle,
      mileage: {
        odometerKm: vehicle.odometerKm,
        estimatedMileageKm: vehicle.estimatedMileageKm,
        odometerConfirmedAt: vehicle.odometerConfirmedAt,
      },
      recentTrips: recentTrips.items,
      upcomingMaintenance,
      recentExpenses,
      expenses: totals,
    };
  }
}
