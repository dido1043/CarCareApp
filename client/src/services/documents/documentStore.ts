import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateDocumentInput, UpdateDocumentInput, VehicleDocument } from '@/types';

/**
 * Local stand-in for the documents table the API does not have yet.
 *
 * It is deliberately shaped like a REST resource — the same list/get/create/
 * update/delete surface, the same DTOs, the same async signatures — so that
 * turning documents into a real feature means rewriting `src/api/documents.ts`
 * to call `apiClient` and deleting this file. Nothing above the API layer knows
 * the difference.
 */

const STORAGE_KEY = 'carcare.documents.v1';

function nowIso(): string {
  return new Date().toISOString();
}

async function readAll(): Promise<VehicleDocument[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VehicleDocument[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(documents: VehicleDocument[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

/** `crypto.randomUUID` is not in the Hermes runtime on every platform. */
function createId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `doc_${Date.now().toString(36)}_${random}`;
}

/** Newest first, matching how the other API collections are ordered. */
function byDateDesc(a: VehicleDocument, b: VehicleDocument): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export const documentStore = {
  async list(vehicleId: string): Promise<VehicleDocument[]> {
    const all = await readAll();
    return all.filter((doc) => doc.vehicleId === vehicleId).sort(byDateDesc);
  },

  async get(vehicleId: string, documentId: string): Promise<VehicleDocument> {
    const all = await readAll();
    const found = all.find((doc) => doc.id === documentId && doc.vehicleId === vehicleId);
    if (!found) throw new Error('Document not found');
    return found;
  },

  async create(vehicleId: string, input: CreateDocumentInput): Promise<VehicleDocument> {
    const all = await readAll();
    const timestamp = nowIso();
    const document: VehicleDocument = {
      id: createId(),
      vehicleId,
      type: input.type,
      title: input.title,
      fileUri: input.fileUri,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes ?? null,
      issuedAt: input.issuedAt ?? null,
      expiresAt: input.expiresAt ?? null,
      notes: input.notes ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await writeAll([document, ...all]);
    return document;
  },

  async update(
    vehicleId: string,
    documentId: string,
    input: UpdateDocumentInput,
  ): Promise<VehicleDocument> {
    const all = await readAll();
    const index = all.findIndex(
      (doc) => doc.id === documentId && doc.vehicleId === vehicleId,
    );
    const existing = all[index];
    if (!existing) throw new Error('Document not found');

    const updated: VehicleDocument = { ...existing, ...input, updatedAt: nowIso() };
    const next = [...all];
    next[index] = updated;
    await writeAll(next);
    return updated;
  },

  async remove(vehicleId: string, documentId: string): Promise<void> {
    const all = await readAll();
    await writeAll(
      all.filter((doc) => !(doc.id === documentId && doc.vehicleId === vehicleId)),
    );
  },

  /** Used when a vehicle is deleted, since no cascade exists locally. */
  async removeForVehicle(vehicleId: string): Promise<void> {
    const all = await readAll();
    await writeAll(all.filter((doc) => doc.vehicleId !== vehicleId));
  },
};
