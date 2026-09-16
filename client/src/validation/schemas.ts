import { DocumentType, ExpenseCategory, FuelType, MaintenanceType } from '@/types';
import type { TFunction } from 'i18next';
import { z } from 'zod';

/**
 * Form schemas, built as factories so every message comes from i18next rather
 * than being hardcoded in English inside the validator.
 *
 * Numeric fields arrive as strings from `NumberField` — the user is mid-typing
 * until they submit — so each one is parsed here, once, at the boundary.
 */

/** Matches the API's own ceiling for every kilometre reading. */
export const MAX_ODOMETER_KM = 9_999_999;
const MAX_AMOUNT = 9_999_999.99;
const MIN_YEAR = 1886;

type Translate = TFunction;

/** Trims, then treats an empty string as "not provided". */
const optionalText = (max: number, t: Translate) =>
  z
    .string()
    .trim()
    .max(max, t('validation.maxLength', { max }))
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

/**
 * A numeric string that must be present.
 * `Number('')` is 0, so the empty case is rejected before parsing.
 */
function requiredNumber(t: Translate, options: { max: number; min?: number }) {
  const { max, min = 0 } = options;
  return z
    .string()
    .trim()
    .min(1, t('validation.required'))
    .refine((value) => Number.isFinite(Number(value)), t('validation.number'))
    .transform(Number)
    .refine((value) => value >= min, t('validation.positive'))
    .refine((value) => value <= max, t('validation.maxValue', { max }));
}

/** Same, but an empty field resolves to `undefined` instead of failing. */
function optionalNumber(t: Translate, options: { max: number; min?: number }) {
  const { max, min = 0 } = options;
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || Number.isFinite(Number(value)),
      t('validation.number'),
    )
    .transform((value) => (value === undefined ? undefined : Number(value)))
    .refine((value) => value === undefined || value >= min, t('validation.positive'))
    .refine(
      (value) => value === undefined || value <= max,
      t('validation.maxValue', { max }),
    );
}

export function loginSchema(t: Translate) {
  return z.object({
    email: z.email(t('validation.email')).trim().min(1, t('validation.required')),
    password: z.string().min(1, t('validation.required')),
  });
}
export type LoginForm = z.infer<ReturnType<typeof loginSchema>>;

export function registerSchema(t: Translate) {
  return z
    .object({
      email: z.email(t('validation.email')).trim().min(1, t('validation.required')),
      password: z.string().min(8, t('validation.passwordMin')),
      confirmPassword: z.string().min(1, t('validation.required')),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    });
}
export type RegisterForm = z.infer<ReturnType<typeof registerSchema>>;

export function passwordResetSchema(t: Translate) {
  return z.object({
    email: z.email(t('validation.email')).trim().min(1, t('validation.required')),
  });
}
export type PasswordResetForm = z.infer<ReturnType<typeof passwordResetSchema>>;

export function vehicleSchema(t: Translate) {
  const maxYear = new Date().getFullYear() + 1;

  return z.object({
    make: z
      .string()
      .trim()
      .min(1, t('validation.required'))
      .max(80, t('validation.maxLength', { max: 80 })),
    model: z
      .string()
      .trim()
      .min(1, t('validation.required'))
      .max(80, t('validation.maxLength', { max: 80 })),
    year: z
      .string()
      .trim()
      .min(1, t('validation.required'))
      .refine((value) => /^\d+$/.test(value), t('validation.integer'))
      .transform(Number)
      .refine(
        (value) => value >= MIN_YEAR && value <= maxYear,
        t('validation.yearRange', { min: MIN_YEAR, max: maxYear }),
      ),
    fuelType: z.enum(FuelType, { message: t('validation.required') }),
    engine: optionalText(80, t),
    licensePlate: optionalText(20, t),
    // A VIN is either absent or exactly 17 characters — never something between.
    vin: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value.toUpperCase() : undefined))
      .refine(
        (value) => value === undefined || value.length === 17,
        t('validation.vinLength'),
      ),
    odometerKm: optionalNumber(t, { max: MAX_ODOMETER_KM }),
  });
}
export type VehicleFormInput = z.input<ReturnType<typeof vehicleSchema>>;
export type VehicleFormOutput = z.output<ReturnType<typeof vehicleSchema>>;

export function mileageSchema(t: Translate) {
  return z.object({
    odometerKm: requiredNumber(t, { max: MAX_ODOMETER_KM }),
  });
}
export type MileageFormInput = z.input<ReturnType<typeof mileageSchema>>;
export type MileageFormOutput = z.output<ReturnType<typeof mileageSchema>>;

export function maintenanceSchema(t: Translate) {
  return z.object({
    type: z.enum(MaintenanceType, { message: t('validation.required') }),
    title: z
      .string()
      .trim()
      .min(1, t('validation.required'))
      .max(120, t('validation.maxLength', { max: 120 })),
    description: optionalText(2000, t),
    cost: optionalNumber(t, { max: MAX_AMOUNT }),
    mileageKm: optionalNumber(t, { max: MAX_ODOMETER_KM }),
    date: z.date({ message: t('validation.dateInvalid') }),
    nextDueDate: z.date().nullable().optional(),
    nextDueMileageKm: optionalNumber(t, { max: MAX_ODOMETER_KM }),
    notes: optionalText(2000, t),
  });
}
export type MaintenanceFormInput = z.input<ReturnType<typeof maintenanceSchema>>;
export type MaintenanceFormOutput = z.output<ReturnType<typeof maintenanceSchema>>;

export function expenseSchema(t: Translate) {
  return z.object({
    category: z.enum(ExpenseCategory, { message: t('validation.required') }),
    amount: requiredNumber(t, { max: MAX_AMOUNT }).refine(
      (value) => value > 0,
      t('validation.amountPositive'),
    ),
    currency: z.string().trim().length(3),
    date: z.date({ message: t('validation.dateInvalid') }),
    mileageKm: optionalNumber(t, { max: MAX_ODOMETER_KM }),
    description: optionalText(2000, t),
  });
}
export type ExpenseFormInput = z.input<ReturnType<typeof expenseSchema>>;
export type ExpenseFormOutput = z.output<ReturnType<typeof expenseSchema>>;

export function documentSchema(t: Translate) {
  return z.object({
    type: z.enum(DocumentType, { message: t('validation.required') }),
    title: z
      .string()
      .trim()
      .min(1, t('validation.required'))
      .max(120, t('validation.maxLength', { max: 120 })),
    issuedAt: z.date().nullable().optional(),
    expiresAt: z.date().nullable().optional(),
    notes: optionalText(2000, t),
  });
}
export type DocumentFormInput = z.input<ReturnType<typeof documentSchema>>;
export type DocumentFormOutput = z.output<ReturnType<typeof documentSchema>>;
