"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePendingVerifications, useApprovePendingVerification, useRejectPendingVerification } from "@/hooks/use-attendance";
import { getImageUrl } from "@/lib/utils";
import type { PendingVerificationRecord } from "@/types/attendance";

interface PendingVerificationModalProps {
  open: boolean;
  onClose: () => void;
  pendingVerificationId: string | null;
  onSuccess?: () => void;
}

export function PendingVerificationModal({
  open,
  onClose,
  pendingVerificationId,
  onSuccess,
}: PendingVerificationModalProps) {
  const [notes, setNotes] = useState("");

  const { data: allPending, isLoading } = usePendingVerifications();
  const approveMutation = useApprovePendingVerification();
  const rejectMutation = useRejectPendingVerification();

  const pending: PendingVerificationRecord | null =
    allPending?.find((p) => p.id === pendingVerificationId) ?? null;

  const isSubmitting = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = () => {
    if (!pendingVerificationId || !pending) return;

    approveMutation.mutate(
      { id: pendingVerificationId, meetingId: pending.meeting.id },
      {
        onSuccess: () => {
          onSuccess?.();
          handleClose();
        },
      }
    );
  };

  const handleReject = () => {
    if (!pendingVerificationId || !pending) return;

    rejectMutation.mutate(
      { id: pendingVerificationId, reason: notes || undefined, meetingId: pending.meeting.id },
      {
        onSuccess: () => {
          onSuccess?.();
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Pending Verification</DialogTitle>
          <DialogDescription>
            Compare the captured photo with the profile photo to verify identity
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pending ? (
          <div className="space-y-4 py-4">
            {/* Member Info */}
            <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={getImageUrl(pending.sontaHead.profileImageUrl)}
                />
                <AvatarFallback>
                  {pending.sontaHead.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{pending.sontaHead.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pending.sontaHead.sontaName || "No Sonta"}
                </p>
              </div>
              {pending.facialConfidenceScore && (
                <Badge variant="outline">
                  {Number(pending.facialConfidenceScore).toFixed(1)}% Match
                </Badge>
              )}
            </div>

            {/* Image Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={getImageUrl(pending.sontaHead.profileImageUrl)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Captured Photo</Label>
                <div className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={getImageUrl(pending.capturedImageUrl)}
                    alt="Captured"
                    className="w-full h-full object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </div>
            </div>

            {/* Meeting Info */}
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="text-muted-foreground">
                Meeting: {pending.meeting.title}
              </p>
              <p className="text-muted-foreground">
                Submitted: {new Date(pending.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="review-notes">Review Notes (optional)</Label>
              <Textarea
                id="review-notes"
                placeholder="Add notes about your decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              No verification data available
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
