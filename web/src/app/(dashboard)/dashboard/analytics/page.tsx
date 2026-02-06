'use client';

import { useState } from 'react';
import { useAnalyticsOverview, useAttendanceTrends, useExportReport } from '@/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { CalendarIcon, Download, TrendingUp, Users, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

const lineChartConfig = {
  rate: {
    label: "Attendance Rate (%)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const barChartConfig = {
  expected: {
    label: "Expected",
    color: "var(--chart-2)",
  },
  actual: {
    label: "Actual",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Build query params
  const params = {
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  };

  // Queries
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(params);
  const { data: trends = [], isLoading: trendsLoading } = useAttendanceTrends(params);
  const loading = overviewLoading || trendsLoading;

  // Mutations
  const exportMutation = useExportReport();

  const handleExport = async (exportFormat: 'csv' | 'pdf') => {
    const exportParams = {
      format: exportFormat,
      startDate: dateRange.from ? dateRange.from.toISOString() : undefined,
      endDate: dateRange.to ? dateRange.to.toISOString() : undefined,
    };
    await exportMutation.mutateAsync(exportParams);
  };

  const trendsChartData = trends.map((t) => ({
    date: format(new Date(t.date), 'MMM dd'),
    meetingTitle: t.meetingTitle,
    expected: t.expected,
    actual: t.actual,
    rate: Math.round(t.rate),
  }));

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <div className="text-muted-foreground font-medium">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">
            Analytics
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Attendance statistics and insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal h-11 border-border/50 transition-smooth hover-scale',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>All time</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={() => handleExport('csv')}
            disabled={exportMutation.isPending}
            variant="outline"
            className="h-11 transition-smooth hover-scale"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            disabled={exportMutation.isPending}
            className="h-11 transition-smooth hover-scale"
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {overview && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group overflow-hidden border-border/50 shadow-soft hover-lift transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Total Meetings
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 transition-smooth group-hover:scale-110">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black tracking-tight">{overview.totalMeetings}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {overview.totalSontaHeads} active members
                </p>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-border/50 shadow-soft hover-lift transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Avg Attendance Rate
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 transition-smooth group-hover:scale-110">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black tracking-tight">{overview.averageAttendanceRate}%</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {overview.totalAttendance} total check-ins
                </p>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-border/50 shadow-soft hover-lift transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Late Arrivals
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 transition-smooth group-hover:scale-110">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black tracking-tight">{overview.lateArrivals}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {overview.lateArrivalRate.toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-border/50 shadow-soft hover-lift transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Manual Check-ins
                </CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 transition-smooth group-hover:scale-110">
                  <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black tracking-tight">{overview.manualCheckIns}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1">
                  {overview.manualCheckInRate.toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {trends.length > 0 && (
            <>
              {/* Line Chart - Attendance Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>
                    Attendance rate over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={lineChartConfig} className="aspect-auto h-[250px] w-full">
                    <LineChart
                      accessibilityLayer
                      data={trendsChartData}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Line
                        dataKey="rate"
                        type="natural"
                        stroke="var(--color-rate)"
                        strokeWidth={2}
                        dot={{
                          fill: "var(--color-rate)",
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 leading-none font-medium">
                    {overview.averageAttendanceRate}% average attendance rate <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="text-muted-foreground leading-none">
                    Showing attendance rate across {trends.length} meetings
                  </div>
                </CardFooter>
              </Card>

              {/* Bar Chart - Expected vs Actual */}
              <Card>
                <CardHeader>
                  <CardTitle>Expected vs Actual Attendance</CardTitle>
                  <CardDescription>
                    Comparison by meeting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={barChartConfig} className="aspect-auto h-[250px] w-full">
                    <BarChart accessibilityLayer data={trendsChartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="expected" fill="var(--color-expected)" radius={8} />
                      <Bar dataKey="actual" fill="var(--color-actual)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                  <div className="flex gap-2 leading-none font-medium">
                    {overview.totalAttendance} total check-ins recorded <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="text-muted-foreground leading-none">
                    Comparing expected vs actual attendance per meeting
                  </div>
                </CardFooter>
              </Card>

              {/* Meeting Breakdown */}
              <Card className="border-border/50 shadow-soft overflow-hidden">
                <CardHeader>
                  <CardTitle>Meeting Breakdown</CardTitle>
                  <CardDescription>
                    Detailed attendance by meeting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trends.map((trend, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0 transition-smooth hover:bg-accent/50 rounded-lg p-3 -m-3"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-base">{trend.meetingTitle}</p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {format(new Date(trend.date), 'PPP')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black tracking-tight">{Math.round(trend.rate)}%</p>
                          <p className="text-sm text-muted-foreground font-semibold">
                            {trend.actual}/{trend.expected}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
