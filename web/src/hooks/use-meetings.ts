import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { meetingsService } from '@/services/meetings.service';
import type {
  Meeting,
  CreateMeetingData,
  UpdateMeetingData,
  MeetingQueryParams,
  PaginatedMeetings,
  MeetingStatistics,
  QrCode,
} from '@/types';

// Query keys factory
export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  list: (filters: MeetingQueryParams) => [...meetingKeys.lists(), filters] as const,
  details: () => [...meetingKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingKeys.details(), id] as const,
  upcoming: () => [...meetingKeys.all, 'upcoming'] as const,
  statistics: (id: string) => [...meetingKeys.all, 'statistics', id] as const,
};

// Queries
export function useMeetings(params: MeetingQueryParams = {}) {
  return useQuery<PaginatedMeetings>({
    queryKey: meetingKeys.list(params),
    queryFn: () => meetingsService.getAll(params),
  });
}

export function useUpcomingMeetings() {
  return useQuery<PaginatedMeetings>({
    queryKey: meetingKeys.upcoming(),
    queryFn: () => meetingsService.getUpcoming(),
  });
}

export function useMeeting(id: string) {
  return useQuery<Meeting>({
    queryKey: meetingKeys.detail(id),
    queryFn: () => meetingsService.getById(id),
    enabled: !!id,
  });
}

export function useMeetingStatistics(id: string) {
  return useQuery<MeetingStatistics>({
    queryKey: meetingKeys.statistics(id),
    queryFn: () => meetingsService.getStatistics(id),
    enabled: !!id,
  });
}

// Mutations with automatic cache invalidation
export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMeetingData) => meetingsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.upcoming() });
      toast.success('Meeting created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create meeting');
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMeetingData }) =>
      meetingsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: meetingKeys.upcoming() });
      toast.success('Meeting updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update meeting');
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.upcoming() });
      toast.success('Meeting deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete meeting');
    },
  });
}

export function useStartMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingsService.start(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
      toast.success('Meeting started');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start meeting');
    },
  });
}

export function useEndMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingsService.end(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
      toast.success('Meeting ended');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to end meeting');
    },
  });
}

export function useCancelMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingsService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
      toast.success('Meeting cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel meeting');
    },
  });
}

export function useRegenerateQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingsService.regenerateQr(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
      toast.success('QR code regenerated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to regenerate QR code');
    },
  });
}
