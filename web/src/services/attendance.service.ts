import api from './api';
import type {
  LocationVerificationResult,
  CheckInResult,
  MeetingAttendanceData,
  PendingVerificationRecord,
  AttendanceRecord,
  QrValidationForCheckIn,
} from '@/types';

// Create a separate axios instance for public endpoints (no auth)
import axios from 'axios';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const attendanceService = {
  // Public endpoints (used during check-in flow)
  async validateQrForCheckIn(token: string): Promise<QrValidationForCheckIn> {
    const response = await publicApi.get<QrValidationForCheckIn>(`/api/qr/${token}/validate`);
    return response.data;
  },

  async verifyLocation(
    meetingId: string,
    latitude: number,
    longitude: number
  ): Promise<LocationVerificationResult> {
    const response = await publicApi.post<LocationVerificationResult>(
      '/api/attendance/verify-location',
      { meetingId, latitude, longitude }
    );
    return response.data;
  },

  async checkIn(
    qrToken: string,
    latitude: number,
    longitude: number,
    capturedImage: File,
    deviceInfo?: string
  ): Promise<CheckInResult> {
    const formData = new FormData();
    formData.append('qrToken', qrToken);
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    formData.append('capturedImage', capturedImage);
    if (deviceInfo) {
      formData.append('deviceInfo', deviceInfo);
    }

    const response = await publicApi.post<CheckInResult>(
      '/api/attendance/check-in',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Protected endpoints (admin dashboard)
  async getMeetingAttendance(meetingId: string): Promise<MeetingAttendanceData> {
    const response = await api.get<MeetingAttendanceData>(
      `/api/attendance/meeting/${meetingId}`
    );
    return response.data;
  },

  async manualCheckIn(
    meetingId: string,
    sontaHeadId: string,
    notes?: string
  ): Promise<AttendanceRecord> {
    const response = await api.post<AttendanceRecord>('/api/attendance/manual-check-in', {
      meetingId,
      sontaHeadId,
      notes,
    });
    return response.data;
  },

  async removeAttendance(attendanceId: string): Promise<void> {
    await api.delete(`/api/attendance/${attendanceId}`);
  },

  async getPendingVerifications(meetingId?: string): Promise<PendingVerificationRecord[]> {
    const params = meetingId ? { meetingId } : {};
    const response = await api.get<PendingVerificationRecord[]>(
      '/api/attendance/pending-verifications',
      { params }
    );
    return response.data;
  },

  async approvePendingVerification(id: string): Promise<AttendanceRecord> {
    const response = await api.patch<AttendanceRecord>(
      `/api/attendance/pending-verifications/${id}/approve`
    );
    return response.data;
  },

  async rejectPendingVerification(id: string, reason?: string): Promise<void> {
    await api.patch(`/api/attendance/pending-verifications/${id}/reject`, { reason });
  },
};

export default attendanceService;
