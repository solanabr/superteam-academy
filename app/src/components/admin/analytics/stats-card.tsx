'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className = '',
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            {trend.direction === 'neutral' && <Minus className="h-4 w-4 text-gray-500" />}
            <span
              className={`text-xs font-medium ${
                trend.direction === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : trend.direction === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {trend.direction === 'up' && '+'}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
