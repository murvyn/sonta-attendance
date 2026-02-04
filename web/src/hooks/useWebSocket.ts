import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UseWebSocketOptions {
  meetingId?: string;
  enabled?: boolean;
}

interface AttendanceUpdateData {
  type: 'new' | 'removed';
  attendance?: any;
  attendanceId?: string;
}

interface PendingVerificationData {
  id: string;
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

interface MeetingStatusData {
  meetingId: string;
  status: string;
}

interface QrRegeneratedData {
  meetingId: string;
  qrCode: any;
}

export function useWebSocket({ meetingId, enabled = true }: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [attendanceUpdates, setAttendanceUpdates] = useState<AttendanceUpdateData[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerificationData[]>([]);
  const [meetingStatusChange, setMeetingStatusChange] = useState<MeetingStatusData | null>(null);
  const [qrRegenerated, setQrRegenerated] = useState<QrRegeneratedData | null>(null);

  // Callbacks for event handlers
  const onAttendanceUpdate = useCallback((data: AttendanceUpdateData) => {
    setAttendanceUpdates((prev) => [...prev, data]);
  }, []);

  const onPendingVerification = useCallback((data: PendingVerificationData) => {
    setPendingVerifications((prev) => [...prev, data]);
  }, []);

  const onMeetingStatusChanged = useCallback((data: MeetingStatusData) => {
    setMeetingStatusChange(data);
  }, []);

  const onQrRegenerated = useCallback((data: QrRegeneratedData) => {
    setQrRegenerated(data);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Create socket connection
    const socket = io(`${SOCKET_URL}/attendance`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setIsConnected(true);

      // Join meeting room if meetingId is provided
      if (meetingId) {
        socket.emit('join-meeting', { meetingId });
      }
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Attendance event handlers
    socket.on('attendance-update', onAttendanceUpdate);
    socket.on('pending-verification', onPendingVerification);
    socket.on('meeting-status-changed', onMeetingStatusChanged);
    socket.on('qr-regenerated', onQrRegenerated);

    // Cleanup
    return () => {
      if (meetingId) {
        socket.emit('leave-meeting', { meetingId });
      }
      socket.off('attendance-update', onAttendanceUpdate);
      socket.off('pending-verification', onPendingVerification);
      socket.off('meeting-status-changed', onMeetingStatusChanged);
      socket.off('qr-regenerated', onQrRegenerated);
      socket.disconnect();
    };
  }, [
    enabled,
    meetingId,
    onAttendanceUpdate,
    onPendingVerification,
    onMeetingStatusChanged,
    onQrRegenerated,
  ]);

  // Method to manually join a meeting room
  const joinMeeting = useCallback((newMeetingId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-meeting', { meetingId: newMeetingId });
    }
  }, [isConnected]);

  // Method to manually leave a meeting room
  const leaveMeeting = useCallback((oldMeetingId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-meeting', { meetingId: oldMeetingId });
    }
  }, [isConnected]);

  // Clear accumulated updates
  const clearAttendanceUpdates = useCallback(() => {
    setAttendanceUpdates([]);
  }, []);

  const clearPendingVerifications = useCallback(() => {
    setPendingVerifications([]);
  }, []);

  return {
    isConnected,
    attendanceUpdates,
    pendingVerifications,
    meetingStatusChange,
    qrRegenerated,
    joinMeeting,
    leaveMeeting,
    clearAttendanceUpdates,
    clearPendingVerifications,
  };
}
