import type { Prisma } from '../generated/prisma/client.js';

/**
 * Decimals are exact in PostgreSQL and in every calculation the database
 * performs. JSON has no decimal type, so values are widened to numbers only at
 * the response boundary — never before arithmetic and never on the way in.
 */
export function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export function nullableDecimalToNumber(
  value: Prisma.Decimal | null,
): number | null {
  return value === null ? null : value.toNumber();
}
