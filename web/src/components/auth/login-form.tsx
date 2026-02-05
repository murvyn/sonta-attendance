'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export function LoginForm() {
  const {
    requestMagicLink,
    isLoading,
    magicLinkSent,
    magicLinkEmail,
    resetMagicLinkSent,
  } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: MagicLinkFormValues) => {
    setError(null);
    try {
      await requestMagicLink(values);
    } catch {
      setError('Failed to send magic link. Please try again.');
    }
  };

  const handleTryAgain = () => {
    resetMagicLinkSent();
    setError(null);
  };

  // Magic link sent success state
  if (magicLinkSent) {
    return (
      <div className="space-y-6 stagger-fade-in">
        {/* Mobile Logo */}
        <div className="lg:hidden text-center space-y-2 mb-8">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-hero bg-clip-text text-transparent">
            Sonta Head
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Attendance System
          </p>
        </div>

        <Card className="w-full border-border/50 shadow-soft overflow-hidden">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold">Check Your Email</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                We sent a magic link to{' '}
                <strong className="text-foreground">{magicLinkEmail}</strong>.
                Click the link in the email to sign in.
              </p>
              <p className="text-sm text-muted-foreground">
                The link expires in 10 minutes.
              </p>
              <Button
                variant="outline"
                onClick={handleTryAgain}
                className="mt-4"
              >
                Try a different email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Sonta Head Attendance System v1.0.0
        </p>
      </div>
    );
  }

  // Default email input form
  return (
    <div className="space-y-6 stagger-fade-in">
      {/* Mobile Logo */}
      <div className="lg:hidden text-center space-y-2 mb-8">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-hero bg-clip-text text-transparent">
          Sonta Head
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          Attendance System
        </p>
      </div>

      <Card className="w-full border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-black tracking-tight text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your email to receive a magic sign-in link
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg',
                    'bg-danger/10 border border-danger/20 text-danger',
                    'animate-shake'
                  )}
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-smooth">
                          <Mail className="h-4 w-4" />
                        </div>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          autoComplete="email"
                          className="pl-10 h-11 border-border/50 focus:border-primary transition-smooth"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className={cn(
                  'w-full h-11 font-semibold transition-smooth hover-scale',
                  'bg-gradient-hero hover:opacity-90'
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Magic Link...
                  </>
                ) : (
                  'Send Magic Link'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground">
        Sonta Head Attendance System v1.0.0
      </p>
    </div>
  );
}
