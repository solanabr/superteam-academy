"use client";

import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminUsersSkeleton(): ReactNode {
  const rows = Array.from({ length: 5 });

  return (
    <div className="space-y-4">
      <div className="h-6 w-40 border border-border bg-muted" />
      <div className="flex gap-2">
        <div className="h-9 w-64 border border-border bg-muted" />
        <div className="h-9 w-40 border border-border bg-muted" />
        <div className="h-9 w-40 border border-border bg-muted" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead />
            <TableHead />
            <TableHead />
            <TableHead />
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="h-4 w-40 border border-border bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-20 border border-border bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-32 border border-border bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-16 border border-border bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-16 border border-border bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-7 w-20 border border-border bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

