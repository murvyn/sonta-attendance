'use client';

import Image from 'next/image';
import { MoreVertical, Phone, Mail, Edit, Trash2, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { SontaHead } from '@/types';
import { SontaHeadStatus } from '@/types';

interface SontaHeadCardProps {
  sontaHead: SontaHead;
  onEdit: (sontaHead: SontaHead) => void;
  onDelete: (sontaHead: SontaHead) => void;
}

const getStatusConfig = (status: SontaHeadStatus) => {
  switch (status) {
    case SontaHeadStatus.ACTIVE:
      return {
        icon: CheckCircle,
        className: 'status-success',
        label: 'Active',
        animate: true,
      };
    case SontaHeadStatus.INACTIVE:
      return {
        icon: Clock,
        className: 'status-warning',
        label: 'Inactive',
        animate: false,
      };
    case SontaHeadStatus.SUSPENDED:
      return {
        icon: XCircle,
        className: 'status-danger',
        label: 'Suspended',
        animate: false,
      };
  }
};

export function SontaHeadCard({ sontaHead, onEdit, onDelete }: SontaHeadCardProps) {
  const imageUrl = sontaHead.profileImageUrl.startsWith('http')
    ? sontaHead.profileImageUrl
    : `${process.env.NEXT_PUBLIC_API_URL}${sontaHead.profileImageUrl}`;

  const statusConfig = getStatusConfig(sontaHead.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="group overflow-hidden border-border/50 shadow-soft hover-lift transition-smooth">
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-5">
          {/* Profile Image */}
          <div className="relative shrink-0">
            {/* Image Container */}
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-muted group-hover:scale-105 transition-smooth">
              <Image
                src={imageUrl}
                alt={sontaHead.name}
                fill
                className="object-cover"
                sizes="64px"
              />

              {/* Status Indicator Dot */}
              <div className="absolute bottom-0 right-0">
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 border-card flex items-center justify-center",
                  statusConfig.className,
                  statusConfig.animate && "animate-status-pulse"
                )}>
                  <StatusIcon className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base truncate group-hover:text-primary transition-smooth">
                  {sontaHead.name}
                </h3>

                {/* Enhanced Status Badge */}
                <Badge
                  className={cn(
                    "mt-2 text-xs font-semibold border",
                    statusConfig.className
                  )}
                >
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-70 group-hover:opacity-100 transition-smooth hover-scale"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="animate-scale-in shadow-strong">
                  <DropdownMenuItem
                    onClick={() => onEdit(sontaHead)}
                    className="cursor-pointer transition-smooth"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span className="font-medium">Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(sontaHead)}
                    className="cursor-pointer text-danger hover:text-danger hover:bg-danger/10 transition-smooth"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span className="font-medium">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Contact Information */}
            <div className="mt-3 space-y-2">
              {sontaHead.sontaName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-foreground transition-smooth">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent group-hover/item:bg-accent group-hover/item:text-accent-foreground transition-smooth">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-medium">{sontaHead.sontaName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-foreground transition-smooth">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-smooth">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <span className="truncate font-medium">{sontaHead.phone}</span>
              </div>

              {sontaHead.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground group/item hover:text-foreground transition-smooth">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary/10 text-secondary group-hover/item:bg-secondary group-hover/item:text-secondary-foreground transition-smooth">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-medium">{sontaHead.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
