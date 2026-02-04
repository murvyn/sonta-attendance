'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CalendarDays, Loader2, CheckCircle, Clock, XCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MeetingCard, MeetingForm, MeetingDeleteDialog } from '@/components/meetings';
import { meetingsService } from '@/services';
import type { Meeting, MeetingQueryParams, CreateMeetingData, UpdateMeetingData } from '@/types';
import { MeetingStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const fetchMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: MeetingQueryParams = {
        page: currentPage,
        limit: 12,
      };
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter as MeetingStatus;
      }

      const result = await meetingsService.getAll(params);
      setMeetings(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      toast.error('Failed to load meetings');
      console.error('Error fetching meetings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const handleCreate = async (data: CreateMeetingData) => {
    try {
      setIsSubmitting(true);
      await meetingsService.create(data);
      toast.success('Meeting created successfully');
      setIsFormOpen(false);
      fetchMeetings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: CreateMeetingData) => {
    if (!selectedMeeting) return;
    try {
      setIsSubmitting(true);
      await meetingsService.update(selectedMeeting.id, data as UpdateMeetingData);
      toast.success('Meeting updated successfully');
      setIsFormOpen(false);
      setSelectedMeeting(null);
      fetchMeetings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMeeting) return;
    try {
      setIsSubmitting(true);
      await meetingsService.delete(selectedMeeting.id);
      toast.success('Meeting deleted successfully');
      setIsDeleteOpen(false);
      setSelectedMeeting(null);
      fetchMeetings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async (meeting: Meeting) => {
    try {
      await meetingsService.start(meeting.id);
      toast.success('Meeting started');
      fetchMeetings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to start meeting');
    }
  };

  const handleEnd = async (meeting: Meeting) => {
    try {
      await meetingsService.end(meeting.id);
      toast.success('Meeting ended');
      fetchMeetings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to end meeting');
    }
  };

  const handleCancel = async (meeting: Meeting) => {
    try {
      await meetingsService.cancel(meeting.id);
      toast.success('Meeting cancelled');
      fetchMeetings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  const openEditForm = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDeleteOpen(true);
  };

  const openCreateForm = () => {
    setSelectedMeeting(null);
    setIsFormOpen(true);
  };

  const viewMeeting = (meeting: Meeting) => {
    router.push(`/dashboard/meetings/${meeting.id}`);
  };

  const statusOptions = [
    { value: 'all', label: 'All Meetings', icon: Calendar, color: 'text-foreground' },
    { value: MeetingStatus.SCHEDULED, label: 'Scheduled', icon: Clock, color: 'text-info' },
    { value: MeetingStatus.ACTIVE, label: 'Active', icon: CheckCircle, color: 'text-success' },
    { value: MeetingStatus.ENDED, label: 'Ended', icon: CalendarDays, color: 'text-muted-foreground' },
    { value: MeetingStatus.CANCELLED, label: 'Cancelled', icon: XCircle, color: 'text-danger' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-hero bg-clip-text text-transparent">
            Meetings
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Manage meetings and QR codes
            {total > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                {total}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={openCreateForm}
          className="transition-smooth hover-scale bg-gradient-hero"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Meeting
        </Button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-3">
        {statusOptions.map((option) => {
          const isActive = statusFilter === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-smooth",
                "border-2",
                isActive
                  ? "bg-gradient-hero text-white border-transparent shadow-md scale-105"
                  : "bg-card border-border/50 hover:border-primary/30 hover:bg-accent hover-scale"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : option.color)} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <Card className="border-border/50 shadow-soft">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <CalendarDays className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">
                  {statusFilter !== 'all' ? 'No Meetings Found' : 'No Meetings Yet'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {statusFilter !== 'all'
                    ? 'No meetings match the selected status filter. Try selecting a different status.'
                    : 'Get started by creating your first meeting with QR code generation and geofencing.'}
                </p>
              </div>
              {statusFilter === 'all' && (
                <Button
                  onClick={openCreateForm}
                  className="mt-4 transition-smooth hover-scale bg-gradient-hero"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Meeting
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting, index) => (
              <div
                key={meeting.id}
                className="stagger-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MeetingCard
                  meeting={meeting}
                  onView={viewMeeting}
                  onEdit={openEditForm}
                  onDelete={openDeleteDialog}
                  onStart={handleStart}
                  onEnd={handleEnd}
                  onCancel={handleCancel}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="border-border/50 shadow-soft">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">
                    Showing page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="transition-smooth hover-scale"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="transition-smooth hover-scale"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Form Dialog */}
      <MeetingForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedMeeting(null);
        }}
        onSubmit={selectedMeeting ? handleUpdate : handleCreate}
        meeting={selectedMeeting}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <MeetingDeleteDialog
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedMeeting(null);
        }}
        onConfirm={handleDelete}
        meeting={selectedMeeting}
        isLoading={isSubmitting}
      />
    </div>
  );
}
