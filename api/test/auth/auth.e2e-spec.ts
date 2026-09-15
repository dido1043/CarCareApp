import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../support/app.js';
import { PrismaDouble } from '../support/prisma-double.js';
import {
  foreignPrivateKey,
  OTHER_USER_ID,
  signAccessToken,
  TEST_USER_ID,
} from '../support/tokens.js';

const ME_ROUTE = '/api/v1/users/me';

describe('GET /api/v1/users/me', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Verifies against a local key set and an in-memory database, so tests
    // never reach the network.
    app = await createTestApp(new PrismaDouble());
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a request with no Authorization header', async () => {
    await request(app.getHttpServer()).get(ME_ROUTE).expect(401);
  });

  it.each([
    ['scheme only', 'Bearer'],
    ['wrong scheme', 'Token abc.def.ghi'],
    ['no scheme', 'abc.def.ghi'],
    ['empty header', ''],
  ])('rejects a malformed Authorization header (%s)', async (_label, header) => {
    await request(app.getHttpServer())
      .get(ME_ROUTE)
      .set('Authorization', header)
      .expect(401);
  });

  it('rejects a token that is not a JWT', async () => {
    await request(app.getHttpServer())
      .get(ME_ROUTE)
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('rejects a token signed by a key outside the JWKS', async () => {
    const token = await signAccessToken({ signingKey: foreignPrivateKey });

    await request(app.getHttpServer())
      .get(ME_ROUTE)
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects an expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const token = await signAccessToken({ issuedAt: past, expiresAt: past + 60 });

    await request(app.getHttpServer())
      .get(ME_ROUTE)
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('accepts a valid token and returns the caller identity', async () => {
    const token = await signAccessToken({
      sub: TEST_USER_ID,
      email: 'driver@example.com',
      role: 'authenticated',
    });

    const response = await request(app.getHttpServer())
      .get(ME_ROUTE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: TEST_USER_ID,
      email: 'driver@example.com',
      role: 'authenticated',
    });
  });

  it('ignores a user id supplied by the caller', async () => {
    const token = await signAccessToken({ sub: TEST_USER_ID });

    const response = await request(app.getHttpServer())
      .get(`${ME_ROUTE}?userId=${OTHER_USER_ID}&id=${OTHER_USER_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: OTHER_USER_ID, id: OTHER_USER_ID })
      .expect(200);

    expect(response.body.id).toBe(TEST_USER_ID);
    expect(response.body.id).not.toBe(OTHER_USER_ID);
  });

  it('does not leak extra JWT claims', async () => {
    const token = await signAccessToken();

    const response = await request(app.getHttpServer())
      .get(ME_ROUTE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Object.keys(response.body).sort()).toEqual(['email', 'id', 'role']);
  });
});
