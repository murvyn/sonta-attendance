import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sontaHeadsService } from '@/services/sonta-heads.service';
import type {
  SontaHead,
  CreateSontaHeadData,
  UpdateSontaHeadData,
  SontaHeadQueryParams,
  PaginatedSontaHeads,
} from '@/types';
import { getErrorMessage } from '@/types/errors';

// Query keys factory
export const sontaHeadKeys = {
  all: ['sonta-heads'] as const,
  lists: () => [...sontaHeadKeys.all, 'list'] as const,
  list: (filters: SontaHeadQueryParams) => [...sontaHeadKeys.lists(), filters] as const,
  details: () => [...sontaHeadKeys.all, 'detail'] as const,
  detail: (id: string) => [...sontaHeadKeys.details(), id] as const,
  count: () => [...sontaHeadKeys.all, 'count'] as const,
};

// Queries
export function useSontaHeads(params: SontaHeadQueryParams = {}) {
  return useQuery<PaginatedSontaHeads>({
    queryKey: sontaHeadKeys.list(params),
    queryFn: () => sontaHeadsService.getAll(params),
  });
}

export function useSontaHead(id: string) {
  return useQuery<SontaHead>({
    queryKey: sontaHeadKeys.detail(id),
    queryFn: () => sontaHeadsService.getById(id),
    enabled: !!id,
  });
}

export function useSontaHeadsCount() {
  return useQuery<number>({
    queryKey: sontaHeadKeys.count(),
    queryFn: () => sontaHeadsService.getActiveCount(),
  });
}

// Mutations with automatic cache invalidation
export function useCreateSontaHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSontaHeadData) => sontaHeadsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sontaHeadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sontaHeadKeys.count() });
      toast.success('Sonta Head created successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateSontaHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSontaHeadData }) =>
      sontaHeadsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sontaHeadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sontaHeadKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: sontaHeadKeys.count() });
      toast.success('Sonta Head updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteSontaHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sontaHeadsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sontaHeadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sontaHeadKeys.count() });
      toast.success('Sonta Head deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
