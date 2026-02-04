'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChartData {
  date: string;
  checkIns: number;
  approvalRate: number;
}

interface ChartAreaInteractiveProps {
  data?: ChartData[];
}

const defaultData: ChartData[] = [
  { date: '2024-01-01', checkIns: 0, approvalRate: 0 },
  { date: '2024-01-02', checkIns: 0, approvalRate: 0 },
  { date: '2024-01-03', checkIns: 0, approvalRate: 0 },
  { date: '2024-01-04', checkIns: 0, approvalRate: 0 },
  { date: '2024-01-05', checkIns: 0, approvalRate: 0 },
  { date: '2024-01-06', checkIns: 0, approvalRate: 0 },
  { date: '2024-01-07', checkIns: 0, approvalRate: 0 },
];

const chartConfig = {
  checkIns: {
    label: 'Check-ins',
    color: 'hsl(var(--chart-1))',
  },
  approvalRate: {
    label: 'Approval Rate',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({ data = defaultData }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = useState('7d');

  const filteredData = useMemo(() => {
    const now = new Date();
    let daysToSubtract = 7;
    if (timeRange === '30d') daysToSubtract = 30;
    if (timeRange === '90d') daysToSubtract = 90;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return data.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [data, timeRange]);

  const totalCheckIns = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.checkIns, 0),
    [filteredData]
  );

  const avgApprovalRate = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const sum = filteredData.reduce((acc, curr) => acc + curr.approvalRate, 0);
    return Math.round(sum / filteredData.length);
  }, [filteredData]);

  return (
    <Card className="border-border/50 shadow-soft">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b border-border/50 py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Attendance Trends</CardTitle>
          <CardDescription>
            Showing check-ins and approval rates over time
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Last 7 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillCheckIns" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-checkIns)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-checkIns)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillApprovalRate" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-approvalRate)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-approvalRate)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="checkIns"
              type="monotone"
              fill="url(#fillCheckIns)"
              stroke="var(--color-checkIns)"
              strokeWidth={2}
            />
            <Area
              dataKey="approvalRate"
              type="monotone"
              fill="url(#fillApprovalRate)"
              stroke="var(--color-approvalRate)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex justify-around border-t border-border/50 pt-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalCheckIns}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Check-ins</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{avgApprovalRate}%</p>
            <p className="text-xs text-muted-foreground font-medium">Avg Approval Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
