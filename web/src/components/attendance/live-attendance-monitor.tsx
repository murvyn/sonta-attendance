'use client';

import { useEffect } from 'react';
import { Users, UserCheck, UserX, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMeetingAttendance } from '@/hooks/use-attendance';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';

interface LiveAttendanceMonitorProps {
  meetingId: string;
  isReadOnly?: boolean;
  onManualCheckIn?: (sontaHead: { id: string; name: string; sontaName?: string; phone: string; profileImageUrl: string }) => void;
  onReviewPending?: (pendingId: string) => void;
}

export function LiveAttendanceMonitor({
  meetingId,
  isReadOnly = false,
  onManualCheckIn,
  onReviewPending,
}: LiveAttendanceMonitorProps) {
  // Use React Query hook for initial data + polling
  const {
    data: attendanceData,
    isLoading,
  } = useMeetingAttendance(meetingId);

  // WebSocket connection for real-time toasts
  const {
    isConnected,
    attendanceUpdates,
    pendingVerifications: wsPendingVerifications,
    clearAttendanceUpdates,
    clearPendingVerifications,
  } = useWebSocket({ meetingId, enabled: !isReadOnly });

  // Show toasts for real-time updates (data refresh handled by React Query polling)
  useEffect(() => {
    if (attendanceUpdates.length > 0) {
      attendanceUpdates.forEach((update) => {
        if (update.type === 'new' && update.attendance) {
          toast.success(`${update.attendance.sontaHead.name} checked in!`);
        } else if (update.type === 'removed') {
          toast.info('Attendance record removed');
        }
      });
      clearAttendanceUpdates();
    }
  }, [attendanceUpdates, clearAttendanceUpdates]);

  // Show toasts for pending verifications
  useEffect(() => {
    if (wsPendingVerifications.length > 0) {
      wsPendingVerifications.forEach((pending) => {
        toast.warning(`New pending verification for ${pending.sontaHead.name}`);
      });
      clearPendingVerifications();
    }
  }, [wsPendingVerifications, clearPendingVerifications]);

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
      {!isReadOnly && (
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Live updates active' : 'Reconnecting...'}
          </span>
        </div>
      )}

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
                      <AvatarImage src={getImageUrl(p.sontaHead.profileImageUrl)} />
                      <AvatarFallback>
                        {p.sontaHead.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{p.sontaHead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.sontaHead.sontaName || 'No Sonta'} • {Number(p.facialConfidenceScore)?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReviewPending?.(p.id)}
                    >
                      Review
                    </Button>
                  )}
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
                      <AvatarImage src={getImageUrl(attendance.sontaHead.profileImageUrl)} />
                      <AvatarFallback>
                        {attendance.sontaHead.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{attendance.sontaHead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {attendance.sontaHead.sontaName || 'No Sonta'}
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
                        {Number(attendance.facialConfidenceScore).toFixed(0)}%
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
                      <AvatarImage src={getImageUrl(sontaHead.profileImageUrl)} />
                      <AvatarFallback>{sontaHead.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{sontaHead.name}</p>
                      <p className="text-sm text-muted-foreground">{sontaHead.sontaName || 'No Sonta'}</p>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onManualCheckIn?.(sontaHead)}
                    >
                      Manual Check-in
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
