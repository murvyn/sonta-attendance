'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AttendanceRecord {
  id: string;
  memberName: string;
  meeting: string;
  time: Date;
  status: 'approved' | 'pending' | 'rejected';
  confidence: number;
}

interface DataTableProps {
  data?: AttendanceRecord[];
}

const defaultData: AttendanceRecord[] = [];

export function DataTable({ data = defaultData }: DataTableProps) {
  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="status-success font-semibold">
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="status-warning font-semibold">
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="status-danger font-semibold">
            Rejected
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border/50 shadow-soft">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription className="mt-1.5">
              Latest attendance verifications and their status
            </CardDescription>
          </div>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm" className="hover-scale">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No check-ins yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Check-ins will appear here once members start attending meetings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Meeting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.map((record, index) => (
                  <tr
                    key={record.id}
                    className={cn(
                      'hover:bg-accent/30 transition-smooth cursor-pointer',
                      `stagger-delay-${(index % 6) + 1}`
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                          {record.memberName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold">{record.memberName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium">{record.meeting}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-muted-foreground">
                        {format(record.time, 'MMM d, yyyy h:mm a')}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold">{record.confidence}%</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
