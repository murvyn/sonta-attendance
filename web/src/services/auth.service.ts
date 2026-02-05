import api from './api';
import type { AuthResponse, MagicLinkRequest, MagicLinkVerify, User } from '@/types';

export const authService = {
  async requestMagicLink(data: MagicLinkRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/magic-link/request', data);
    return response.data;
  },

  async verifyMagicLink(data: MagicLinkVerify): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/magic-link/verify', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

export default authService;
