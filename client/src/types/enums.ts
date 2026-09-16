/**
 * Mirrors of the Prisma enums the API accepts. Declared as const objects rather
 * than TS `enum`s so the values stay plain strings on the wire.
 */

export const FuelType = {
  PETROL: 'PETROL',
  DIESEL: 'DIESEL',
  HYBRID: 'HYBRID',
  PLUG_IN_HYBRID: 'PLUG_IN_HYBRID',
  ELECTRIC: 'ELECTRIC',
  LPG: 'LPG',
  CNG: 'CNG',
  OTHER: 'OTHER',
} as const;
export type FuelType = (typeof FuelType)[keyof typeof FuelType];
export const FUEL_TYPES = Object.values(FuelType);

export const MaintenanceType = {
  OIL_CHANGE: 'OIL_CHANGE',
  FILTERS: 'FILTERS',
  BRAKES: 'BRAKES',
  TIRES: 'TIRES',
  BATTERY: 'BATTERY',
  INSPECTION: 'INSPECTION',
  TIMING_BELT: 'TIMING_BELT',
  REPAIR: 'REPAIR',
  OTHER: 'OTHER',
} as const;
export type MaintenanceType = (typeof MaintenanceType)[keyof typeof MaintenanceType];
export const MAINTENANCE_TYPES = Object.values(MaintenanceType);

export const ExpenseCategory = {
  FUEL: 'FUEL',
  MAINTENANCE: 'MAINTENANCE',
  REPAIR: 'REPAIR',
  INSURANCE: 'INSURANCE',
  TAX: 'TAX',
  PARKING: 'PARKING',
  WASHING: 'WASHING',
  TIRES: 'TIRES',
  OTHER: 'OTHER',
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];
export const EXPENSE_CATEGORIES = Object.values(ExpenseCategory);

/** Derived by the API from the next-due markers; null when nothing is due. */
export const MaintenanceStatus = {
  UPCOMING: 'UPCOMING',
  DUE: 'DUE',
  OVERDUE: 'OVERDUE',
} as const;
export type MaintenanceStatus =
  (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

/** Document types. Client-side only until the API grows a documents module. */
export const DocumentType = {
  INSURANCE: 'INSURANCE',
  TECHNICAL_INSPECTION: 'TECHNICAL_INSPECTION',
  REGISTRATION: 'REGISTRATION',
  SERVICE_INVOICE: 'SERVICE_INVOICE',
  OTHER: 'OTHER',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
export const DOCUMENT_TYPES = Object.values(DocumentType);

export const DocumentStatus = {
  VALID: 'VALID',
  EXPIRING_SOON: 'EXPIRING_SOON',
  EXPIRED: 'EXPIRED',
  /** No expiry date recorded, so the document cannot lapse. */
  NO_EXPIRY: 'NO_EXPIRY',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];
