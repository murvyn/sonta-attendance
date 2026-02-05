import api from './api';
import type { User, AdminRole } from '@/types';

export interface Admin extends User {
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminDto {
  email: string;
  fullName?: string;
  role?: AdminRole;
}

export interface UpdateAdminDto {
  email?: string;
  fullName?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export const adminService = {
  async findAll(): Promise<Admin[]> {
    const response = await api.get<Admin[]>('/api/admins');
    return response.data;
  },

  async findOne(id: string): Promise<Admin> {
    const response = await api.get<Admin>(`/api/admins/${id}`);
    return response.data;
  },

  async create(data: CreateAdminDto): Promise<Admin> {
    const response = await api.post<Admin>('/api/admins', data);
    return response.data;
  },

  async update(id: string, data: UpdateAdminDto): Promise<Admin> {
    const response = await api.put<Admin>(`/api/admins/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/admins/${id}`);
  },
};

export default adminService;
