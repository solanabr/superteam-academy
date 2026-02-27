'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
}

interface AnalyticsTableProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  className?: string;
}

export function AnalyticsTable<T extends Record<string, any>>({
  title,
  description,
  columns,
  data,
  className = '',
}: AnalyticsTableProps<T>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.label}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={`${idx}-${col.label}`}>
                      {col.render
                        ? col.render((item as any)[col.key as string], item)
                        : (item as any)[col.key as string]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">No data available</div>
        )}
      </CardContent>
    </Card>
  );
}
