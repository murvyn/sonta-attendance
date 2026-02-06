import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { analyticsService } from '@/services/analytics.service';
import type {
  AnalyticsOverview,
  SontaHeadAnalytics,
  MeetingAnalytics,
  AttendanceTrend,
  AttendanceHistoryItem,
  AnalyticsQueryParams,
  ExportReportParams,
} from '@/types';
import { getErrorMessage } from '@/types/errors';

// Query keys factory
export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (params: AnalyticsQueryParams) => [...analyticsKeys.all, 'overview', params] as const,
  trends: (params: AnalyticsQueryParams) => [...analyticsKeys.all, 'trends', params] as const,
  sontaHead: (id: string, params: AnalyticsQueryParams) =>
    [...analyticsKeys.all, 'sonta-head', id, params] as const,
  sontaHeadHistory: (id: string, limit?: number) =>
    [...analyticsKeys.all, 'sonta-head-history', id, limit] as const,
  meeting: (id: string) => [...analyticsKeys.all, 'meeting', id] as const,
};

// Queries
export function useAnalyticsOverview(params: AnalyticsQueryParams = {}) {
  return useQuery<AnalyticsOverview>({
    queryKey: analyticsKeys.overview(params),
    queryFn: () => analyticsService.getOverview(params),
  });
}

export function useAttendanceTrends(params: AnalyticsQueryParams = {}) {
  return useQuery<AttendanceTrend[]>({
    queryKey: analyticsKeys.trends(params),
    queryFn: () => analyticsService.getAttendanceTrends(params),
  });
}

export function useSontaHeadAnalytics(id: string, params: AnalyticsQueryParams = {}) {
  return useQuery<SontaHeadAnalytics>({
    queryKey: analyticsKeys.sontaHead(id, params),
    queryFn: () => analyticsService.getSontaHeadAnalytics(id, params),
    enabled: !!id,
  });
}

export function useAttendanceHistory(id: string, limit?: number) {
  return useQuery<AttendanceHistoryItem[]>({
    queryKey: analyticsKeys.sontaHeadHistory(id, limit),
    queryFn: () => analyticsService.getAttendanceHistory(id, limit),
    enabled: !!id,
  });
}

export function useMeetingAnalytics(id: string) {
  return useQuery<MeetingAnalytics>({
    queryKey: analyticsKeys.meeting(id),
    queryFn: () => analyticsService.getMeetingAnalytics(id),
    enabled: !!id,
  });
}

// Mutations
export function useExportReport() {
  return useMutation({
    mutationFn: async (params: ExportReportParams) => {
      const blob = await analyticsService.exportReport(params);
      const filename = `attendance-report-${params.startDate || 'all'}-${params.endDate || 'all'}.${params.format}`;
      analyticsService.downloadFile(blob, filename);
      return blob;
    },
    onSuccess: () => {
      toast.success('Report exported successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
