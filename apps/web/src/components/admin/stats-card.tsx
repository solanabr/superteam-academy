'use client';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: string;
}

export function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="mt-1 text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {trend && <p className="mt-1 text-xs text-emerald-500">{trend}</p>}
    </div>
  );
}
