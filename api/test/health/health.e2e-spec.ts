import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../../src/database/prisma.service.js';
import { HealthController } from '../../src/health/health.controller.js';

const HEALTH_ROUTE = '/api/v1/health';

describe('GET /api/v1/health', () => {
  let app: INestApplication;
  const isReachable = vi.fn<() => Promise<boolean>>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: { isReachable } }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports ok when the database answers', async () => {
    isReachable.mockResolvedValue(true);

    const response = await request(app.getHttpServer())
      .get(HEALTH_ROUTE)
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('up');
  });

  it('reports unavailable when the database is unreachable', async () => {
    isReachable.mockResolvedValue(false);

    await request(app.getHttpServer()).get(HEALTH_ROUTE).expect(503);
  });

  it('is reachable without authentication', async () => {
    isReachable.mockResolvedValue(true);

    await request(app.getHttpServer()).get(HEALTH_ROUTE).expect(200);
  });
});
