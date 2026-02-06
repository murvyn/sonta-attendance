'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Play,
  Square,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QrCodeDisplay, MeetingForm, MeetingDeleteDialog } from '@/components/meetings';
import { LiveAttendanceMonitor, ManualCheckInModal, PendingVerificationModal } from '@/components/attendance';
import {
  useMeeting,
  useStartMeeting,
  useEndMeeting,
  useRegenerateQr,
  useUpdateMeeting,
  useDeleteMeeting,
} from '@/hooks';
import type { Meeting, CreateMeetingData, UpdateMeetingData } from '@/types';
import { MeetingStatus } from '@/types';

const statusColors: Record<MeetingStatus, string> = {
  [MeetingStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
  [MeetingStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [MeetingStatus.ENDED]: 'bg-gray-100 text-gray-800',
  [MeetingStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

const statusLabels: Record<MeetingStatus, string> = {
  [MeetingStatus.SCHEDULED]: 'Scheduled',
  [MeetingStatus.ACTIVE]: 'Active',
  [MeetingStatus.ENDED]: 'Ended',
  [MeetingStatus.CANCELLED]: 'Cancelled',
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  // Dialog state
  const [manualCheckInOpen, setManualCheckInOpen] = useState(false);
  const [selectedSontaHead, setSelectedSontaHead] = useState<any>(null);
  const [pendingVerificationOpen, setPendingVerificationOpen] = useState(false);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Queries and Mutations
  const { data: meeting, isLoading, error: queryError } = useMeeting(meetingId);
  const startMutation = useStartMeeting();
  const endMutation = useEndMeeting();
  const regenerateQrMutation = useRegenerateQr();
  const updateMutation = useUpdateMeeting();
  const deleteMutation = useDeleteMeeting();

  // Handlers
  const handleStart = async () => {
    if (!meeting) return;
    await startMutation.mutateAsync(meeting.id);
  };

  const handleEnd = async () => {
    if (!meeting) return;
    await endMutation.mutateAsync(meeting.id);
  };

  const handleRegenerateQr = async () => {
    if (!meeting) return;
    await regenerateQrMutation.mutateAsync(meeting.id);
  };

  const handleUpdate = async (data: CreateMeetingData) => {
    if (!meeting) return;
    await updateMutation.mutateAsync({ id: meeting.id, data: data as UpdateMeetingData });
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (!meeting) return;
    await deleteMutation.mutateAsync(meeting.id);
    setIsDeleteOpen(false);
    router.push('/dashboard/meetings');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (queryError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          {queryError ? 'Failed to load meeting details' : 'Meeting not found'}
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard/meetings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Meetings
        </Button>
      </div>
    );
  }

  const startDate = new Date(meeting.scheduledStart);
  const endDate = new Date(meeting.scheduledEnd);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/meetings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
              <Badge className={statusColors[meeting.status]}>
                {statusLabels[meeting.status]}
              </Badge>
            </div>
            {meeting.description && (
              <p className="text-muted-foreground mt-1">{meeting.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {(meeting.status === MeetingStatus.SCHEDULED || meeting.status === MeetingStatus.ACTIVE) && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(true)}
                disabled={updateMutation.isPending}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          {meeting.status === MeetingStatus.SCHEDULED && (
            <Button onClick={handleStart} disabled={startMutation.isPending}>
              {startMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start Meeting
            </Button>
          )}
          {meeting.status === MeetingStatus.ACTIVE && (
            <Button variant="destructive" onClick={handleEnd} disabled={endMutation.isPending}>
              {endMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              End Meeting
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Meeting Details */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{meeting.locationName}</p>
                {meeting.locationAddress && (
                  <p className="text-sm text-muted-foreground">{meeting.locationAddress}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Geofence: {meeting.geofenceRadiusMeters}m radius
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                </p>
                {meeting.actualStart && (
                  <p className="text-sm text-muted-foreground">
                    Started: {format(new Date(meeting.actualStart), 'h:mm a')}
                  </p>
                )}
                {meeting.actualEnd && (
                  <p className="text-sm text-muted-foreground">
                    Ended: {format(new Date(meeting.actualEnd), 'h:mm a')}
                  </p>
                )}
              </div>
            </div>

            {meeting.expectedAttendees && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{meeting.expectedAttendees} expected attendees</p>
                    {meeting.lateArrivalCutoffMinutes && (
                      <p className="text-sm text-muted-foreground">
                        Late after {meeting.lateArrivalCutoffMinutes} minutes
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">QR Strategy</p>
              <p className="font-medium capitalize">
                {meeting.qrExpiryStrategy.replace('_', ' ')}
                {meeting.qrExpiryStrategy === 'time_based' && meeting.qrExpiryMinutes && (
                  <span className="text-muted-foreground"> ({meeting.qrExpiryMinutes} min)</span>
                )}
                {meeting.qrExpiryStrategy === 'max_scans' && meeting.qrMaxScans && (
                  <span className="text-muted-foreground"> ({meeting.qrMaxScans} scans)</span>
                )}
              </p>
            </div>

            {meeting.createdBy && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Created by</p>
                <p className="font-medium">{meeting.createdBy.fullName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <QrCodeDisplay
          qrCode={meeting.qrCode}
          meetingId={meeting.id}
          meetingTitle={meeting.title}
          isActive={meeting.status === MeetingStatus.ACTIVE || meeting.status === MeetingStatus.SCHEDULED}
          onRegenerate={handleRegenerateQr}
        />
      </div>

      {/* Live Attendance Monitor */}
      {meeting.status === MeetingStatus.ACTIVE && (
        <LiveAttendanceMonitor
          meetingId={meeting.id}
          onManualCheckIn={(sontaHead) => {
            setSelectedSontaHead(sontaHead);
            setManualCheckInOpen(true);
          }}
          onReviewPending={(pendingId) => {
            setSelectedPendingId(pendingId);
            setPendingVerificationOpen(true);
          }}
        />
      )}

      {/* Manual Check-In Modal */}
      <ManualCheckInModal
        open={manualCheckInOpen}
        onClose={() => {
          setManualCheckInOpen(false);
          setSelectedSontaHead(null);
        }}
        meetingId={meeting.id}
        sontaHead={selectedSontaHead}
        onSuccess={() => {
          // Modal will close automatically, attendance monitor will update via WebSocket
        }}
      />

      {/* Pending Verification Modal */}
      <PendingVerificationModal
        open={pendingVerificationOpen}
        onClose={() => {
          setPendingVerificationOpen(false);
          setSelectedPendingId(null);
        }}
        pendingVerificationId={selectedPendingId}
        onSuccess={() => {
          // Modal will close automatically, attendance monitor will update via WebSocket
        }}
      />

      {/* Edit Meeting Form */}
      <MeetingForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdate}
        meeting={meeting}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <MeetingDeleteDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        meeting={meeting}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
