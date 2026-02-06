'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  UserCog,
  Command,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Sonta</span>
                  <span className="truncate text-xs">Attendance</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <NavMain items={mainNavItems} />

        {/* Admin Navigation - Only for Super Admins */}
        {isSuperAdmin && <NavSecondary items={adminNavItems} className="mt-auto" />}

        
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
