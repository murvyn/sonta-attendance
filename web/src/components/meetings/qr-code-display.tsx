'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RefreshCw, Download, Loader2, QrCode as QrIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QrCode } from '@/types';

interface QrCodeDisplayProps {
  qrCode: QrCode | null | undefined;
  meetingId: string;
  meetingTitle: string;
  isActive: boolean;
  onRegenerate: () => Promise<void>;
}

export function QrCodeDisplay({
  qrCode,
  meetingId,
  meetingTitle,
  isActive,
  onRegenerate,
}: QrCodeDisplayProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!qrCode?.qrImageUrl) return;

    const imageUrl = qrCode.qrImageUrl.startsWith('http')
      ? qrCode.qrImageUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${qrCode.qrImageUrl}`;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${meetingTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  const imageUrl = qrCode?.qrImageUrl
    ? qrCode.qrImageUrl.startsWith('http')
      ? qrCode.qrImageUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${qrCode.qrImageUrl}`
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <QrIcon className="h-5 w-5" />
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageUrl ? (
          <>
            <div className="flex justify-center">
              <div className="relative w-64 h-64 bg-white rounded-lg p-2 border">
                <Image
                  src={imageUrl}
                  alt={`QR Code for ${meetingTitle}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            {qrCode && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Scan count: {qrCode.scanCount}</p>
                {qrCode.expiresAt && (
                  <p>
                    Expires: {new Date(qrCode.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Regenerate
                </Button>
              )}
            </div>

            {isActive && (
              <p className="text-xs text-center text-muted-foreground">
                Display this QR code at the meeting entrance for attendees to scan
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <QrIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              QR code will be available when the meeting starts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
