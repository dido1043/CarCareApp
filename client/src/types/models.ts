import type {
  DocumentStatus,
  DocumentType,
  ExpenseCategory,
  FuelType,
  MaintenanceStatus,
  MaintenanceType,
} from './enums';

/**
 * Wire-level models. The API serialises `Date` to an ISO-8601 string, so every
 * timestamp is typed as `string` here and parsed at the formatting boundary.
 */
export type IsoDateString = string;

export interface UserProfile {
  id: string;
  email?: string;
  role?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  fuelType: FuelType;
  engine: string | null;
  licensePlate: string | null;
  vin: string | null;
  /** Last reading the driver confirmed by hand. The only ground truth. */
  odometerKm: number;
  /** Confirmed reading plus GPS distance recorded since. Never the odometer. */
  estimatedMileageKm: number;
  odometerConfirmedAt: IsoDateString | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/**
 * Optional fields accept `null` as well as `undefined`: the API marks them
 * `@IsOptional()`, which skips validation for both, so `null` is how an edit
 * clears a value that was previously set.
 */
export interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  fuelType: FuelType;
  engine?: string | null;
  licensePlate?: string | null;
  vin?: string | null;
  odometerKm?: number;
}

/** The API re-anchors mileage through its own endpoint, so it is not editable here. */
export type UpdateVehicleInput = Partial<Omit<CreateVehicleInput, 'odometerKm'>>;

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  title: string;
  description: string | null;
  cost: number | null;
  mileageKm: number | null;
  date: IsoDateString;
  nextDueDate: IsoDateString | null;
  nextDueMileageKm: number | null;
  notes: string | null;
  status: MaintenanceStatus | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface CreateMaintenanceInput {
  type: MaintenanceType;
  title: string;
  description?: string | null;
  cost?: number | null;
  mileageKm?: number | null;
  date: IsoDateString;
  nextDueDate?: IsoDateString | null;
  nextDueMileageKm?: number | null;
  notes?: string | null;
}

export type UpdateMaintenanceInput = Partial<CreateMaintenanceInput>;

export interface Expense {
  id: string;
  vehicleId: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: IsoDateString;
  mileageKm: number | null;
  description: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  date: IsoDateString;
  mileageKm?: number | null;
  description?: string | null;
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
}

export interface ExpenseTotals {
  currentMonth: number;
  currentYear: number;
  /** Current-year totals per category, largest first. */
  byCategory: CategoryTotal[];
}

export interface Trip {
  id: string;
  vehicleId: string;
  startedAt: IsoDateString;
  endedAt: IsoDateString;
  distanceMeters: number;
  distanceKm: number;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  createdAt: IsoDateString;
}

export interface CreateTripInput {
  startedAt: IsoDateString;
  endedAt: IsoDateString;
  distanceMeters: number;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
}

export interface TripPage {
  items: Trip[];
  total: number;
  limit: number;
  offset: number;
}

export interface Mileage {
  odometerKm: number;
  estimatedMileageKm: number;
  odometerConfirmedAt: IsoDateString | null;
}

export interface Dashboard {
  vehicle: Vehicle;
  mileage: Mileage;
  recentTrips: Trip[];
  upcomingMaintenance: MaintenanceRecord[];
  recentExpenses: Expense[];
  expenses: ExpenseTotals;
}

/**
 * Documents have no API module yet, so they are served from the local mock
 * repository. The shape is what the endpoint is expected to return, which is
 * what keeps the swap to a real backend confined to `src/api/documents.ts`.
 */
export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  title: string;
  /** Local or remote URI of the stored file. */
  fileUri: string;
  /** MIME type, e.g. `application/pdf` or `image/jpeg`. */
  mimeType: string;
  fileSizeBytes: number | null;
  issuedAt: IsoDateString | null;
  expiresAt: IsoDateString | null;
  notes: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface CreateDocumentInput {
  type: DocumentType;
  title: string;
  fileUri: string;
  mimeType: string;
  fileSizeBytes?: number | null;
  issuedAt?: IsoDateString | null;
  expiresAt?: IsoDateString | null;
  notes?: string | null;
}

export type UpdateDocumentInput = Partial<CreateDocumentInput>;

/** What a document's expiry date means today. */
export interface DocumentWithStatus extends VehicleDocument {
  status: DocumentStatus;
  /** Negative once expired. Null when there is no expiry date. */
  daysUntilExpiry: number | null;
}

/**
 * Reminders are derived on the client from maintenance next-due markers and
 * document expiry dates — there is no reminders table behind them.
 */
export interface Reminder {
  id: string;
  vehicleId: string;
  source: 'MAINTENANCE' | 'DOCUMENT';
  /** Maintenance or document type, used to pick the icon and the label. */
  kind: MaintenanceType | DocumentType;
  title: string;
  severity: 'OVERDUE' | 'DUE' | 'UPCOMING';
  /** Whichever marker is driving the reminder. */
  dueDate: IsoDateString | null;
  daysRemaining: number | null;
  dueMileageKm: number | null;
  kmRemaining: number | null;
  /** Route to open when the reminder is tapped. */
  targetId: string;
}
