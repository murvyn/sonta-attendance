'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { AdminRole } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sonta Heads', href: '/dashboard/sonta-heads', icon: Users },
  { name: 'Meetings', href: '/dashboard/meetings', icon: Calendar },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'Admin Users', href: '/dashboard/admins', icon: UserCog },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === AdminRole.SUPER_ADMIN;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 shadow-soft transform transition-transform duration-300 ease-out md:translate-x-0 md:static md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="relative flex h-16 items-center border-b border-border/50 px-4 bg-muted/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group transition-smooth"
          >
            {/* Logo Icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-primary transition-smooth group-hover:scale-105">
              <span className="text-lg font-black text-primary-foreground">SA</span>
            </div>

            {/* Brand Text */}
            <div className="flex flex-col">
              <span className="text-base font-bold text-primary leading-tight">Sonta</span>
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">ATTENDANCE</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 overflow-y-auto scrollbar-thin" style={{ height: 'calc(100vh - 4rem)' }}>
          {/* Main Navigation Section */}
          <div className="mb-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Main
              </span>
              <div className="h-px flex-1 bg-border/50" />
            </div>

            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-smooth overflow-hidden',
                    'stagger-delay-' + ((index % 6) + 1),
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-primary'
                      : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-primary-foreground animate-slide-in-left" />
                  )}

                  {/* Icon with Transition */}
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-smooth',
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    )}
                  />

                  {/* Label */}
                  <span className="flex-1">{item.name}</span>

                </Link>
              );
            })}
          </div>

          {/* Admin Navigation Section */}
          {isSuperAdmin && (
            <div className="mt-4">
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Administration
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              {adminNavigation.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-smooth overflow-hidden',
                      'stagger-delay-' + ((index % 6) + 1),
                      isActive
                        ? 'bg-secondary text-secondary-foreground shadow-primary'
                        : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-secondary-foreground animate-slide-in-left" />
                    )}

                    {/* Icon with Transition */}
                    <item.icon
                      className={cn(
                        'h-5 w-5 transition-smooth',
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      )}
                    />

                    {/* Label */}
                    <span className="flex-1">{item.name}</span>

                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer Spacer */}
          <div className="flex-1 min-h-4" />

          {/* Version Badge */}
          <div className="mt-auto pt-4 px-3 pb-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">v1.0.0</span>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-success animate-status-pulse" />
                <span className="font-semibold">Live</span>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
