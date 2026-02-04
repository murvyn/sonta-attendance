export interface AnalyticsOverview {
  totalMeetings: number;
  totalAttendance: number;
  totalSontaHeads: number;
  averageAttendanceRate: number;
  lateArrivals: number;
  manualCheckIns: number;
  lateArrivalRate: number;
  manualCheckInRate: number;
}

export interface SontaHeadAnalytics {
  sontaHead: {
    id: string;
    name: string;
    phone: string;
    profileImageUrl: string;
  };
  statistics: {
    totalMeetings: number;
    attended: number;
    missed: number;
    attendanceRate: number;
    onTime: number;
    late: number;
    lateRate: number;
  };
  recentAttendance: Array<{
    id: string;
    meeting: {
      id: string;
      title: string;
      scheduledStart: string;
    };
    checkInTimestamp: string;
    isLate: boolean;
    facialConfidenceScore?: number;
  }>;
}

export interface MeetingAnalytics {
  meeting: {
    id: string;
    title: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart?: string;
    actualEnd?: string;
    status: string;
  };
  statistics: {
    expectedAttendees: number;
    actualAttendees: number;
    attendanceRate: number;
    onTime: number;
    late: number;
    lateRate: number;
    manualCheckIns: number;
    facialRecognitionCheckIns: number;
  };
  timeline: Array<{
    time: string;
    count: number;
    cumulative: number;
  }>;
  attendance: Array<{
    id: string;
    sontaHead: {
      id: string;
      name: string;
      phone: string;
    };
    checkInTimestamp: string;
    isLate: boolean;
    checkInMethod: string;
    facialConfidenceScore?: number;
  }>;
}

export interface AttendanceTrend {
  date: string;
  meetingTitle: string;
  expected: number;
  actual: number;
  rate: number;
}

export interface AttendanceHistoryItem {
  id: string;
  meeting: {
    id: string;
    title: string;
    scheduledStart: string;
    locationName: string;
  };
  checkInTimestamp: string;
  isLate: boolean;
  checkInMethod: string;
  facialConfidenceScore?: number;
}

export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
}

export interface ExportReportParams extends AnalyticsQueryParams {
  format: 'csv' | 'pdf';
  meetingId?: string;
  sontaHeadId?: string;
}
