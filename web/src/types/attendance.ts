export enum CheckInMethod {
  FACIAL_RECOGNITION = 'facial_recognition',
  MANUAL_ADMIN = 'manual_admin',
}

export interface AttendanceRecord {
  id: string;
  sontaHead: {
    id: string;
    name: string;
    phone: string;
    profileImageUrl: string;
  };
  meeting: {
    id: string;
    title: string;
  };
  checkInTimestamp: string;
  checkInMethod: CheckInMethod;
  facialConfidenceScore?: number;
  isLate: boolean;
  verificationAttempts: number;
}

export interface PendingVerificationRecord {
  id: string;
  meeting: {
    id: string;
    title: string;
  };
  sontaHead: {
    id: string;
    name: string;
    phone: string;
    profileImageUrl: string;
  };
  capturedImageUrl: string;
  facialConfidenceScore?: number;
  createdAt: string;
}

export interface MeetingAttendanceData {
  checkedIn: AttendanceRecord[];
  notCheckedIn: {
    id: string;
    name: string;
    phone: string;
    profileImageUrl: string;
  }[];
  pending: PendingVerificationRecord[];
  statistics: {
    totalExpected: number;
    checkedIn: number;
    notCheckedIn: number;
    pending: number;
    lateArrivals: number;
    manualCheckIns: number;
    attendanceRate: number;
  };
}

export interface LocationVerificationResult {
  valid: boolean;
  distance: number;
}

export interface CheckInResult {
  status: 'approved' | 'pending' | 'rejected';
  message: string;
  attendance?: AttendanceRecord;
  pendingVerificationId?: string;
  attemptsRemaining?: number;
  facialConfidenceScore?: number;
}

export interface QrValidationForCheckIn {
  valid: boolean;
  meeting?: {
    id: string;
    title: string;
    status: string;
    locationName: string;
    locationLatitude: number;
    locationLongitude: number;
    geofenceRadiusMeters: number;
    lateArrivalCutoffMinutes?: number;
    actualStart?: string;
  };
}
