export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkVerify {
  token: string;
}
