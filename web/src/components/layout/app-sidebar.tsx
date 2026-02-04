'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  UserCog,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain, type NavMainItem } from './nav-main';
import { NavSecondary, type NavSecondaryItem } from './nav-secondary';
import { NavUser } from './nav-user';
import { useAuthStore } from '@/store';
import { AdminRole } from '@/types';

const mainNavItems: NavMainItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Sonta Heads',
    url: '/dashboard/sonta-heads',
    icon: Users,
  },
  {
    title: 'Meetings',
    url: '/dashboard/meetings',
    icon: Calendar,
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: BarChart3,
  },
];

const adminNavItems: NavSecondaryItem[] = [
  {
    title: 'Admin Users',
    url: '/dashboard/admins',
    icon: UserCog,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === AdminRole.SUPER_ADMIN;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-2 py-1 group transition-smooth"
            >
              {/* Logo Icon with Gradient Background */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero shadow-primary transition-smooth group-hover:scale-105 shrink-0">
                <span className="text-lg font-black text-primary-foreground">SA</span>
              </div>

              {/* Brand Text - Hidden when collapsed */}
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-base font-bold text-primary leading-tight">Sonta</span>
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                  ATTENDANCE
                </span>
              </div>
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <NavMain items={mainNavItems} />

        {/* Admin Navigation - Only for Super Admins */}
        {isSuperAdmin && <NavSecondary items={adminNavItems} className="mt-auto" />}

        {/* Version Badge */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className="px-2 py-3 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                <span className="font-medium">v1.0.0</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-success animate-status-pulse" />
                  <span className="font-semibold">Live</span>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
