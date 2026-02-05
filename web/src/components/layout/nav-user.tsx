'use client';

import { useRouter } from 'next/navigation';
import {
  ChevronsUpDown,
  LogOut,
  User,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store';
import { AdminRole } from '@/types';

export function NavUser() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isMobile } = useSidebar();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    if (!user?.role) return null;

    if (user.role === AdminRole.SUPER_ADMIN) {
      return (
        <Badge className="bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Super Admin
        </Badge>
      );
    }

    return (
      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
        <Shield className="mr-1 h-3 w-3" />
        Admin
      </Badge>
    );
  };

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover-scale transition-smooth"
            >
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-full gradient-hero opacity-75 blur-sm" />
                <Avatar className="relative h-8 w-8 border-2 border-card">
                  <AvatarFallback className="bg-gradient-hero text-primary-foreground font-bold text-xs">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.fullName || user.email}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-72 rounded-lg animate-scale-in shadow-strong"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-4 font-normal">
              <div className="flex flex-col space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-hero text-primary-foreground font-bold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">
                      {user.fullName || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">{getRoleBadge()}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/profile')}
              className="cursor-pointer py-2.5 transition-smooth hover-scale"
            >
              <User className="mr-3 h-4 w-4" />
              <span className="font-medium">Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer py-2.5 text-danger hover:text-danger hover:bg-danger/10 transition-smooth"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
