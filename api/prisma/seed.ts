import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to run the seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// Identities live in Supabase Auth, so a seeded row is only meaningful when it
// points at a real Supabase user id.
const seedUserId = process.env.SEED_USER_ID;

if (!seedUserId) {
  console.log('SEED_USER_ID is not set - skipping user seed.');
} else {
  const user = await prisma.user.upsert({
    where: { id: seedUserId },
    update: {},
    create: { id: seedUserId, email: process.env.SEED_USER_EMAIL ?? null },
  });
  console.log(`Seeded application user ${user.id}`);
}

await prisma.$disconnect();
