import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ExpenseCategory, FuelType } from '../../src/generated/prisma/enums.js';
import { createTestApp } from '../support/app.js';
import { PrismaDouble } from '../support/prisma-double.js';
import { OTHER_USER_ID, signAccessToken, TEST_USER_ID } from '../support/tokens.js';

const VEHICLES = '/api/v1/vehicles';

const NOW = new Date();
/** Safely inside the current UTC month, whatever day the suite runs. */
const thisMonth = new Date(
  Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), 1, 12),
).toISOString();
/** Earlier in the same UTC year but not the current month. */
const earlierThisYear = new Date(
  Date.UTC(NOW.getUTCFullYear(), 0, 1, 12),
).toISOString();
const lastYear = new Date(
  Date.UTC(NOW.getUTCFullYear() - 1, 5, 1, 12),
).toISOString();

const fuelUp = {
  category: ExpenseCategory.FUEL,
  amount: 72.4,
  currency: 'EUR',
  date: thisMonth,
  mileageKm: 145060,
  description: 'Shell V-Power, 42 litres',
};

describe('Expenses', () => {
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

  async function createVehicle(token: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(VEHICLES)
      .set('Authorization', `Bearer ${token}`)
      .send({ make: 'Toyota', model: 'Camry', year: 2020, fuelType: FuelType.PETROL })
      .expect(201);

    return response.body.id as string;
  }

  const url = (vehicleId: string) => `${VEHICLES}/${vehicleId}/expenses`;

  const post = (vehicleId: string, token: string, body: object = fuelUp) =>
    request(app.getHttpServer())
      .post(url(vehicleId))
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('requires authentication', async () => {
    const id = await createVehicle(ownerToken);
    await request(app.getHttpServer()).get(url(id)).expect(401);
    await request(app.getHttpServer()).post(url(id)).send(fuelUp).expect(401);
  });

  it('creates an expense', async () => {
    const id = await createVehicle(ownerToken);
    const response = await post(id, ownerToken).expect(201);

    expect(response.body).toMatchObject({
      vehicleId: id,
      category: ExpenseCategory.FUEL,
      amount: 72.4,
      currency: 'EUR',
      mileageKm: 145060,
    });
  });

  it('defaults the currency to EUR', async () => {
    const id = await createVehicle(ownerToken);
    const { currency: _currency, ...withoutCurrency } = fuelUp;

    const response = await post(id, ownerToken, withoutCurrency).expect(201);
    expect(response.body.currency).toBe('EUR');
  });

  it('rejects invalid input and unknown fields', async () => {
    const id = await createVehicle(ownerToken);

    await post(id, ownerToken, { ...fuelUp, category: 'BRIBES' }).expect(400);
    await post(id, ownerToken, { ...fuelUp, amount: -1 }).expect(400);
    await post(id, ownerToken, { ...fuelUp, amount: 10.125 }).expect(400);
    await post(id, ownerToken, { ...fuelUp, currency: 'EUROS' }).expect(400);
    await post(id, ownerToken, { ...fuelUp, date: 'yesterday' }).expect(400);
    await post(id, ownerToken, { ...fuelUp, vehicleId: 'x' }).expect(400);
  });

  it('lists expenses newest first', async () => {
    const id = await createVehicle(ownerToken);
    await post(id, ownerToken, { ...fuelUp, date: earlierThisYear, amount: 10 }).expect(201);
    await post(id, ownerToken, { ...fuelUp, date: thisMonth, amount: 20 }).expect(201);

    const response = await request(app.getHttpServer())
      .get(url(id))
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.map((e: { amount: number }) => e.amount)).toEqual([20, 10]);
  });

  it('gets, updates and deletes a single expense', async () => {
    const id = await createVehicle(ownerToken);
    const expenseId = (await post(id, ownerToken).expect(201)).body.id;
    const auth = { Authorization: `Bearer ${ownerToken}` };
    const server = app.getHttpServer();

    const fetched = await request(server).get(`${url(id)}/${expenseId}`).set(auth).expect(200);
    expect(fetched.body.id).toBe(expenseId);

    const updated = await request(server)
      .patch(`${url(id)}/${expenseId}`)
      .set(auth)
      .send({ amount: 81.15, category: ExpenseCategory.REPAIR })
      .expect(200);
    expect(updated.body.amount).toBe(81.15);
    expect(updated.body.category).toBe(ExpenseCategory.REPAIR);

    await request(server).delete(`${url(id)}/${expenseId}`).set(auth).expect(204);
    await request(server).get(`${url(id)}/${expenseId}`).set(auth).expect(404);
  });

  describe('totals', () => {
    it('sums the current month and the current year', async () => {
      const id = await createVehicle(ownerToken);

      await post(id, ownerToken, { ...fuelUp, date: thisMonth, amount: 72.4 }).expect(201);
      await post(id, ownerToken, { ...fuelUp, date: thisMonth, amount: 27.6 }).expect(201);
      await post(id, ownerToken, {
        ...fuelUp,
        date: earlierThisYear,
        amount: 150,
        category: ExpenseCategory.INSURANCE,
      }).expect(201);
      await post(id, ownerToken, { ...fuelUp, date: lastYear, amount: 999 }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`${url(id)}/totals`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // January 1st is both "this month" and "this year" in the first month of
      // the year, so compare against what the month window actually covers.
      const monthContainsJanuary = thisMonth === earlierThisYear;
      expect(response.body.currentMonth).toBe(monthContainsJanuary ? 250 : 100);
      expect(response.body.currentYear).toBe(250);
    });

    it('breaks the year down by category, largest first', async () => {
      const id = await createVehicle(ownerToken);

      await post(id, ownerToken, { ...fuelUp, amount: 40, category: ExpenseCategory.FUEL }).expect(201);
      await post(id, ownerToken, { ...fuelUp, amount: 60, category: ExpenseCategory.FUEL }).expect(201);
      await post(id, ownerToken, { ...fuelUp, amount: 150, category: ExpenseCategory.INSURANCE }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`${url(id)}/totals`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.byCategory).toEqual([
        { category: ExpenseCategory.INSURANCE, total: 150 },
        { category: ExpenseCategory.FUEL, total: 100 },
      ]);
    });

    it('reports zero rather than null when there is nothing to sum', async () => {
      const id = await createVehicle(ownerToken);

      const response = await request(app.getHttpServer())
        .get(`${url(id)}/totals`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toEqual({
        currentMonth: 0,
        currentYear: 0,
        byCategory: [],
      });
    });

    it('never mixes in another user expenses', async () => {
      const mine = await createVehicle(ownerToken);
      const theirs = await createVehicle(otherToken);

      await post(mine, ownerToken, { ...fuelUp, amount: 10 }).expect(201);
      await post(theirs, otherToken, { ...fuelUp, amount: 5000 }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`${url(mine)}/totals`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body.currentYear).toBe(10);
    });
  });

  describe('ownership isolation', () => {
    it('hides another user expenses behind a 404', async () => {
      const id = await createVehicle(otherToken);
      const expenseId = (await post(id, otherToken).expect(201)).body.id;
      const auth = { Authorization: `Bearer ${ownerToken}` };
      const server = app.getHttpServer();

      await request(server).post(url(id)).set(auth).send(fuelUp).expect(404);
      await request(server).get(url(id)).set(auth).expect(404);
      await request(server).get(`${url(id)}/totals`).set(auth).expect(404);
      await request(server).get(`${url(id)}/${expenseId}`).set(auth).expect(404);
      await request(server).patch(`${url(id)}/${expenseId}`).set(auth).send({ amount: 1 }).expect(404);
      await request(server).delete(`${url(id)}/${expenseId}`).set(auth).expect(404);

      expect(prisma.expense.rows).toHaveLength(1);
      expect(prisma.expense.rows[0].amount.toNumber()).toBe(72.4);
    });
  });
});
