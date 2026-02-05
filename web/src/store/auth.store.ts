'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, MagicLinkRequest, MagicLinkVerify } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  magicLinkSent: boolean;
  magicLinkEmail: string | null;

  requestMagicLink: (data: MagicLinkRequest) => Promise<void>;
  verifyMagicLink: (data: MagicLinkVerify) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  resetMagicLinkSent: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      magicLinkSent: false,
      magicLinkEmail: null,

      requestMagicLink: async (data: MagicLinkRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authService.requestMagicLink(data);
          set({
            isLoading: false,
            magicLinkSent: true,
            magicLinkEmail: data.email,
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to send magic link. Please try again.';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      verifyMagicLink: async (data: MagicLinkVerify) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.verifyMagicLink(data);
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            magicLinkSent: false,
            magicLinkEmail: null,
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : 'Invalid or expired magic link.';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            isAuthenticated: false,
            magicLinkSent: false,
            magicLinkEmail: null,
          });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await authService.getProfile();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
      resetMagicLinkSent: () =>
        set({ magicLinkSent: false, magicLinkEmail: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
