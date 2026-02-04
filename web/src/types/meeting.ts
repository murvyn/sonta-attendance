export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum QrExpiryStrategy {
  UNTIL_END = 'until_end',
  MAX_SCANS = 'max_scans',
  TIME_BASED = 'time_based',
}

export interface QrCode {
  id: string;
  qrImageUrl: string;
  scanCount: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  locationName: string;
  locationAddress?: string;
  locationLatitude: number;
  locationLongitude: number;
  geofenceRadiusMeters: number;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  lateArrivalCutoffMinutes?: number;
  qrExpiryStrategy: QrExpiryStrategy;
  qrExpiryMinutes?: number;
  qrMaxScans?: number;
  status: MeetingStatus;
  expectedAttendees?: number;
  createdBy?: {
    id: string;
    fullName: string;
  };
  qrCode?: QrCode;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  locationName: string;
  locationAddress?: string;
  locationLatitude: number;
  locationLongitude: number;
  geofenceRadiusMeters?: number;
  scheduledStart: string;
  scheduledEnd: string;
  lateArrivalCutoffMinutes?: number;
  qrExpiryStrategy?: QrExpiryStrategy;
  qrExpiryMinutes?: number;
  qrMaxScans?: number;
  expectedAttendees?: number;
}

export interface UpdateMeetingData extends Partial<CreateMeetingData> {}

export interface MeetingQueryParams {
  status?: MeetingStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedMeetings {
  data: Meeting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MeetingStatistics {
  meeting: Meeting;
  totalExpected: number;
  checkedIn: number;
  pending: number;
  lateArrivals: number;
  attendanceRate: number;
}

export interface QrValidationResult {
  valid: boolean;
  meeting?: {
    id: string;
    title: string;
    status: MeetingStatus;
    locationName: string;
    locationLatitude: number;
    locationLongitude: number;
    geofenceRadiusMeters: number;
    lateArrivalCutoffMinutes?: number;
    actualStart?: string;
  };
}
