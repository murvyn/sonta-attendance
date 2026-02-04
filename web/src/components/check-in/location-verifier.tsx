'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { attendanceService } from '@/services';

interface LocationVerifierProps {
  meetingId: string;
  meetingLocation: {
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  onVerified: (latitude: number, longitude: number) => void;
  onError?: (error: string) => void;
}

type VerificationStatus = 'idle' | 'requesting' | 'verifying' | 'success' | 'error';

export function LocationVerifier({
  meetingId,
  meetingLocation,
  onVerified,
  onError,
}: LocationVerifierProps) {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const verifyLocation = useCallback(async (latitude: number, longitude: number) => {
    setStatus('verifying');
    try {
      const result = await attendanceService.verifyLocation(meetingId, latitude, longitude);
      setDistance(result.distance);

      if (result.valid) {
        setStatus('success');
        onVerified(latitude, longitude);
      } else {
        setStatus('error');
        const errorMsg = `You are ${Math.round(result.distance)}m away from the meeting location. You need to be within ${meetingLocation.radiusMeters}m to check in.`;
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      setStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Failed to verify location';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [meetingId, meetingLocation.radiusMeters, onVerified, onError]);

  const requestLocation = useCallback(() => {
    setStatus('requesting');
    setError(null);

    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by your browser');
      onError?.('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        verifyLocation(latitude, longitude);
      },
      (err) => {
        setStatus('error');
        let errorMsg = 'Failed to get your location';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Location access was denied. Please enable location permissions.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        setError(errorMsg);
        onError?.(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [verifyLocation, onError]);

  useEffect(() => {
    // Auto-request location on mount
    requestLocation();
  }, [requestLocation]);

  const getStatusIcon = () => {
    switch (status) {
      case 'requesting':
      case 'verifying':
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
      default:
        return <MapPin className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'requesting':
        return 'Requesting your location...';
      case 'verifying':
        return 'Verifying your location...';
      case 'success':
        return distance !== null
          ? `Location verified! You are ${Math.round(distance)}m from the meeting.`
          : 'Location verified!';
      case 'error':
        return error || 'Location verification failed';
      default:
        return 'Tap below to verify your location';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Navigation className="h-5 w-5" />
          Verify Location
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-3 py-4">
          {getStatusIcon()}
          <p
            className={`text-sm text-center ${
              status === 'error' ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {getStatusMessage()}
          </p>
        </div>

        <div className="w-full p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">Meeting Location</p>
          <p className="font-medium">{meetingLocation.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Within {meetingLocation.radiusMeters}m radius
          </p>
        </div>

        {userLocation && (
          <p className="text-xs text-muted-foreground">
            Your coordinates: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
          </p>
        )}

        {(status === 'idle' || status === 'error') && (
          <Button onClick={requestLocation} className="w-full">
            <MapPin className="mr-2 h-4 w-4" />
            {status === 'error' ? 'Try Again' : 'Verify Location'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
