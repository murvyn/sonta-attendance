'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './app-sidebar';
import { SiteHeader } from './site-header';
import { ProtectedRoute } from '@/components/auth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          {/* Main Content Area with Background Pattern */}
          <main className="relative flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin">
            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 bg-dots opacity-30 pointer-events-none" />
            <div className="fixed top-0 right-0 w-1/2 h-1/2 bg-gradient-radial pointer-events-none" />

            {/* Content with Fade-in Animation */}
            <div className="relative z-10 animate-fade-in">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
