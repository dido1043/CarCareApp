import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FuelType } from '../../src/generated/prisma/enums.js';
import { createTestApp } from '../support/app.js';
import { PrismaDouble } from '../support/prisma-double.js';
import { OTHER_USER_ID, signAccessToken, TEST_USER_ID } from '../support/tokens.js';

const VEHICLES = '/api/v1/vehicles';
const MINUTE = 60_000;

const COORDINATES = {
  startLatitude: 42.1354,
  startLongitude: 24.7453,
  endLatitude: 42.6977,
  endLongitude: 23.3219,
};

/**
 * Trips are dated relative to now so they always land after the mileage
 * baseline the vehicle gets when it is registered.
 */
function tripEndingIn(minutes: number, distanceMeters = 18400) {
  const endedAt = new Date(Date.now() + minutes * MINUTE);
  const startedAt = new Date(endedAt.getTime() - 30 * MINUTE);

  return {
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    distanceMeters,
    ...COORDINATES,
  };
}

describe('Trips and mileage', () => {
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
        fuelType: FuelType.DIESEL,
        odometerKm,
      })
      .expect(201);

    return response.body.id as string;
  }

  const tripsUrl = (vehicleId: string) => `${VEHICLES}/${vehicleId}/trips`;

  const postTrip = (
    vehicleId: string,
    token: string,
    body: object = tripEndingIn(1),
  ) =>
    request(app.getHttpServer())
      .post(tripsUrl(vehicleId))
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const getVehicle = async (vehicleId: string, token: string) =>
    (
      await request(app.getHttpServer())
        .get(`${VEHICLES}/${vehicleId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
    ).body;

  const confirmOdometer = (vehicleId: string, token: string, odometerKm: number) =>
    request(app.getHttpServer())
      .patch(`${VEHICLES}/${vehicleId}/mileage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ odometerKm });

  it('requires authentication', async () => {
    const id = await createVehicle(ownerToken);
    await request(app.getHttpServer()).get(tripsUrl(id)).expect(401);
    await request(app.getHttpServer()).post(tripsUrl(id)).send(tripEndingIn(1)).expect(401);
  });

  it('creates a trip and returns it', async () => {
    const id = await createVehicle(ownerToken);
    const response = await postTrip(id, ownerToken).expect(201);

    expect(response.body).toMatchObject({
      vehicleId: id,
      distanceMeters: 18400,
      distanceKm: 18.4,
      startLatitude: 42.1354,
      endLongitude: 23.3219,
    });
  });

  it('adds trip distance to the GPS estimate without touching the odometer', async () => {
    const id = await createVehicle(ownerToken, 145000);

    await postTrip(id, ownerToken, tripEndingIn(1, 18400)).expect(201);
    await postTrip(id, ownerToken, tripEndingIn(2, 5600)).expect(201);

    const vehicle = await getVehicle(id, ownerToken);
    expect(vehicle.odometerKm).toBe(145000);
    expect(vehicle.estimatedMileageKm).toBe(145024);
  });

  it('rejects a trip that ends before it starts', async () => {
    const id = await createVehicle(ownerToken);
    const trip = tripEndingIn(1);

    await postTrip(id, ownerToken, {
      ...trip,
      startedAt: trip.endedAt,
      endedAt: trip.startedAt,
    }).expect(400);
  });

  it('rejects invalid coordinates, distance and unknown fields', async () => {
    const id = await createVehicle(ownerToken);

    await postTrip(id, ownerToken, { ...tripEndingIn(1), startLatitude: 120 }).expect(400);
    await postTrip(id, ownerToken, { ...tripEndingIn(1), endLongitude: 200 }).expect(400);
    await postTrip(id, ownerToken, { ...tripEndingIn(1), distanceMeters: -1 }).expect(400);
    await postTrip(id, ownerToken, { ...tripEndingIn(1), vehicleId: 'x' }).expect(400);
  });

  it('lists trip history newest first, with paging', async () => {
    const id = await createVehicle(ownerToken);
    const earlier = tripEndingIn(1);
    const later = tripEndingIn(120);

    await postTrip(id, ownerToken, earlier).expect(201);
    await postTrip(id, ownerToken, later).expect(201);

    const response = await request(app.getHttpServer())
      .get(tripsUrl(id))
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.total).toBe(2);
    expect(response.body.items[0].startedAt).toBe(later.startedAt);
    expect(response.body.items[1].startedAt).toBe(earlier.startedAt);

    const paged = await request(app.getHttpServer())
      .get(`${tripsUrl(id)}?limit=1&offset=1`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(paged.body.items).toHaveLength(1);
    expect(paged.body.items[0].startedAt).toBe(earlier.startedAt);
    expect(paged.body.total).toBe(2);
  });

  it('gets a single trip', async () => {
    const id = await createVehicle(ownerToken);
    const tripId = (await postTrip(id, ownerToken).expect(201)).body.id;

    const response = await request(app.getHttpServer())
      .get(`${tripsUrl(id)}/${tripId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.id).toBe(tripId);
  });

  it('takes the distance back out of the estimate when a trip is deleted', async () => {
    const id = await createVehicle(ownerToken, 145000);
    const tripId = (await postTrip(id, ownerToken).expect(201)).body.id;

    expect((await getVehicle(id, ownerToken)).estimatedMileageKm).toBe(145018.4);

    await request(app.getHttpServer())
      .delete(`${tripsUrl(id)}/${tripId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    expect((await getVehicle(id, ownerToken)).estimatedMileageKm).toBe(145000);
  });

  describe('confirmed odometer readings', () => {
    it('re-anchors the estimate and keeps trip history', async () => {
      const id = await createVehicle(ownerToken, 145000);
      await postTrip(id, ownerToken).expect(201);

      const confirmed = await confirmOdometer(id, ownerToken, 145060).expect(200);

      expect(confirmed.body.odometerKm).toBe(145060);
      expect(confirmed.body.estimatedMileageKm).toBe(145060);

      const history = await request(app.getHttpServer())
        .get(tripsUrl(id))
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(history.body.total).toBe(1);
    });

    it('does not count a trip that predates the confirmed reading', async () => {
      const id = await createVehicle(ownerToken, 145000);
      await confirmOdometer(id, ownerToken, 145060).expect(200);

      // A trip the phone had queued offline, finished before the driver read
      // the dashboard: its distance is already inside the confirmed number.
      await postTrip(id, ownerToken, {
        ...COORDINATES,
        startedAt: '2020-01-01T07:00:00.000Z',
        endedAt: '2020-01-01T08:00:00.000Z',
        distanceMeters: 18400,
      }).expect(201);

      expect((await getVehicle(id, ownerToken)).estimatedMileageKm).toBe(145060);
    });

    it('keeps counting trips recorded after the confirmed reading', async () => {
      const id = await createVehicle(ownerToken, 145000);
      await confirmOdometer(id, ownerToken, 145060).expect(200);

      await postTrip(id, ownerToken, tripEndingIn(5)).expect(201);

      expect((await getVehicle(id, ownerToken)).estimatedMileageKm).toBe(145078.4);
    });

    it('does not double count after confirming a reading twice', async () => {
      const id = await createVehicle(ownerToken, 145000);

      await postTrip(id, ownerToken, tripEndingIn(1)).expect(201);
      await confirmOdometer(id, ownerToken, 145020).expect(200);
      await postTrip(id, ownerToken, tripEndingIn(2)).expect(201);
      await confirmOdometer(id, ownerToken, 145040).expect(200);

      const vehicle = await getVehicle(id, ownerToken);
      expect(vehicle.odometerKm).toBe(145040);
      expect(vehicle.estimatedMileageKm).toBe(145040);
    });
  });

  describe('ownership isolation', () => {
    it('refuses to record a trip against another user vehicle', async () => {
      const id = await createVehicle(otherToken);

      await postTrip(id, ownerToken).expect(404);
      expect(prisma.trip.rows).toHaveLength(0);
    });

    it('hides another user trips', async () => {
      const id = await createVehicle(otherToken);
      const tripId = (await postTrip(id, otherToken).expect(201)).body.id;
      const auth = { Authorization: `Bearer ${ownerToken}` };
      const server = app.getHttpServer();

      await request(server).get(tripsUrl(id)).set(auth).expect(404);
      await request(server).get(`${tripsUrl(id)}/${tripId}`).set(auth).expect(404);
      await request(server).delete(`${tripsUrl(id)}/${tripId}`).set(auth).expect(404);

      expect(prisma.trip.rows).toHaveLength(1);
    });
  });
});
