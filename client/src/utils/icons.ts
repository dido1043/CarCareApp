import { DocumentType, ExpenseCategory, FuelType, MaintenanceType } from '@/types';
import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * One icon per domain value. Icons carry meaning alongside the colour, which is
 * what keeps status legible without relying on red-versus-orange.
 */

export const MAINTENANCE_ICONS: Record<MaintenanceType, IconName> = {
  OIL_CHANGE: 'water-outline',
  FILTERS: 'funnel-outline',
  BRAKES: 'disc-outline',
  TIRES: 'ellipse-outline',
  BATTERY: 'battery-charging-outline',
  INSPECTION: 'search-outline',
  TIMING_BELT: 'sync-outline',
  REPAIR: 'construct-outline',
  OTHER: 'ellipsis-horizontal-outline',
};

export const EXPENSE_ICONS: Record<ExpenseCategory, IconName> = {
  FUEL: 'flame-outline',
  MAINTENANCE: 'construct-outline',
  REPAIR: 'hammer-outline',
  INSURANCE: 'shield-checkmark-outline',
  TAX: 'document-text-outline',
  PARKING: 'car-outline',
  WASHING: 'water-outline',
  TIRES: 'ellipse-outline',
  OTHER: 'ellipsis-horizontal-outline',
};

export const DOCUMENT_ICONS: Record<DocumentType, IconName> = {
  INSURANCE: 'shield-checkmark-outline',
  TECHNICAL_INSPECTION: 'checkmark-done-outline',
  REGISTRATION: 'card-outline',
  SERVICE_INVOICE: 'receipt-outline',
  OTHER: 'document-outline',
};

export const FUEL_ICONS: Record<FuelType, IconName> = {
  PETROL: 'flame-outline',
  DIESEL: 'flame-outline',
  HYBRID: 'leaf-outline',
  PLUG_IN_HYBRID: 'leaf-outline',
  ELECTRIC: 'flash-outline',
  LPG: 'flame-outline',
  CNG: 'flame-outline',
  OTHER: 'ellipsis-horizontal-outline',
};
