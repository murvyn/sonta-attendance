'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, User, Lock, AlertCircle } from 'lucide-react';

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

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await login(values);
      router.push('/dashboard');
    } catch {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="space-y-6 stagger-fade-in">
      {/* Mobile Logo */}
      <div className="lg:hidden text-center space-y-2 mb-8">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-hero bg-clip-text text-transparent">
          Sonta Head
        </h1>
        <p className="text-sm text-muted-foreground font-medium">Attendance System</p>
      </div>

      <Card className="w-full border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-3xl font-black tracking-tight text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-base">
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className={cn(
                  "flex items-start gap-3 p-4 rounded-lg",
                  "bg-danger/10 border border-danger/20 text-danger",
                  "animate-shake"
                )}>
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Username</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-smooth">
                          <User className="h-4 w-4" />
                        </div>
                        <Input
                          placeholder="Enter your username"
                          autoComplete="username"
                          className="pl-10 h-11 border-border/50 focus:border-primary transition-smooth"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-smooth">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          autoComplete="current-password"
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
                  "w-full h-11 font-semibold transition-smooth hover-scale",
                  "bg-gradient-hero hover:opacity-90"
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>

          {/* Default Credentials Info */}
          <div className="mt-6 p-4 rounded-lg bg-info/10 border border-info/20">
            <p className="text-xs text-muted-foreground text-center font-medium">
              Default credentials: <span className="font-semibold text-foreground">superadmin</span> / <span className="font-semibold text-foreground">Admin@123</span>
            </p>
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
