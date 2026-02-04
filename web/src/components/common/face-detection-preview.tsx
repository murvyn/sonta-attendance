'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FaceDetectionResult {
  detected: boolean;
  confidence?: number;
  faceCount: number;
  message: string;
}

interface FaceDetectionPreviewProps {
  imageUrl: string | null;
  imageFile?: File | null;
  onDetectionResult?: (result: FaceDetectionResult) => void;
  className?: string;
}

export function FaceDetectionPreview({
  imageUrl,
  imageFile,
  onDetectionResult,
  className,
}: FaceDetectionPreviewProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<FaceDetectionResult | null>(null);

  useEffect(() => {
    if (!imageFile || !imageUrl) {
      setDetectionResult(null);
      return;
    }

    // Debounce face detection
    const timeoutId = setTimeout(() => {
      detectFace(imageFile);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [imageFile, imageUrl]);

  const detectFace = async (file: File) => {
    setIsDetecting(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/facial-recognition/detect-preview`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Face detection failed');
      }

      const result: FaceDetectionResult = await response.json();
      setDetectionResult(result);

      if (onDetectionResult) {
        onDetectionResult(result);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      const errorResult: FaceDetectionResult = {
        detected: false,
        faceCount: 0,
        message: 'Failed to detect face. Please try again.',
      };
      setDetectionResult(errorResult);

      if (onDetectionResult) {
        onDetectionResult(errorResult);
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const getStatusConfig = () => {
    if (isDetecting) {
      return {
        icon: Loader2,
        className: 'status-info',
        borderClass: 'border-info',
        bgClass: 'bg-info/10',
        label: 'Detecting face...',
        animate: true,
      };
    }

    if (!detectionResult) {
      return {
        icon: Camera,
        className: 'bg-muted text-muted-foreground border-muted',
        borderClass: 'border-muted',
        bgClass: 'bg-muted/10',
        label: 'Upload a photo',
        animate: false,
      };
    }

    if (detectionResult.detected && detectionResult.faceCount === 1) {
      return {
        icon: CheckCircle,
        className: 'status-success',
        borderClass: 'border-success',
        bgClass: 'bg-success/10',
        label: `Face detected (${Math.round((detectionResult.confidence || 0) * 100)}% confidence)`,
        animate: true,
      };
    }

    if (detectionResult.faceCount > 1) {
      return {
        icon: AlertTriangle,
        className: 'status-warning',
        borderClass: 'border-warning',
        bgClass: 'bg-warning/10',
        label: `${detectionResult.faceCount} faces detected`,
        animate: false,
      };
    }

    return {
      icon: XCircle,
      className: 'status-danger',
      borderClass: 'border-danger',
      bgClass: 'bg-danger/10',
      label: 'No face detected',
      animate: false,
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Image Preview with Detection Overlay */}
      {imageUrl && (
        <div className="relative w-full aspect-square overflow-hidden rounded-xl border-2 border-border bg-muted">
          <Image
            src={imageUrl}
            alt="Face detection preview"
            fill
            className="object-cover"
          />

          {/* Status Overlay */}
          <div
            className={cn(
              'absolute inset-0 border-4 rounded-xl transition-all duration-300',
              statusConfig.borderClass,
              statusConfig.bgClass
            )}
          >
            {/* Detection Status Badge */}
            <div className="absolute top-3 left-3 right-3">
              <Badge
                className={cn(
                  'text-xs font-semibold border w-full justify-center',
                  statusConfig.className,
                  statusConfig.animate && 'animate-status-pulse'
                )}
              >
                <StatusIcon className={cn('mr-1.5 h-3.5 w-3.5', isDetecting && 'animate-spin')} />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Guidance Message */}
            {detectionResult && (
              <div className="absolute bottom-3 left-3 right-3">
                <div
                  className={cn(
                    'px-3 py-2 rounded-lg border text-xs font-medium backdrop-blur-md',
                    statusConfig.bgClass,
                    statusConfig.borderClass
                  )}
                >
                  {detectionResult.message}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Placeholder */}
      {!imageUrl && (
        <div className="w-full aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
          <Camera className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Upload a clear photo with exactly one face
          </p>
        </div>
      )}

      {/* Guidance Text */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">Photo Requirements:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Exactly one face clearly visible</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Good lighting (no shadows on face)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Face looking directly at camera</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>No sunglasses or face coverings</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
