'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth';
import { useAuthStore } from '@/store';
import { CheckCircle, Shield, Zap, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: Shield,
      title: 'Secure Verification',
      description: 'Multi-layer authentication with facial recognition and geofencing',
    },
    {
      icon: CheckCircle,
      title: 'Real-time Tracking',
      description: 'Monitor attendance instantly with live updates and notifications',
    },
    {
      icon: Zap,
      title: 'Quick Check-in',
      description: 'Fast QR-based verification with automatic location validation',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Efficient member management with comprehensive analytics',
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-hero">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          {/* Logo */}
          <div className="mb-12 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 transition-smooth hover:scale-110 hover:bg-white/30">
                <CheckCircle className="h-8 w-8 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Sonta Head</h1>
                <p className="text-sm text-white/80 font-medium">Attendance System</p>
              </div>
            </div>
            <p className="text-lg text-white/90 font-medium max-w-md">
              Streamline attendance tracking with advanced facial recognition and geolocation verification
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex gap-4 items-start group stagger-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 transition-smooth group-hover:bg-white/25 group-hover:scale-110">
                  <feature.icon className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-white">{feature.title}</h3>
                  <p className="text-sm text-white/75 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-12 border-t border-white/10">
            <p className="text-sm text-white/60">
              Sonta Head Attendance System v1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
