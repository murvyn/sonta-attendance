'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  UserPlus,
  CalendarPlus,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { SectionCards, type StatCard } from '@/components/dashboard/section-cards';
import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive';
import { DataTable } from '@/components/dashboard/data-table';
import { useAnalyticsOverview, useAttendanceTrends } from '@/hooks/use-analytics';
import { useSontaHeadsCount } from '@/hooks/use-sonta-heads';
import { useMeetings } from '@/hooks/use-meetings';
import { usePendingVerifications } from '@/hooks/use-attendance';
import { MeetingStatus } from '@/types';

function SectionCardsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-border/50 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card className="border-border/50 shadow-soft">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[250px] w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Fetch real data from APIs
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: trends, isLoading: trendsLoading } = useAttendanceTrends();
  const { data: sontaHeadsCount } = useSontaHeadsCount();
  const { data: meetingsData } = useMeetings({ status: MeetingStatus.ACTIVE });
  const { data: pendingVerifications } = usePendingVerifications();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Transform trends data for chart
  const chartData = trends?.map(t => ({
    date: t.date,
    checkIns: t.actual,
    approvalRate: Math.round(t.rate * 100),
  })) || [];

  // Build stats from real API data
  const activeMeetingsCount = meetingsData?.data?.filter(m => m.status === MeetingStatus.ACTIVE).length ?? 0;

  const stats: StatCard[] = [
    {
      title: 'Total Sonta Heads',
      value: sontaHeadsCount ?? overview?.totalSontaHeads ?? 0,
      icon: Users,
      description: 'Registered members',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Active Meetings',
      value: activeMeetingsCount,
      icon: Calendar,
      description: 'Currently in progress',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Total Check-ins',
      value: overview?.totalAttendance ?? 0,
      icon: CheckCircle,
      description: 'Successful verifications',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Pending Reviews',
      value: pendingVerifications?.length ?? 0,
      icon: AlertCircle,
      description: 'Awaiting approval',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  const quickActions = [
    {
      title: 'Add Sonta Head',
      description: 'Register a new member with facial recognition',
      icon: UserPlus,
      href: '/dashboard/sonta-heads',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Create Meeting',
      description: 'Schedule a new meeting with QR code generation',
      icon: CalendarPlus,
      href: '/dashboard/meetings',
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      title: 'View Analytics',
      description: 'Access attendance reports and insights',
      icon: BarChart3,
      href: '/dashboard/analytics',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
  ];

  const isLoading = overviewLoading;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">
          {getGreeting()}, {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Here's what's happening with your attendance system today.
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? <SectionCardsSkeleton /> : <SectionCards cards={stats} />}

      {/* Attendance Trend Chart */}
      {trendsLoading ? <ChartSkeleton /> : <ChartAreaInteractive data={chartData} />}

      {/* Recent Check-ins Table - empty for now, will be populated when we add recent check-ins API */}
      <DataTable data={[]} />

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action, index) => (
            <Link key={action.title} href={action.href}>
              <Card className={cn(
                "group overflow-hidden border-border/50 shadow-soft hover-lift transition-smooth cursor-pointer h-full",
                `stagger-delay-${index + 1}`
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-smooth group-hover:scale-110",
                      action.iconBg
                    )}>
                      <action.icon className={cn("h-6 w-6", action.iconColor)} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-smooth">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {action.description}
                      </p>
                    </div>

                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started Section */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                Set up your attendance system in just a few steps
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/sonta-heads">
                <Button variant="outline" className="transition-smooth hover-scale">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Members
                </Button>
              </Link>
              <Link href="/dashboard/meetings">
                <Button className="transition-smooth hover-scale">
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Create Meeting
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
