'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, Loader2, AlertCircle, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (imageFile: File) => void;
  onError?: (error: string) => void;
  isSubmitting?: boolean;
}

export function CameraCapture({ onCapture, onError, isSubmitting = false }: CameraCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user', // Front-facing camera for selfie
  };

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError(null);
    } else {
      setError('Failed to capture image');
      onError?.('Failed to capture image');
    }
  }, [onError]);

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
  };

  const handleConfirm = useCallback(async () => {
    if (!capturedImage) return;

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create File object
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      onCapture(file);
    } catch {
      setError('Failed to process image');
      onError?.('Failed to process image');
    }
  }, [capturedImage, onCapture, onError]);

  const handleUserMediaError = useCallback(() => {
    setError('Failed to access camera. Please ensure camera permissions are enabled.');
    onError?.('Failed to access camera');
  }, [onError]);

  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Camera className="h-5 w-5" />
          Take Your Photo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {error ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <Button variant="outline" onClick={handleRetake}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        ) : capturedImage ? (
          <>
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Preview
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Make sure your face is clearly visible
            </p>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleRetake}
                disabled={isSubmitting}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Confirm
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMediaError={handleUserMediaError}
                onUserMedia={handleUserMedia}
                className="w-full h-full object-cover"
                mirrored
              />
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {/* Face outline guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-52 border-2 border-dashed border-white/50 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Position your face within the outline</span>
            </div>
            <Button
              onClick={handleCapture}
              disabled={!isCameraReady}
              className="w-full"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Capture Photo
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
