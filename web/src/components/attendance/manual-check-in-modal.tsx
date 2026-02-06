'use client';

import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useManualCheckIn } from '@/hooks/use-attendance';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';

interface ManualCheckInModalProps {
  open: boolean;
  onClose: () => void;
  meetingId: string;
  sontaHead: {
    id: string;
    name: string;
    sontaName?: string;
    phone: string;
    profileImageUrl: string;
  } | null;
  onSuccess?: () => void;
}

export function ManualCheckInModal({
  open,
  onClose,
  meetingId,
  sontaHead,
  onSuccess,
}: ManualCheckInModalProps) {
  const [notes, setNotes] = useState('');
  const manualCheckIn = useManualCheckIn();

  const handleSubmit = () => {
    if (!sontaHead) return;

    manualCheckIn.mutate(
      { meetingId, sontaHeadId: sontaHead.id, notes: notes || undefined },
      {
        onSuccess: () => {
          toast.success(`${sontaHead.name} checked in successfully`);
          onSuccess?.();
          handleClose();
        },
      }
    );
  };

  const isSubmitting = manualCheckIn.isPending;

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  if (!sontaHead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Manual Check-in
          </DialogTitle>
          <DialogDescription>
            Manually check in a member who couldn't use the automated system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getImageUrl(sontaHead.profileImageUrl)} />
              <AvatarFallback>{sontaHead.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{sontaHead.name}</p>
              <p className="text-sm text-muted-foreground">{sontaHead.sontaName || 'No Sonta'}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Reason for manual check-in..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              e.g., "Camera not working", "Network issues", etc.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking in...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Check In
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
