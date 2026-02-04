import api from './api';
import type {
  Meeting,
  CreateMeetingData,
  UpdateMeetingData,
  MeetingQueryParams,
  PaginatedMeetings,
  MeetingStatistics,
  QrCode,
  QrValidationResult,
} from '@/types';

export const meetingsService = {
  async getAll(params?: MeetingQueryParams): Promise<PaginatedMeetings> {
    const response = await api.get<PaginatedMeetings>('/api/meetings', { params });
    return response.data;
  },

  async getUpcoming(): Promise<PaginatedMeetings> {
    const response = await api.get<PaginatedMeetings>('/api/meetings/upcoming');
    return response.data;
  },

  async getById(id: string): Promise<Meeting> {
    const response = await api.get<Meeting>(`/api/meetings/${id}`);
    return response.data;
  },

  async create(data: CreateMeetingData): Promise<Meeting> {
    const response = await api.post<Meeting>('/api/meetings', data);
    return response.data;
  },

  async update(id: string, data: UpdateMeetingData): Promise<Meeting> {
    const response = await api.put<Meeting>(`/api/meetings/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/meetings/${id}`);
  },

  async start(id: string): Promise<Meeting> {
    const response = await api.patch<Meeting>(`/api/meetings/${id}/start`);
    return response.data;
  },

  async end(id: string): Promise<Meeting> {
    const response = await api.patch<Meeting>(`/api/meetings/${id}/end`);
    return response.data;
  },

  async cancel(id: string): Promise<Meeting> {
    const response = await api.patch<Meeting>(`/api/meetings/${id}/cancel`);
    return response.data;
  },

  async regenerateQr(id: string): Promise<QrCode> {
    const response = await api.post<QrCode>(`/api/meetings/${id}/regenerate-qr`);
    return response.data;
  },

  async getStatistics(id: string): Promise<MeetingStatistics> {
    const response = await api.get<MeetingStatistics>(`/api/meetings/${id}/statistics`);
    return response.data;
  },

  // Public endpoints (no auth required in production, but for now uses same base)
  async validateQr(token: string): Promise<QrValidationResult> {
    const response = await api.get<QrValidationResult>(`/api/qr/${token}/validate`);
    return response.data;
  },
};

export default meetingsService;
