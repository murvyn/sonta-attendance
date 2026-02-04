'use client';

import { CheckCircle2, Clock, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CheckInResult } from '@/types';

interface CheckInResultDisplayProps {
  result: CheckInResult;
  onRetry?: () => void;
  onGoBack?: () => void;
  attemptsRemaining?: number;
}

export function CheckInResultDisplay({
  result,
  onRetry,
  onGoBack,
  attemptsRemaining,
}: CheckInResultDisplayProps) {
  const getStatusConfig = () => {
    switch (result.status) {
      case 'approved':
        return {
          icon: <CheckCircle2 className="h-16 w-16 text-green-500" />,
          title: 'Check-In Successful!',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'pending':
        return {
          icon: <Clock className="h-16 w-16 text-yellow-500" />,
          title: 'Pending Verification',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'rejected':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: 'Check-In Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-gray-500" />,
          title: 'Unknown Status',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const config = getStatusConfig();
  const canRetry = result.status === 'rejected' && attemptsRemaining !== undefined && attemptsRemaining > 0;

  return (
    <Card className={`w-full max-w-md mx-auto ${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">{config.icon}</div>
        <CardTitle className={config.color}>{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-center text-muted-foreground">{result.message}</p>

        {result.facialConfidenceScore !== undefined && (
          <div className="w-full p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Face Match Confidence
            </p>
            <p className={`text-2xl font-bold text-center ${config.color}`}>
              {(result.facialConfidenceScore * 100).toFixed(1)}%
            </p>
          </div>
        )}

        {result.status === 'approved' && result.attendance && (
          <div className="w-full p-4 bg-white/50 rounded-lg space-y-2">
            <div className="flex items-center gap-3">
              {result.attendance.sontaHead.profileImageUrl && (
                <img
                  src={result.attendance.sontaHead.profileImageUrl}
                  alt={result.attendance.sontaHead.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium">{result.attendance.sontaHead.name}</p>
                <p className="text-sm text-muted-foreground">
                  Checked in at{' '}
                  {new Date(result.attendance.checkInTimestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            {result.attendance.isLate && (
              <div className="flex items-center gap-2 text-yellow-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Marked as late arrival</span>
              </div>
            )}
          </div>
        )}

        {result.status === 'pending' && (
          <div className="w-full p-3 bg-white/50 rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              Your check-in requires manual verification by an administrator.
              You will be notified once your attendance is confirmed.
            </p>
          </div>
        )}

        {canRetry && (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining
              </span>
            </div>
            <Button onClick={onRetry} className="w-full">
              Try Again
            </Button>
          </div>
        )}

        {result.status === 'rejected' && attemptsRemaining === 0 && (
          <div className="w-full p-3 bg-red-100 rounded-lg">
            <p className="text-sm text-center text-red-600">
              You have reached the maximum number of attempts.
              Please contact an administrator for manual check-in.
            </p>
          </div>
        )}

        {onGoBack && (
          <Button variant="outline" onClick={onGoBack} className="w-full mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
