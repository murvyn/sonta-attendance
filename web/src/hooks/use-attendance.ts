import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attendanceService } from '@/services/attendance.service';
import type {
  MeetingAttendanceData,
  PendingVerificationRecord,
} from '@/types';
import { getErrorMessage } from '@/types/errors';

// Query keys factory
export const attendanceKeys = {
  all: ['attendance'] as const,
  meeting: (meetingId: string) => [...attendanceKeys.all, 'meeting', meetingId] as const,
  pending: (meetingId?: string) => [...attendanceKeys.all, 'pending', meetingId] as const,
};

// Queries
export function useMeetingAttendance(meetingId: string) {
  return useQuery<MeetingAttendanceData>({
    queryKey: attendanceKeys.meeting(meetingId),
    queryFn: () => attendanceService.getMeetingAttendance(meetingId),
    enabled: !!meetingId,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });
}

export function usePendingVerifications(meetingId?: string) {
  return useQuery<PendingVerificationRecord[]>({
    queryKey: attendanceKeys.pending(meetingId),
    queryFn: () => attendanceService.getPendingVerifications(meetingId),
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });
}

// Public mutations (no auth required)
export function useVerifyLocation() {
  return useMutation({
    mutationFn: ({
      meetingId,
      latitude,
      longitude,
    }: {
      meetingId: string;
      latitude: number;
      longitude: number;
    }) => attendanceService.verifyLocation(meetingId, latitude, longitude),
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCheckIn() {
  return useMutation({
    mutationFn: ({
      qrToken,
      latitude,
      longitude,
      capturedImage,
      deviceInfo,
    }: {
      qrToken: string;
      latitude: number;
      longitude: number;
      capturedImage: File;
      deviceInfo?: string;
    }) =>
      attendanceService.checkIn(
        qrToken,
        latitude,
        longitude,
        capturedImage,
        deviceInfo
      ),
    onSuccess: (data) => {
      if (data.status === 'approved') {
        toast.success('Check-in successful!');
      } else if (data.status === 'pending') {
        toast.success('Check-in submitted for review');
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Protected mutations (admin only)
export function useManualCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      meetingId,
      sontaHeadId,
      notes,
    }: {
      meetingId: string;
      sontaHeadId: string;
      notes?: string;
    }) => attendanceService.manualCheckIn(meetingId, sontaHeadId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.meeting(variables.meetingId),
      });
      toast.success('Manual check-in recorded');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRemoveAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attendanceId, meetingId }: { attendanceId: string; meetingId: string }) =>
      attendanceService.removeAttendance(attendanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.meeting(variables.meetingId),
      });
      toast.success('Attendance removed');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useApprovePendingVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, meetingId }: { id: string; meetingId?: string }) =>
      attendanceService.approvePendingVerification(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.pending(variables.meetingId) });
      if (variables.meetingId) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.meeting(variables.meetingId),
        });
      }
      toast.success('Verification approved');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRejectPendingVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, meetingId }: { id: string; reason?: string; meetingId?: string }) =>
      attendanceService.rejectPendingVerification(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.pending(variables.meetingId) });
      toast.success('Verification rejected');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
