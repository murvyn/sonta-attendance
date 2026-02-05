'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyMagicLink, isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid magic link. No token provided.');
      return;
    }

    const verify = async () => {
      try {
        await verifyMagicLink({ token });
        setStatus('success');
        // Redirect after short delay to show success
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } catch (error) {
        setStatus('error');
        if (error instanceof Error) {
          if (error.message.includes('expired')) {
            setErrorMessage(
              'This magic link has expired. Please request a new one.'
            );
          } else if (error.message.includes('used')) {
            setErrorMessage(
              'This magic link has already been used. Please request a new one.'
            );
          } else {
            setErrorMessage('Invalid magic link. Please request a new one.');
          }
        } else {
          setErrorMessage('Something went wrong. Please try again.');
        }
      }
    };

    verify();
  }, [searchParams, verifyMagicLink, router]);

  useEffect(() => {
    if (isAuthenticated && status === 'success') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-soft">
        <CardContent className="pt-8 pb-8">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold">
                Verifying your magic link...
              </h2>
              <p className="text-muted-foreground">
                Please wait while we sign you in.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold">Successfully signed in!</h2>
              <p className="text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-danger" />
              </div>
              <h2 className="text-xl font-semibold">Unable to sign in</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => router.push('/login')} className="mt-4">
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyMagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
