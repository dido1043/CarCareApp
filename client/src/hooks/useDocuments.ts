import { documentsApi } from '@/api/documents';
import type {
  CreateDocumentInput,
  DocumentWithStatus,
  UpdateDocumentInput,
} from '@/types';
import { resolveDocumentStatus } from '@/utils/documents';
import { daysUntil } from '@/utils/date';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/** Expiry status is derived on read so it stays correct as days pass. */
function withStatus<T extends { expiresAt: string | null }>(
  document: T,
): T & { status: DocumentWithStatus['status']; daysUntilExpiry: number | null } {
  return {
    ...document,
    status: resolveDocumentStatus(document.expiresAt),
    daysUntilExpiry: document.expiresAt ? daysUntil(document.expiresAt) : null,
  };
}

export function useDocuments(vehicleId: string | null) {
  return useQuery({
    queryKey: queryKeys.documents(vehicleId ?? 'none'),
    queryFn: () => documentsApi.list(vehicleId as string),
    enabled: Boolean(vehicleId),
    select: (documents): DocumentWithStatus[] => documents.map(withStatus),
  });
}

export function useDocument(vehicleId: string | null, documentId: string | null) {
  return useQuery({
    queryKey: queryKeys.document(vehicleId ?? 'none', documentId ?? 'none'),
    queryFn: () => documentsApi.get(vehicleId as string, documentId as string),
    enabled: Boolean(vehicleId && documentId),
    select: withStatus<Awaited<ReturnType<typeof documentsApi.get>>>,
  });
}

function useInvalidateDocuments(vehicleId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.documents(vehicleId) });
}

export function useCreateDocument(vehicleId: string) {
  const invalidate = useInvalidateDocuments(vehicleId);

  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentsApi.create(vehicleId, input),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateDocument(vehicleId: string, documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateDocumentInput) =>
      documentsApi.update(vehicleId, documentId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents(vehicleId) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.document(vehicleId, documentId),
      });
    },
  });
}

export function useDeleteDocument(vehicleId: string) {
  const invalidate = useInvalidateDocuments(vehicleId);

  return useMutation({
    mutationFn: (documentId: string) => documentsApi.remove(vehicleId, documentId),
    onSuccess: () => void invalidate(),
  });
}
