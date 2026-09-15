import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  ExpenseCategory,
  FuelType,
  MaintenanceType,
} from '../../src/generated/prisma/enums.js';
import { createTestApp } from '../support/app.js';
import { PrismaDouble } from '../support/prisma-double.js';
import { OTHER_USER_ID, signAccessToken, TEST_USER_ID } from '../support/tokens.js';

const VEHICLES = '/api/v1/vehicles';
const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60_000;

const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString();

const thisMonth = (() => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12)).toISOString();
})();

describe('Dashboard', () => {
  const prisma = new PrismaDouble();
  let app: INestApplication;
  let ownerToken: string;
  let otherToken: string;

  beforeAll(async () => {
    app = await createTestApp(prisma);
    ownerToken = await signAccessToken({ sub: TEST_USER_ID });
    otherToken = await signAccessToken({
      sub: OTHER_USER_ID,
      email: 'other@example.com',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.reset();
  });

  const auth = () => ({ Authorization: `Bearer ${ownerToken}` });
  const dashboardUrl = (vehicleId: string) => `${VEHICLES}/${vehicleId}/dashboard`;

  async function createVehicle(token: string, odometerKm = 145000): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(VEHICLES)
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        fuelType: FuelType.HYBRID,
        licensePlate: 'CA1234AA',
        odometerKm,
      })
      .expect(201);

    return response.body.id as string;
  }

  async function seedVehicle(): Promise<string> {
    const id = await createVehicle(ownerToken, 145000);
    const server = app.getHttpServer();

    await request(server)
      .post(`${VEHICLES}/${id}/trips`)
      .set(auth())
      .send({
        startedAt: new Date(Date.now()).toISOString(),
        endedAt: new Date(Date.now() + MINUTE).toISOString(),
        distanceMeters: 18400,
        startLatitude: 42.1354,
        startLongitude: 24.7453,
        endLatitude: 42.6977,
        endLongitude: 23.3219,
      })
      .expect(201);

    await request(server)
      .post(`${VEHICLES}/${id}/maintenance`)
      .set(auth())
      .send({
        type: MaintenanceType.OIL_CHANGE,
        title: 'Oil change',
        date: inDays(-120),
        nextDueMileageKm: 144000,
      })
      .expect(201);

    await request(server)
      .post(`${VEHICLES}/${id}/maintenance`)
      .set(auth())
      .send({
        type: MaintenanceType.INSPECTION,
        title: 'Annual inspection',
        date: inDays(-200),
        nextDueDate: inDays(300),
      })
      .expect(201);

    await request(server)
      .post(`${VEHICLES}/${id}/expenses`)
      .set(auth())
      .send({ category: ExpenseCategory.FUEL, amount: 72.4, date: thisMonth })
      .expect(201);

    await request(server)
      .post(`${VEHICLES}/${id}/expenses`)
      .set(auth())
      .send({ category: ExpenseCategory.INSURANCE, amount: 184.9, date: thisMonth })
      .expect(201);

    return id;
  }

  it('requires authentication', async () => {
    const id = await createVehicle(ownerToken);
    await request(app.getHttpServer()).get(dashboardUrl(id)).expect(401);
  });

  it('returns the correct vehicle', async () => {
    const id = await seedVehicle();

    const response = await request(app.getHttpServer())
      .get(dashboardUrl(id))
      .set(auth())
      .expect(200);

    expect(response.body.vehicle).toMatchObject({
      id,
      userId: TEST_USER_ID,
      make: 'Toyota',
      model: 'Camry',
      fuelType: FuelType.HYBRID,
      licensePlate: 'CA1234AA',
    });
  });

  it('returns both mileage axes', async () => {
    const id = await seedVehicle();

    const response = await request(app.getHttpServer())
      .get(dashboardUrl(id))
      .set(auth())
      .expect(200);

    expect(response.body.mileage.odometerKm).toBe(145000);
    expect(response.body.mileage.estimatedMileageKm).toBe(145018.4);
    expect(response.body.mileage.odometerConfirmedAt).not.toBeNull();
  });

  it('returns recent trips', async () => {
    const id = await seedVehicle();

    const response = await request(app.getHttpServer())
      .get(dashboardUrl(id))
      .set(auth())
      .expect(200);

    expect(response.body.recentTrips).toHaveLength(1);
    expect(response.body.recentTrips[0].distanceMeters).toBe(18400);
  });

  it('returns scheduled maintenance, most urgent first', async () => {
    const id = await seedVehicle();

    const response = await request(app.getHttpServer())
      .get(dashboardUrl(id))
      .set(auth())
      .expect(200);

    expect(response.body.upcomingMaintenance).toHaveLength(2);
    expect(response.body.upcomingMaintenance[0]).toMatchObject({
      title: 'Oil change',
      status: 'OVERDUE',
    });
    expect(response.body.upcomingMaintenance[1].status).toBe('UPCOMING');
  });

  it('leaves unscheduled maintenance out of the upcoming list', async () => {
    const id = await createVehicle(ownerToken);

    await request(app.getHttpServer())
      .post(`${VEHICLES}/${id}/maintenance`)
      .set(auth())
      .send({
        type: MaintenanceType.REPAIR,
        title: 'One-off repair',
        date: inDays(-5),
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(dashboardUrl(id))
      .set(auth())
      .expect(200);

    expect(response.body.upcomingMaintenance).toEqual([]);
  });

  it('returns recent expenses and the month/year totals', async () => {
    const id = await seedVehicle();

    const response = await request(app.getHttpServer())
      .get(dashboardUrl(id))
      .set(auth())
      .expect(200);

    expect(response.body.recentExpenses).toHaveLength(2);
    expect(response.body.expenses.currentMonth).toBe(257.3);
    expect(response.body.expenses.currentYear).toBe(257.3);
    expect(response.body.expenses.byCategory).toEqual([
      { category: ExpenseCategory.INSURANCE, total: 184.9 },
      { category: ExpenseCategory.FUEL, total: 72.4 },
    ]);
  });

  it('is empty but well formed for a brand new vehicle', async () => {
    const id = await createVehicle(ownerToken, 0);

    const response = await request(app.getHttpServer())
      .get(dashboardUrl(id))
      .set(auth())
      .expect(200);

    expect(response.body).toMatchObject({
      mileage: { odometerKm: 0, estimatedMileageKm: 0 },
      recentTrips: [],
      upcomingMaintenance: [],
      recentExpenses: [],
      expenses: { currentMonth: 0, currentYear: 0, byCategory: [] },
    });
  });

  describe('ownership isolation', () => {
    it('will not show another user dashboard', async () => {
      const theirs = await createVehicle(otherToken);

      await request(app.getHttpServer())
        .get(dashboardUrl(theirs))
        .set(auth())
        .expect(404);
    });
  });
});
