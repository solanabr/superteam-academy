"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}

export function StatCard({ label, value, icon, subtitle, trend, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`text-xs mt-0.5 ${trend.value >= 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value} {trend.label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
