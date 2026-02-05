'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, User, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store';
import { AdminRole } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

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
        <Badge className="ml-auto bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Super Admin
        </Badge>
      );
    }

    return (
      <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
        <Shield className="mr-1 h-3 w-3" />
        Admin
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl supports-backdrop-filter:bg-card/60 shadow-soft animate-slide-in-left">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover-scale"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative gap-2 hover-scale transition-smooth group"
            >
              {/* Avatar with Gradient Ring */}
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-full gradient-hero opacity-75 blur-sm group-hover:opacity-100 transition-smooth" />
                <Avatar className="relative h-9 w-9 border-2 border-card">
                  <AvatarFallback className="bg-gradient-hero text-primary-foreground font-bold text-sm">
                    {getInitials(user?.fullName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* User Name (hidden on mobile) */}
              <span className="hidden md:inline-block text-sm font-semibold">
                {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-72 animate-scale-in shadow-strong"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex flex-col space-y-3">
                {/* User Info */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-hero text-primary-foreground font-bold">
                      {getInitials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">
                      {user?.fullName || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="flex items-center">
                  {getRoleBadge()}
                </div>
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
      </div>
    </header>
  );
}
