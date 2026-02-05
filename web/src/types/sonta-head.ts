export enum SontaHeadStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface SontaHead {
  id: string;
  name: string;
  sontaName?: string;
  phone: string;
  email?: string;
  profileImageUrl: string;
  status: SontaHeadStatus;
  enrollmentDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSontaHeadData {
  name: string;
  sontaName?: string;
  phone: string;
  email?: string;
  notes?: string;
  status?: SontaHeadStatus;
  profileImage: File;
}

export interface UpdateSontaHeadData {
  name?: string;
  sontaName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: SontaHeadStatus;
  profileImage?: File;
}

export interface SontaHeadQueryParams {
  search?: string;
  status?: SontaHeadStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedSontaHeads {
  data: SontaHead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
