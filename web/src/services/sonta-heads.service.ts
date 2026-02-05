import api from './api';
import type {
  SontaHead,
  CreateSontaHeadData,
  UpdateSontaHeadData,
  SontaHeadQueryParams,
  PaginatedSontaHeads,
} from '@/types';

export const sontaHeadsService = {
  async getAll(params?: SontaHeadQueryParams): Promise<PaginatedSontaHeads> {
    const response = await api.get<PaginatedSontaHeads>('/api/sonta-heads', { params });
    return response.data;
  },

  async getById(id: string): Promise<SontaHead> {
    const response = await api.get<SontaHead>(`/api/sonta-heads/${id}`);
    return response.data;
  },

  async getActiveCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/api/sonta-heads/count');
    return response.data.count;
  },

  async create(data: CreateSontaHeadData): Promise<SontaHead> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.sontaName) formData.append('sontaName', data.sontaName);
    formData.append('phone', data.phone);
    if (data.email) formData.append('email', data.email);
    if (data.notes) formData.append('notes', data.notes);
    if (data.status) formData.append('status', data.status);
    formData.append('profileImage', data.profileImage);

    const response = await api.post<SontaHead>('/api/sonta-heads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async update(id: string, data: UpdateSontaHeadData): Promise<SontaHead> {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.sontaName !== undefined) formData.append('sontaName', data.sontaName || '');
    if (data.phone) formData.append('phone', data.phone);
    if (data.email !== undefined) formData.append('email', data.email || '');
    if (data.notes !== undefined) formData.append('notes', data.notes || '');
    if (data.status) formData.append('status', data.status);
    if (data.profileImage) formData.append('profileImage', data.profileImage);

    const response = await api.put<SontaHead>(`/api/sonta-heads/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/sonta-heads/${id}`);
  },
};

export default sontaHeadsService;
