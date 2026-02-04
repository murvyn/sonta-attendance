import api from './api';
import type {
  AnalyticsOverview,
  SontaHeadAnalytics,
  MeetingAnalytics,
  AttendanceTrend,
  AttendanceHistoryItem,
  AnalyticsQueryParams,
  ExportReportParams,
} from '@/types';

export const analyticsService = {
  async getOverview(params?: AnalyticsQueryParams): Promise<AnalyticsOverview> {
    const response = await api.get<AnalyticsOverview>('/api/analytics/overview', { params });
    return response.data;
  },

  async getSontaHeadAnalytics(
    id: string,
    params?: AnalyticsQueryParams
  ): Promise<SontaHeadAnalytics> {
    const response = await api.get<SontaHeadAnalytics>(`/api/analytics/sonta-head/${id}`, { params });
    return response.data;
  },

  async getAttendanceHistory(
    id: string,
    limit?: number
  ): Promise<AttendanceHistoryItem[]> {
    const params = limit ? { limit: limit.toString() } : {};
    const response = await api.get<AttendanceHistoryItem[]>(
      `/api/analytics/sonta-head/${id}/history`,
      { params }
    );
    return response.data;
  },

  async getMeetingAnalytics(id: string): Promise<MeetingAnalytics> {
    const response = await api.get<MeetingAnalytics>(`/api/analytics/meeting/${id}`);
    return response.data;
  },

  async getAttendanceTrends(params?: AnalyticsQueryParams): Promise<AttendanceTrend[]> {
    const response = await api.get<AttendanceTrend[]>('/api/analytics/attendance-trends', { params });
    return response.data;
  },

  async exportReport(params: ExportReportParams): Promise<Blob> {
    const response = await api.post('/api/analytics/export-report', null, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default analyticsService;
