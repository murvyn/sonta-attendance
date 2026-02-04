'use client';

import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  gradient: string;
  bgGradient: string;
  iconBg: string;
  iconColor: string;
}

export function SectionCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className={cn(
            'group overflow-hidden border-border/50 shadow-soft hover-lift transition-smooth relative',
            card.bgGradient,
            `stagger-delay-${index + 1}`
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl transition-smooth group-hover:scale-110',
                  card.iconBg
                )}
              >
                <card.icon className={cn('h-6 w-6', card.iconColor)} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {card.title}
              </p>
              <p className="text-4xl font-black tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{card.description}</p>
            </div>

            {/* Subtle gradient overlay */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-smooth pointer-events-none',
                card.gradient
              )}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
