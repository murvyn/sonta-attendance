'use client';

import { format } from 'date-fns';
import { MapPin, Calendar, Clock, Users, MoreVertical, Play, Square, X, QrCode, CheckCircle, Circle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Meeting } from '@/types';
import { MeetingStatus } from '@/types';

interface MeetingCardProps {
  meeting: Meeting;
  onView: (meeting: Meeting) => void;
  onEdit: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
  onStart: (meeting: Meeting) => void;
  onEnd: (meeting: Meeting) => void;
  onCancel: (meeting: Meeting) => void;
}

const getStatusConfig = (status: MeetingStatus) => {
  switch (status) {
    case MeetingStatus.SCHEDULED:
      return {
        icon: Clock,
        className: 'status-info',
        borderClass: 'border-t-info',
        bgClass: 'bg-info/5',
        label: 'Scheduled',
      };
    case MeetingStatus.ACTIVE:
      return {
        icon: CheckCircle,
        className: 'status-success',
        borderClass: 'border-t-success',
        bgClass: 'bg-success/5',
        label: 'Active',
        animate: true,
      };
    case MeetingStatus.ENDED:
      return {
        icon: Circle,
        className: 'bg-muted text-muted-foreground border-muted',
        borderClass: 'border-t-muted',
        bgClass: 'bg-muted/30',
        label: 'Ended',
      };
    case MeetingStatus.CANCELLED:
      return {
        icon: XCircle,
        className: 'status-danger',
        borderClass: 'border-t-danger',
        bgClass: 'bg-danger/5',
        label: 'Cancelled',
      };
  }
};

export function MeetingCard({
  meeting,
  onView,
  onEdit,
  onDelete,
  onStart,
  onEnd,
  onCancel,
}: MeetingCardProps) {
  const startDate = new Date(meeting.scheduledStart);
  const endDate = new Date(meeting.scheduledEnd);
  const statusConfig = getStatusConfig(meeting.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/50 shadow-soft hover-lift transition-smooth cursor-pointer border-t-4",
        statusConfig.borderClass,
        statusConfig.bgClass
      )}
      onClick={() => onView(meeting)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title and Status Badge */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-smooth">
                  {meeting.title}
                </h3>
              </div>

              <Badge
                className={cn(
                  "text-xs font-semibold border flex-shrink-0",
                  statusConfig.className,
                  statusConfig.animate && "animate-status-pulse"
                )}
              >
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Date and Time - Prominent Display */}
            <div className="mb-4 p-3 rounded-lg bg-card/50 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-base font-semibold">
                  {format(startDate, 'EEEE, MMM d, yyyy')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/10 text-secondary">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                </span>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-foreground transition-smooth">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-smooth">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <span className="truncate font-medium">{meeting.locationName}</span>
              </div>

              {meeting.expectedAttendees && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-foreground transition-smooth">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary/10 text-secondary group-hover/item:bg-secondary group-hover/item:text-secondary-foreground transition-smooth">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-medium">{meeting.expectedAttendees} expected attendees</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 opacity-70 group-hover:opacity-100 transition-smooth hover-scale"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="animate-scale-in shadow-strong" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={() => onView(meeting)}
                className="cursor-pointer transition-smooth"
              >
                <QrCode className="mr-2 h-4 w-4" />
                <span className="font-medium">View Details</span>
              </DropdownMenuItem>

              {meeting.status === MeetingStatus.SCHEDULED && (
                <>
                  <DropdownMenuItem
                    onClick={() => onEdit(meeting)}
                    className="cursor-pointer transition-smooth"
                  >
                    <span className="font-medium">Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStart(meeting)}
                    className="cursor-pointer text-success hover:text-success hover:bg-success/10 transition-smooth"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    <span className="font-medium">Start Meeting</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onCancel(meeting)}
                    className="cursor-pointer text-warning hover:text-warning hover:bg-warning/10 transition-smooth"
                  >
                    <X className="mr-2 h-4 w-4" />
                    <span className="font-medium">Cancel</span>
                  </DropdownMenuItem>
                </>
              )}

              {meeting.status === MeetingStatus.ACTIVE && (
                <DropdownMenuItem
                  onClick={() => onEnd(meeting)}
                  className="cursor-pointer text-muted-foreground hover:text-foreground transition-smooth"
                >
                  <Square className="mr-2 h-4 w-4" />
                  <span className="font-medium">End Meeting</span>
                </DropdownMenuItem>
              )}

              {(meeting.status === MeetingStatus.SCHEDULED || meeting.status === MeetingStatus.CANCELLED) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(meeting)}
                    className="cursor-pointer text-danger hover:text-danger hover:bg-danger/10 transition-smooth"
                  >
                    <span className="font-medium">Delete</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
