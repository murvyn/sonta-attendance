import api from './api';
import type { AuthResponse, LoginCredentials, ChangePasswordData, User } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.post('/api/auth/change-password', data);
  },

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

export default authService;
