'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { attendanceService } from '@/services';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { MeetingAttendanceData } from '@/types';
import { toast } from 'sonner';

interface LiveAttendanceMonitorProps {
  meetingId: string;
  onManualCheckIn?: (sontaHead: { id: string; name: string; phone: string; profileImageUrl: string }) => void;
  onReviewPending?: (pendingId: string) => void;
}

export function LiveAttendanceMonitor({
  meetingId,
  onManualCheckIn,
  onReviewPending,
}: LiveAttendanceMonitorProps) {
  const [attendanceData, setAttendanceData] = useState<MeetingAttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket connection
  const {
    isConnected,
    attendanceUpdates,
    pendingVerifications,
    clearAttendanceUpdates,
    clearPendingVerifications,
  } = useWebSocket({ meetingId, enabled: true });

  // Load initial attendance data
  useEffect(() => {
    loadAttendanceData();
  }, [meetingId]);

  // Handle real-time attendance updates
  useEffect(() => {
    if (attendanceUpdates.length > 0) {
      attendanceUpdates.forEach((update) => {
        if (update.type === 'new' && update.attendance) {
          // Add new attendance
          setAttendanceData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              checkedIn: [...prev.checkedIn, update.attendance],
              notCheckedIn: prev.notCheckedIn.filter(
                (sh) => sh.id !== update.attendance.sontaHead.id
              ),
              statistics: {
                ...prev.statistics,
                checkedIn: prev.statistics.checkedIn + 1,
                notCheckedIn: prev.statistics.notCheckedIn - 1,
                attendanceRate: ((prev.statistics.checkedIn + 1) / prev.statistics.totalExpected) * 100,
                lateArrivals: prev.statistics.lateArrivals + (update.attendance.isLate ? 1 : 0),
                manualCheckIns: prev.statistics.manualCheckIns + (update.attendance.checkInMethod === 'manual_admin' ? 1 : 0),
              },
            };
          });
          toast.success(`${update.attendance.sontaHead.name} checked in!`);
        } else if (update.type === 'removed' && update.attendanceId) {
          // Remove attendance
          setAttendanceData((prev) => {
            if (!prev) return prev;
            const removed = prev.checkedIn.find((a) => a.id === update.attendanceId);
            if (!removed) return prev;

            return {
              ...prev,
              checkedIn: prev.checkedIn.filter((a) => a.id !== update.attendanceId),
              notCheckedIn: [...prev.notCheckedIn, removed.sontaHead],
              statistics: {
                ...prev.statistics,
                checkedIn: prev.statistics.checkedIn - 1,
                notCheckedIn: prev.statistics.notCheckedIn + 1,
                attendanceRate: ((prev.statistics.checkedIn - 1) / prev.statistics.totalExpected) * 100,
              },
            };
          });
          toast.info('Attendance record removed');
        }
      });
      clearAttendanceUpdates();
    }
  }, [attendanceUpdates, clearAttendanceUpdates]);

  // Handle real-time pending verifications
  useEffect(() => {
    if (pendingVerifications.length > 0) {
      pendingVerifications.forEach((pending) => {
        toast.warning(`New pending verification for ${pending.sontaHead.name}`);
        // Reload attendance data to get the updated pending list with full data
        loadAttendanceData();
      });
      clearPendingVerifications();
    }
  }, [pendingVerifications, clearPendingVerifications]);

  const loadAttendanceData = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getMeetingAttendance(meetingId);
      setAttendanceData(data);
    } catch (error) {
      toast.error('Failed to load attendance data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No attendance data available</p>
      </div>
    );
  }

  const { checkedIn, notCheckedIn, pending, statistics } = attendanceData;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        />
        <span className="text-sm text-muted-foreground">
          {isConnected ? 'Live updates active' : 'Reconnecting...'}
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{statistics.totalExpected}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {statistics.checkedIn}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.attendanceRate.toFixed(1)}% attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {statistics.notCheckedIn}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">
                {statistics.pending}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verifications */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Pending Verifications ({pending.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={p.sontaHead.profileImageUrl} />
                      <AvatarFallback>
                        {p.sontaHead.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{p.sontaHead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {p.facialConfidenceScore?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReviewPending?.(p.id)}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checked In List */}
      <Card>
        <CardHeader>
          <CardTitle>Checked In ({checkedIn.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {checkedIn.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No one has checked in yet
            </p>
          ) : (
            <div className="space-y-2">
              {checkedIn.map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={attendance.sontaHead.profileImageUrl} />
                      <AvatarFallback>
                        {attendance.sontaHead.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{attendance.sontaHead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attendance.checkInTimestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attendance.isLate && (
                      <Badge variant="outline" className="text-yellow-600">
                        Late
                      </Badge>
                    )}
                    {attendance.checkInMethod === 'manual_admin' && (
                      <Badge variant="outline">Manual</Badge>
                    )}
                    {attendance.facialConfidenceScore && (
                      <span className="text-sm text-muted-foreground">
                        {attendance.facialConfidenceScore.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Not Checked In List */}
      <Card>
        <CardHeader>
          <CardTitle>Not Checked In ({notCheckedIn.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notCheckedIn.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Everyone has checked in!
            </p>
          ) : (
            <div className="space-y-2">
              {notCheckedIn.map((sontaHead) => (
                <div
                  key={sontaHead.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={sontaHead.profileImageUrl} />
                      <AvatarFallback>{sontaHead.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{sontaHead.name}</p>
                      <p className="text-sm text-muted-foreground">{sontaHead.phone}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onManualCheckIn?.(sontaHead)}
                  >
                    Manual Check-in
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
