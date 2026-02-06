'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  QrScanner,
  LocationVerifier,
  CameraCapture,
  CheckInResultDisplay,
} from '@/components/check-in';
import { attendanceService } from '@/services';
import type { CheckInResult, QrValidationForCheckIn, MeetingStatus } from '@/types';
import { toast } from 'sonner';

type CheckInStep = 'scan' | 'validate-qr' | 'location' | 'camera' | 'submitting' | 'result';

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const tokenFromUrl = params.token as string | undefined;

  const [step, setStep] = useState<CheckInStep>(tokenFromUrl ? 'validate-qr' : 'scan');
  const [qrToken, setQrToken] = useState<string>(tokenFromUrl || '');
  const [meetingData, setMeetingData] = useState<QrValidationForCheckIn['meeting'] | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);

  const validateQrToken = useCallback(async (token: string) => {
    try {
      const result = await attendanceService.validateQrForCheckIn(token);

      if (!result.valid || !result.meeting) {
        toast.error('Invalid or expired QR code');
        setStep('scan');
        return;
      }

      if (result.meeting.status !== ('active' as MeetingStatus)) {
        toast.error(`Meeting is ${result.meeting.status}. Only active meetings allow check-in.`);
        setStep('scan');
        return;
      }

      setMeetingData(result.meeting);
      setQrToken(token);
      setStep('location');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to validate QR code');
      setStep('scan');
    }
  }, []);

  // Validate QR token on mount if provided via URL
  useEffect(() => {
    if (tokenFromUrl) {
      validateQrToken(tokenFromUrl);
    }
  }, [tokenFromUrl, validateQrToken]);

  const handleQrScan = (token: string) => {
    setQrToken(token);
    setStep('validate-qr');
    validateQrToken(token);
  };

  const handleLocationVerified = (latitude: number, longitude: number) => {
    setUserLocation({ latitude, longitude });
    setStep('camera');
  };

  const handleImageCapture = (imageFile: File) => {
    setStep('submitting');
    submitCheckIn(imageFile);
  };

  const submitCheckIn = async (imageFile: File) => {
    if (!userLocation || !qrToken) {
      toast.error('Missing required data for check-in');
      return;
    }

    try {
      const deviceInfo = `${navigator.userAgent} | ${window.screen.width}x${window.screen.height}`;
      const result = await attendanceService.checkIn(
        qrToken,
        userLocation.latitude,
        userLocation.longitude,
        imageFile,
        deviceInfo
      );

      setCheckInResult(result);

      if (result.attemptsRemaining !== undefined) {
        setAttemptsRemaining(result.attemptsRemaining);
      }

      setStep('result');

      // Show toast based on result
      if (result.status === 'approved') {
        toast.success('Check-in successful!');
      } else if (result.status === 'pending') {
        toast.info('Your check-in is pending verification');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit check-in');
      setStep('camera');
    }
  };

  const handleRetry = () => {
    setCheckInResult(null);
    setStep('camera');
  };

  const handleGoBack = () => {
    router.push('/');
  };

  const handleStartOver = () => {
    setQrToken('');
    setMeetingData(null);
    setUserLocation(null);
    setCheckInResult(null);
    setAttemptsRemaining(3);
    setStep('scan');
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Sonta Head Attendance</h1>
          <p className="text-muted-foreground">Complete the steps below to check in</p>
        </div>

        {/* Progress indicator */}
        {step !== 'scan' && step !== 'result' && meetingData && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{meetingData.title}</p>
              <p className="text-xs text-muted-foreground">{meetingData.locationName}</p>
            </div>
            <div className="flex gap-2">
              <div
                className={`flex-1 h-1 rounded ${
                  step === 'location' || step === 'camera' || step === 'submitting'
                    ? 'bg-primary'
                    : 'bg-gray-200'
                }`}
              />
              <div
                className={`flex-1 h-1 rounded ${
                  step === 'camera' || step === 'submitting' ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
              <div
                className={`flex-1 h-1 rounded ${step === 'submitting' ? 'bg-primary' : 'bg-gray-200'}`}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Location</span>
              <span>Photo</span>
              <span>Submit</span>
            </div>
          </div>
        )}

        {/* Content based on step */}
        {step === 'scan' && (
          <div className="space-y-4">
            <QrScanner onScan={handleQrScan} />
            <Button variant="outline" onClick={handleGoBack} className="w-full max-w-md mx-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        )}

        {step === 'validate-qr' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating QR code...</p>
          </div>
        )}

        {step === 'location' && meetingData && (
          <div className="space-y-4">
            <LocationVerifier
              meetingId={meetingData.id}
              meetingLocation={{
                name: meetingData.locationName,
                latitude: meetingData.locationLatitude,
                longitude: meetingData.locationLongitude,
                radiusMeters: meetingData.geofenceRadiusMeters,
              }}
              onVerified={handleLocationVerified}
            />
            <Button variant="outline" onClick={handleStartOver} className="w-full max-w-md mx-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </div>
        )}

        {step === 'camera' && (
          <div className="space-y-4">
            <CameraCapture onCapture={handleImageCapture} />
            <Button variant="outline" onClick={() => setStep('location')} className="w-full max-w-md mx-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Location
            </Button>
          </div>
        )}

        {step === 'submitting' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your identity...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        {step === 'result' && checkInResult && (
          <div className="space-y-4">
            <CheckInResultDisplay
              result={checkInResult}
              onRetry={checkInResult.status === 'rejected' ? handleRetry : undefined}
              onGoBack={handleGoBack}
              attemptsRemaining={attemptsRemaining}
            />
            {checkInResult.status === 'approved' && (
              <Button variant="outline" onClick={handleStartOver} className="w-full max-w-md mx-auto">
                Check In Another Person
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
