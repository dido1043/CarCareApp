import { documentStore } from '@/services/documents/documentStore';
import type { CreateDocumentInput, UpdateDocumentInput, VehicleDocument } from '@/types';

/**
 * MOCK — the API has no documents module yet.
 *
 * Every call is delegated to the on-device store. When `/vehicles/:id/documents`
 * ships, replace the bodies below with `apiClient` calls and delete
 * `src/services/documents/documentStore.ts`; the hooks, screens and types above
 * this file do not change.
 */
export const DOCUMENTS_ARE_MOCKED = true;

export const documentsApi = {
  list: (vehicleId: string): Promise<VehicleDocument[]> => documentStore.list(vehicleId),

  get: (vehicleId: string, documentId: string): Promise<VehicleDocument> =>
    documentStore.get(vehicleId, documentId),

  create: (vehicleId: string, input: CreateDocumentInput): Promise<VehicleDocument> =>
    documentStore.create(vehicleId, input),

  update: (
    vehicleId: string,
    documentId: string,
    input: UpdateDocumentInput,
  ): Promise<VehicleDocument> => documentStore.update(vehicleId, documentId, input),

  remove: (vehicleId: string, documentId: string): Promise<void> =>
    documentStore.remove(vehicleId, documentId),
};
