import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  FuelType,
  MaintenanceType,
} from '../../src/generated/prisma/enums.js';
import { createTestApp } from '../support/app.js';
import { PrismaDouble } from '../support/prisma-double.js';
import { OTHER_USER_ID, signAccessToken, TEST_USER_ID } from '../support/tokens.js';

const VEHICLES = '/api/v1/vehicles';
const DAY = 24 * 60 * 60 * 1000;

const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString();

const oilChange = {
  type: MaintenanceType.OIL_CHANGE,
  title: 'Oil and filter change',
  description: 'Castrol 5W-30, OEM filter',
  cost: 89.9,
  mileageKm: 140000,
  date: inDays(-120),
  nextDueDate: inDays(200),
  nextDueMileageKm: 155000,
  notes: 'Check the cabin filter next time',
};

describe('Maintenance', () => {
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

  async function createVehicle(token: string, odometerKm = 145000): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(VEHICLES)
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        fuelType: FuelType.PETROL,
        odometerKm,
      })
      .expect(201);

    return response.body.id as string;
  }

  const url = (vehicleId: string) => `${VEHICLES}/${vehicleId}/maintenance`;

  const post = (vehicleId: string, token: string, body: object = oilChange) =>
    request(app.getHttpServer())
      .post(url(vehicleId))
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('requires authentication', async () => {
    const id = await createVehicle(ownerToken);
    await request(app.getHttpServer()).get(url(id)).expect(401);
    await request(app.getHttpServer()).post(url(id)).send(oilChange).expect(401);
  });

  it('creates a maintenance record', async () => {
    const id = await createVehicle(ownerToken);
    const response = await post(id, ownerToken).expect(201);

    expect(response.body).toMatchObject({
      vehicleId: id,
      type: MaintenanceType.OIL_CHANGE,
      title: 'Oil and filter change',
      cost: 89.9,
      mileageKm: 140000,
      nextDueMileageKm: 155000,
      status: 'UPCOMING',
    });
  });

  it('rejects invalid input and unknown fields', async () => {
    const id = await createVehicle(ownerToken);

    await post(id, ownerToken, { ...oilChange, type: 'ENGINE_SWAP' }).expect(400);
    await post(id, ownerToken, { ...oilChange, cost: -5 }).expect(400);
    await post(id, ownerToken, { ...oilChange, date: 'not-a-date' }).expect(400);
    await post(id, ownerToken, { ...oilChange, title: '' }).expect(400);
    await post(id, ownerToken, { ...oilChange, vehicleId: 'x' }).expect(400);
    await post(id, ownerToken, { title: 'No type' }).expect(400);
  });

  it('lists maintenance history, newest first', async () => {
    const id = await createVehicle(ownerToken);
    await post(id, ownerToken, { ...oilChange, date: inDays(-300), title: 'Older' }).expect(201);
    await post(id, ownerToken, { ...oilChange, date: inDays(-10), title: 'Newer' }).expect(201);

    const response = await request(app.getHttpServer())
      .get(url(id))
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.map((r: { title: string }) => r.title)).toEqual([
      'Newer',
      'Older',
    ]);
  });

  it('gets a single record', async () => {
    const id = await createVehicle(ownerToken);
    const recordId = (await post(id, ownerToken).expect(201)).body.id;

    const response = await request(app.getHttpServer())
      .get(`${url(id)}/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.id).toBe(recordId);
  });

  it('updates a record', async () => {
    const id = await createVehicle(ownerToken);
    const recordId = (await post(id, ownerToken).expect(201)).body.id;

    const response = await request(app.getHttpServer())
      .patch(`${url(id)}/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ cost: 99.5, title: 'Oil change (revised)' })
      .expect(200);

    expect(response.body.cost).toBe(99.5);
    expect(response.body.title).toBe('Oil change (revised)');
  });

  it('deletes a record', async () => {
    const id = await createVehicle(ownerToken);
    const recordId = (await post(id, ownerToken).expect(201)).body.id;

    await request(app.getHttpServer())
      .delete(`${url(id)}/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`${url(id)}/${recordId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  describe('derived status', () => {
    it('is OVERDUE once the mileage marker is passed', async () => {
      const id = await createVehicle(ownerToken, 145000);
      const response = await post(id, ownerToken, {
        ...oilChange,
        nextDueDate: inDays(200),
        nextDueMileageKm: 144000,
      }).expect(201);

      expect(response.body.status).toBe('OVERDUE');
    });

    it('is DUE when the date is close', async () => {
      const id = await createVehicle(ownerToken, 145000);
      const response = await post(id, ownerToken, {
        ...oilChange,
        nextDueDate: inDays(3),
        nextDueMileageKm: 900000,
      }).expect(201);

      expect(response.body.status).toBe('DUE');
    });

    it('is null when nothing is scheduled', async () => {
      const id = await createVehicle(ownerToken);
      const { nextDueDate: _d, nextDueMileageKm: _km, ...unscheduled } = oilChange;
      const response = await post(id, ownerToken, unscheduled).expect(201);

      expect(response.body.status).toBeNull();
    });

    it('follows the GPS estimate as trips accumulate', async () => {
      const id = await createVehicle(ownerToken, 145000);
      const recordId = (
        await post(id, ownerToken, {
          ...oilChange,
          nextDueDate: inDays(900),
          // 800 km away: outside the 500 km DUE window to begin with.
          nextDueMileageKm: 145800,
        }).expect(201)
      ).body.id;

      const before = await request(app.getHttpServer())
        .get(`${url(id)}/${recordId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(before.body.status).toBe('UPCOMING');

      // 400 km of GPS distance leaves 400 km, inside the DUE window.
      await request(app.getHttpServer())
        .post(`${VEHICLES}/${id}/trips`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          startedAt: new Date(Date.now()).toISOString(),
          endedAt: new Date(Date.now() + 60_000).toISOString(),
          distanceMeters: 400_000,
          startLatitude: 42.1354,
          startLongitude: 24.7453,
          endLatitude: 42.6977,
          endLongitude: 23.3219,
        })
        .expect(201);

      const after = await request(app.getHttpServer())
        .get(`${url(id)}/${recordId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(after.body.status).toBe('DUE');
    });
  });

  describe('ownership isolation', () => {
    it('hides another user records behind a 404', async () => {
      const id = await createVehicle(otherToken);
      const recordId = (await post(id, otherToken).expect(201)).body.id;
      const auth = { Authorization: `Bearer ${ownerToken}` };
      const server = app.getHttpServer();

      await request(server).post(url(id)).set(auth).send(oilChange).expect(404);
      await request(server).get(url(id)).set(auth).expect(404);
      await request(server).get(`${url(id)}/${recordId}`).set(auth).expect(404);
      await request(server).patch(`${url(id)}/${recordId}`).set(auth).send({ cost: 1 }).expect(404);
      await request(server).delete(`${url(id)}/${recordId}`).set(auth).expect(404);

      expect(prisma.maintenanceRecord.rows).toHaveLength(1);
      expect(prisma.maintenanceRecord.rows[0].cost.toNumber()).toBe(89.9);
    });
  });
});
