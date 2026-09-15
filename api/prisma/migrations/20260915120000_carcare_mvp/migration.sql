-- CreateEnum
CREATE TYPE "fuel_type" AS ENUM ('PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'LPG', 'CNG', 'OTHER');

-- CreateEnum
CREATE TYPE "maintenance_type" AS ENUM ('OIL_CHANGE', 'FILTERS', 'BRAKES', 'TIRES', 'BATTERY', 'INSPECTION', 'TIMING_BELT', 'REPAIR', 'OTHER');

-- CreateEnum
CREATE TYPE "expense_category" AS ENUM ('FUEL', 'MAINTENANCE', 'REPAIR', 'INSURANCE', 'TAX', 'PARKING', 'WASHING', 'TIRES', 'OTHER');

-- AlterTable
ALTER TABLE "vehicles" RENAME COLUMN "owner_id" TO "user_id";

-- AlterTable
ALTER TABLE "vehicles" RENAME CONSTRAINT "vehicles_owner_id_fkey" TO "vehicles_user_id_fkey";

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "mileage",
    ADD COLUMN     "engine" TEXT,
    ADD COLUMN     "estimated_mileage_km" DECIMAL(12,1) NOT NULL DEFAULT 0,
    ADD COLUMN     "fuel_type" "fuel_type" NOT NULL DEFAULT 'OTHER',
    ADD COLUMN     "odometer_confirmed_at" TIMESTAMP(3),
    ADD COLUMN     "odometer_km" DECIMAL(10,1) NOT NULL DEFAULT 0;

-- The default only exists so the column can be added to pre-existing rows;
-- every write from the application supplies a fuel type explicitly.
ALTER TABLE "vehicles" ALTER COLUMN "fuel_type" DROP DEFAULT;

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3) NOT NULL,
    "distance_meters" INTEGER NOT NULL,
    "start_latitude" DECIMAL(9,6) NOT NULL,
    "start_longitude" DECIMAL(9,6) NOT NULL,
    "end_latitude" DECIMAL(9,6) NOT NULL,
    "end_longitude" DECIMAL(9,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "type" "maintenance_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2),
    "mileage_km" DECIMAL(10,1),
    "date" TIMESTAMP(3) NOT NULL,
    "next_due_date" TIMESTAMP(3),
    "next_due_mileage_km" DECIMAL(10,1),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "category" "expense_category" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "date" TIMESTAMP(3) NOT NULL,
    "mileage_km" DECIMAL(10,1),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_user_id_idx" ON "vehicles"("user_id");

-- CreateIndex
CREATE INDEX "trips_vehicle_id_started_at_idx" ON "trips"("vehicle_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "maintenance_records_vehicle_id_date_idx" ON "maintenance_records"("vehicle_id", "date" DESC);

-- CreateIndex
CREATE INDEX "maintenance_records_vehicle_id_next_due_date_idx" ON "maintenance_records"("vehicle_id", "next_due_date");

-- CreateIndex
CREATE INDEX "maintenance_records_vehicle_id_next_due_mileage_km_idx" ON "maintenance_records"("vehicle_id", "next_due_mileage_km");

-- CreateIndex
CREATE INDEX "expenses_vehicle_id_date_idx" ON "expenses"("vehicle_id", "date" DESC);

-- CreateIndex
CREATE INDEX "expenses_vehicle_id_category_idx" ON "expenses"("vehicle_id", "category");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
