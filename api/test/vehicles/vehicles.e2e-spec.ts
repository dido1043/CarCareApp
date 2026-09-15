import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FuelType } from '../../src/generated/prisma/enums.js';
import { createTestApp } from '../support/app.js';
import { PrismaDouble } from '../support/prisma-double.js';
import { OTHER_USER_ID, signAccessToken, TEST_USER_ID } from '../support/tokens.js';

const VEHICLES = '/api/v1/vehicles';

const validVehicle = {
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  fuelType: FuelType.PETROL,
  licensePlate: 'CA1234AA',
  odometerKm: 145060,
};

describe('Vehicles', () => {
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

  const post = (token: string, body: object = validVehicle) =>
    request(app.getHttpServer())
      .post(VEHICLES)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  async function createVehicle(token: string): Promise<string> {
    const response = await post(token).expect(201);
    return response.body.id as string;
  }

  it('requires authentication on every route', async () => {
    await request(app.getHttpServer()).get(VEHICLES).expect(401);
    await request(app.getHttpServer()).post(VEHICLES).send(validVehicle).expect(401);
  });

  it('creates a vehicle and provisions the local user profile', async () => {
    const response = await post(ownerToken).expect(201);

    expect(response.body).toMatchObject({
      userId: TEST_USER_ID,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      fuelType: FuelType.PETROL,
      odometerKm: 145060,
      // The registration reading becomes the first mileage baseline.
      estimatedMileageKm: 145060,
    });
    expect(response.body.odometerConfirmedAt).not.toBeNull();
    expect(prisma.user.rows).toHaveLength(1);
    expect(prisma.user.rows[0].id).toBe(TEST_USER_ID);
  });

  it('starts mileage at zero when no odometer is supplied', async () => {
    const { odometerKm: _odometerKm, ...withoutOdometer } = validVehicle;
    const response = await post(ownerToken, withoutOdometer).expect(201);

    expect(response.body.odometerKm).toBe(0);
    expect(response.body.estimatedMileageKm).toBe(0);
    expect(response.body.odometerConfirmedAt).toBeNull();
  });

  it('rejects invalid input', async () => {
    await post(ownerToken, { ...validVehicle, year: 1700 }).expect(400);
    await post(ownerToken, { ...validVehicle, fuelType: 'STEAM' }).expect(400);
    await post(ownerToken, { ...validVehicle, vin: 'too-short' }).expect(400);
    await post(ownerToken, { make: 'Toyota' }).expect(400);
  });

  it('rejects unknown fields', async () => {
    await post(ownerToken, { ...validVehicle, isAdmin: true }).expect(400);
  });

  it('never takes ownership from the request body', async () => {
    const response = await post(ownerToken, {
      ...validVehicle,
      userId: OTHER_USER_ID,
    });

    // `userId` is not part of the DTO, so the whitelist rejects it outright.
    expect(response.status).toBe(400);
  });

  it('lists only the caller own vehicles', async () => {
    await createVehicle(ownerToken);
    await createVehicle(otherToken);

    const response = await request(app.getHttpServer())
      .get(VEHICLES)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].userId).toBe(TEST_USER_ID);
  });

  it('gets a vehicle it owns', async () => {
    const id = await createVehicle(ownerToken);

    const response = await request(app.getHttpServer())
      .get(`${VEHICLES}/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.id).toBe(id);
  });

  it('updates a vehicle it owns', async () => {
    const id = await createVehicle(ownerToken);

    const response = await request(app.getHttpServer())
      .patch(`${VEHICLES}/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ licensePlate: 'CB9999BB', engine: '2.5 Dynamic Force' })
      .expect(200);

    expect(response.body.licensePlate).toBe('CB9999BB');
    expect(response.body.engine).toBe('2.5 Dynamic Force');
  });

  it('will not let the general update endpoint move the odometer', async () => {
    const id = await createVehicle(ownerToken);

    await request(app.getHttpServer())
      .patch(`${VEHICLES}/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ odometerKm: 999999 })
      .expect(400);
  });

  it('deletes a vehicle it owns', async () => {
    const id = await createVehicle(ownerToken);

    await request(app.getHttpServer())
      .delete(`${VEHICLES}/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`${VEHICLES}/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  describe('ownership isolation', () => {
    it('hides another user vehicle behind a 404 on every route', async () => {
      const id = await createVehicle(otherToken);
      const auth = { Authorization: `Bearer ${ownerToken}` };
      const server = app.getHttpServer();

      await request(server).get(`${VEHICLES}/${id}`).set(auth).expect(404);
      await request(server).patch(`${VEHICLES}/${id}`).set(auth).send({ make: 'Hijacked' }).expect(404);
      await request(server).patch(`${VEHICLES}/${id}/mileage`).set(auth).send({ odometerKm: 1 }).expect(404);
      await request(server).delete(`${VEHICLES}/${id}`).set(auth).expect(404);

      // ...and the vehicle is untouched.
      expect(prisma.vehicle.rows).toHaveLength(1);
      expect(prisma.vehicle.rows[0].make).toBe('Toyota');
    });
  });
});
