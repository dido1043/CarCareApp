import { randomUUID } from 'node:crypto';
import { Prisma } from '../../src/generated/prisma/client.js';

/**
 * An in-memory stand-in for `PrismaService`, covering exactly the query shapes
 * the CarCare services use. It exists so the HTTP layer, guards, validation and
 * — most importantly — the ownership filters in every `where` clause can be
 * exercised without a PostgreSQL instance.
 *
 * It is a test double, not a database: it does not enforce column types,
 * uniqueness or referential integrity. Anything that depends on real SQL
 * semantics (decimal rounding, cascade deletes, transaction rollback) still
 * needs an integration run against Postgres.
 */

type Row = Record<string, any>;

const DECIMAL_FIELDS = new Set([
  'odometerKm',
  'estimatedMileageKm',
  'startLatitude',
  'startLongitude',
  'endLatitude',
  'endLongitude',
  'cost',
  'mileageKm',
  'nextDueMileageKm',
  'amount',
]);

function toDecimal(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value ?? null;
  }
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value as never);
}

function normalize(row: Row): Row {
  const out: Row = { ...row };
  for (const field of Object.keys(out)) {
    if (DECIMAL_FIELDS.has(field)) {
      out[field] = toDecimal(out[field]);
    }
  }
  return out;
}

class Store {
  readonly rows: Row[] = [];

  constructor(
    private readonly model: string,
    private readonly db: PrismaDouble,
  ) {}

  private match(row: Row, where: Row | undefined): boolean {
    if (!where) {
      return true;
    }

    return Object.entries(where).every(([key, condition]) => {
      if (key === 'OR') {
        return (condition as Row[]).some((clause) => this.match(row, clause));
      }

      // Relation filter, e.g. `vehicle: { userId }` — the ownership chain.
      if (key === 'vehicle') {
        const parent = this.db.vehicle.rows.find((v) => v.id === row.vehicleId);
        return parent !== undefined && this.db.vehicle.match(parent, condition as Row);
      }

      return matchValue(row[key], condition);
    });
  }

  private sort(rows: Row[], orderBy: Row | undefined): Row[] {
    if (!orderBy) {
      return rows;
    }
    const [field, direction] = Object.entries(orderBy)[0] as [string, string];
    return [...rows].sort((a, b) => {
      const left = valueOf(a[field]);
      const right = valueOf(b[field]);
      const delta = left < right ? -1 : left > right ? 1 : 0;
      return direction === 'desc' ? -delta : delta;
    });
  }

  private select(args: Row = {}): Row[] {
    const filtered = this.rows.filter((row) => this.match(row, args.where));
    const sorted = this.sort(filtered, args.orderBy);
    const from = args.skip ?? 0;
    return args.take === undefined
      ? sorted.slice(from)
      : sorted.slice(from, from + args.take);
  }

  async findMany(args: Row = {}): Promise<Row[]> {
    return this.select(args);
  }

  async findFirst(args: Row = {}): Promise<Row | null> {
    return this.select(args)[0] ?? null;
  }

  async findFirstOrThrow(args: Row = {}): Promise<Row> {
    const row = await this.findFirst(args);
    if (!row) {
      throw new Error(`No ${this.model} matched`);
    }
    return row;
  }

  async findUnique(args: Row): Promise<Row | null> {
    return this.findFirst({ where: args.where });
  }

  async findUniqueOrThrow(args: Row): Promise<Row> {
    return this.findFirstOrThrow({ where: args.where });
  }

  async count(args: Row = {}): Promise<number> {
    return this.rows.filter((row) => this.match(row, args.where)).length;
  }

  async create(args: Row): Promise<Row> {
    const now = new Date();
    const row = normalize({
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...args.data,
    });
    this.rows.push(row);
    return row;
  }

  async update(args: Row): Promise<Row> {
    const row = await this.findFirstOrThrow({ where: args.where });
    applyData(row, args.data);
    return row;
  }

  async updateMany(args: Row): Promise<{ count: number }> {
    const rows = this.rows.filter((row) => this.match(row, args.where));
    for (const row of rows) {
      applyData(row, args.data);
    }
    return { count: rows.length };
  }

  async upsert(args: Row): Promise<Row> {
    const existing = await this.findFirst({ where: args.where });
    if (existing) {
      applyData(existing, args.update);
      return existing;
    }
    return this.create({ data: { ...args.where, ...args.create } });
  }

  async delete(args: Row): Promise<Row> {
    const row = await this.findFirstOrThrow({ where: args.where });
    this.rows.splice(this.rows.indexOf(row), 1);
    this.db.cascadeFrom(this.model, row);
    return row;
  }

  async deleteMany(args: Row = {}): Promise<{ count: number }> {
    const rows = this.rows.filter((row) => this.match(row, args.where));
    for (const row of rows) {
      this.rows.splice(this.rows.indexOf(row), 1);
      this.db.cascadeFrom(this.model, row);
    }
    return { count: rows.length };
  }

  async aggregate(args: Row): Promise<Row> {
    const rows = this.rows.filter((row) => this.match(row, args.where));
    const field = Object.keys(args._sum)[0];
    if (rows.length === 0) {
      return { _sum: { [field]: null } };
    }
    const total = rows.reduce(
      (sum, row) => sum.plus(row[field] as Prisma.Decimal),
      new Prisma.Decimal(0),
    );
    return { _sum: { [field]: total } };
  }

  async groupBy(args: Row): Promise<Row[]> {
    const rows = this.rows.filter((row) => this.match(row, args.where));
    const field = Object.keys(args._sum)[0];
    const key = args.by[0] as string;
    const buckets = new Map<string, Prisma.Decimal>();

    for (const row of rows) {
      const bucket = buckets.get(row[key]) ?? new Prisma.Decimal(0);
      buckets.set(row[key], bucket.plus(row[field] as Prisma.Decimal));
    }

    return [...buckets].map(([value, total]) => ({
      [key]: value,
      _sum: { [field]: total },
    }));
  }
}

function matchValue(actual: unknown, condition: unknown): boolean {
  if (condition !== null && typeof condition === 'object' && !(condition instanceof Date)) {
    const operators = condition as Row;
    if ('not' in operators) {
      return operators.not === null ? actual !== null : actual !== operators.not;
    }
    if ('gte' in operators) {
      return valueOf(actual) >= valueOf(operators.gte);
    }
    if ('lte' in operators) {
      return valueOf(actual) <= valueOf(operators.lte);
    }
  }
  return actual === condition;
}

function valueOf(value: unknown): any {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value;
}

function applyData(row: Row, data: Row): void {
  for (const [field, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && 'increment' in value) {
      row[field] = (row[field] as Prisma.Decimal).plus(
        (value as { increment: number }).increment,
      );
      continue;
    }
    row[field] = DECIMAL_FIELDS.has(field) ? toDecimal(value) : value;
  }
  row.updatedAt = new Date();
}

export class PrismaDouble {
  readonly user = new Store('user', this);
  readonly vehicle = new Store('vehicle', this);
  readonly trip = new Store('trip', this);
  readonly maintenanceRecord = new Store('maintenanceRecord', this);
  readonly expense = new Store('expense', this);

  /** Mirrors the `onDelete: Cascade` rules declared in the schema. */
  cascadeFrom(model: string, row: Row): void {
    if (model === 'user') {
      for (const vehicle of [...this.vehicle.rows].filter((v) => v.userId === row.id)) {
        void this.vehicle.delete({ where: { id: vehicle.id } });
      }
    }
    if (model === 'vehicle') {
      for (const store of [this.trip, this.maintenanceRecord, this.expense]) {
        for (const child of [...store.rows].filter((c) => c.vehicleId === row.id)) {
          store.rows.splice(store.rows.indexOf(child), 1);
        }
      }
    }
  }

  /** The services only ever use the interactive form. */
  async $transaction<T>(fn: (tx: PrismaDouble) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async isReachable(): Promise<boolean> {
    return true;
  }

  async $connect(): Promise<void> {}
  async $disconnect(): Promise<void> {}

  reset(): void {
    for (const store of [
      this.user,
      this.vehicle,
      this.trip,
      this.maintenanceRecord,
      this.expense,
    ]) {
      store.rows.length = 0;
    }
  }
}
