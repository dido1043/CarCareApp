import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'node prisma/seed.ts',
  },
  datasource: {
    // Read directly rather than through env(), which throws when unset:
    // `prisma generate` loads this file but never connects, so Docker builds
    // and CI need no database URL. Commands that connect (migrate, db pull)
    // still fail with "datasource.url property is required" when it is missing.
    url: process.env.DIRECT_URL!,
  },
});
