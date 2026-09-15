import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createLocalJWKSet } from 'jose';
import { JWT_KEY_RESOLVER } from '../../src/auth/jwt-key-resolver.js';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter.js';
import { DashboardModule } from '../../src/dashboard/dashboard.module.js';
import { PrismaModule } from '../../src/database/prisma.module.js';
import { PrismaService } from '../../src/database/prisma.service.js';
import { ExpensesModule } from '../../src/expenses/expenses.module.js';
import { MaintenanceModule } from '../../src/maintenance/maintenance.module.js';
import { TripsModule } from '../../src/trips/trips.module.js';
import { UsersModule } from '../../src/users/users.module.js';
import { VehiclesModule } from '../../src/vehicles/vehicles.module.js';
import { PrismaDouble } from './prisma-double.js';
import { testJwks, testSupabaseConfig } from './tokens.js';

/**
 * Boots the real feature modules — guards, pipes and the global filter
 * included — against an in-memory database and a local key set, so the whole
 * request path is exercised without Supabase or PostgreSQL.
 */
export async function createTestApp(
  prisma: PrismaDouble,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [testSupabaseConfig],
      }),
      // Global in the real app; imported here so the override has a target.
      PrismaModule,
      UsersModule,
      VehiclesModule,
      TripsModule,
      MaintenanceModule,
      ExpensesModule,
      DashboardModule,
    ],
  })
    .overrideProvider(JWT_KEY_RESOLVER)
    .useValue(createLocalJWKSet(testJwks))
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(false));
  await app.init();

  return app;
}
