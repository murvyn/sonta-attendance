'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LocationPicker } from './location-picker';
import type { Meeting, CreateMeetingData } from '@/types';
import { QrExpiryStrategy } from '@/types';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  locationName: z.string().min(1, 'Location name is required'),
  locationAddress: z.string().optional(),
  locationLatitude: z.number().min(-90).max(90),
  locationLongitude: z.number().min(-180).max(180),
  geofenceRadiusMeters: z.number().min(10).max(1000),
  scheduledDate: z.date(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  lateArrivalCutoffMinutes: z.number().min(1).max(120).optional(),
  qrExpiryStrategy: z.nativeEnum(QrExpiryStrategy),
  qrExpiryMinutes: z.number().min(1).optional(),
  qrMaxScans: z.number().min(1).optional(),
  expectedAttendees: z.number().min(1).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MeetingFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMeetingData) => Promise<void>;
  meeting?: Meeting | null;
  isLoading?: boolean;
}

export function MeetingForm({
  open,
  onClose,
  onSubmit,
  meeting,
  isLoading,
}: MeetingFormProps) {
  const isEditing = !!meeting;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      locationName: '',
      locationAddress: '',
      locationLatitude: 5.6037,
      locationLongitude: -0.1870,
      geofenceRadiusMeters: 100,
      scheduledDate: new Date(),
      startTime: '09:00',
      endTime: '11:00',
      qrExpiryStrategy: QrExpiryStrategy.UNTIL_END,
    },
  });

  useEffect(() => {
    if (meeting) {
      const startDate = new Date(meeting.scheduledStart);
      const endDate = new Date(meeting.scheduledEnd);

      form.reset({
        title: meeting.title,
        description: meeting.description || '',
        locationName: meeting.locationName,
        locationAddress: meeting.locationAddress || '',
        locationLatitude: meeting.locationLatitude,
        locationLongitude: meeting.locationLongitude,
        geofenceRadiusMeters: meeting.geofenceRadiusMeters,
        scheduledDate: startDate,
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        lateArrivalCutoffMinutes: meeting.lateArrivalCutoffMinutes,
        qrExpiryStrategy: meeting.qrExpiryStrategy,
        qrExpiryMinutes: meeting.qrExpiryMinutes,
        qrMaxScans: meeting.qrMaxScans,
        expectedAttendees: meeting.expectedAttendees,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        locationName: '',
        locationAddress: '',
        locationLatitude: 5.6037,
        locationLongitude: -0.1870,
        geofenceRadiusMeters: 100,
        scheduledDate: new Date(),
        startTime: '09:00',
        endTime: '11:00',
        qrExpiryStrategy: QrExpiryStrategy.UNTIL_END,
      });
    }
  }, [meeting, form]);

  const qrStrategy = form.watch('qrExpiryStrategy');

  const handleSubmit = async (values: FormValues) => {
    const [startHour, startMin] = values.startTime.split(':').map(Number);
    const [endHour, endMin] = values.endTime.split(':').map(Number);

    const scheduledStart = new Date(values.scheduledDate);
    scheduledStart.setHours(startHour, startMin, 0, 0);

    const scheduledEnd = new Date(values.scheduledDate);
    scheduledEnd.setHours(endHour, endMin, 0, 0);

    const data: CreateMeetingData = {
      title: values.title,
      description: values.description,
      locationName: values.locationName,
      locationAddress: values.locationAddress,
      locationLatitude: values.locationLatitude,
      locationLongitude: values.locationLongitude,
      geofenceRadiusMeters: values.geofenceRadiusMeters,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
      lateArrivalCutoffMinutes: values.lateArrivalCutoffMinutes,
      qrExpiryStrategy: values.qrExpiryStrategy,
      qrExpiryMinutes: values.qrExpiryStrategy === QrExpiryStrategy.TIME_BASED ? values.qrExpiryMinutes : undefined,
      qrMaxScans: values.qrExpiryStrategy === QrExpiryStrategy.MAX_SCANS ? values.qrMaxScans : undefined,
      expectedAttendees: values.expectedAttendees,
    };

    await onSubmit(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Meeting' : 'Create New Meeting'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly Leadership Sync" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'MMM d, yyyy') : 'Pick date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Picker */}
            <div className="space-y-2">
              <FormLabel>Location *</FormLabel>
              <LocationPicker
                latitude={form.watch('locationLatitude')}
                longitude={form.watch('locationLongitude')}
                radius={form.watch('geofenceRadiusMeters')}
                locationName={form.watch('locationName')}
                locationAddress={form.watch('locationAddress')}
                onChange={(data) => {
                  form.setValue('locationLatitude', data.latitude);
                  form.setValue('locationLongitude', data.longitude);
                  form.setValue('geofenceRadiusMeters', data.radius);
                  form.setValue('locationName', data.locationName);
                  form.setValue('locationAddress', data.locationAddress || '');
                }}
              />
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expectedAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Attendees</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 25"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lateArrivalCutoffMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Late Cutoff (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 15"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Flag arrivals after this many minutes as late
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* QR Expiry Strategy */}
            <FormField
              control={form.control}
              name="qrExpiryStrategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>QR Code Expiry</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={QrExpiryStrategy.UNTIL_END}>
                        Valid until meeting ends (Recommended)
                      </SelectItem>
                      <SelectItem value={QrExpiryStrategy.TIME_BASED}>
                        Expires after X minutes
                      </SelectItem>
                      <SelectItem value={QrExpiryStrategy.MAX_SCANS}>
                        Expires after X scans
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {qrStrategy === QrExpiryStrategy.TIME_BASED && (
              <FormField
                control={form.control}
                name="qrExpiryMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>QR Expiry Minutes *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {qrStrategy === QrExpiryStrategy.MAX_SCANS && (
              <FormField
                control={form.control}
                name="qrMaxScans"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Scans *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      QR becomes invalid after this many successful scans
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Save Changes' : 'Create Meeting'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
