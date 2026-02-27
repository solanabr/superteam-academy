'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsChartProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AnalyticsChart({
  title,
  description,
  children,
  className = '',
}: AnalyticsChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
