import { DocumentStatus } from '@/types';
import { daysUntil } from './date';

/** A document is flagged a month before it lapses — time enough to renew it. */
export const DOCUMENT_EXPIRY_WARNING_DAYS = 30;

export function resolveDocumentStatus(
  expiresAt: string | null,
  from: Date = new Date(),
): DocumentStatus {
  if (!expiresAt) return DocumentStatus.NO_EXPIRY;

  const remaining = daysUntil(expiresAt, from);
  if (remaining < 0) return DocumentStatus.EXPIRED;
  return remaining <= DOCUMENT_EXPIRY_WARNING_DAYS
    ? DocumentStatus.EXPIRING_SOON
    : DocumentStatus.VALID;
}

/** Human-readable file size, used on document cards. */
export function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || bytes <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value < 10 && exponent > 0 ? value.toFixed(1) : Math.round(value)} ${units[exponent]}`;
}

/** Short label for the file kind, e.g. `PDF`, `JPG`. */
export function fileKindLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  const subtype = mimeType.split('/')[1];
  if (!subtype) return 'FILE';
  return subtype.replace('jpeg', 'jpg').toUpperCase().slice(0, 4);
}

export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
