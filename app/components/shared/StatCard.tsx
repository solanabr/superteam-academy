'use client';

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, className = '', icon }: StatCardProps) {
  return (
    <div className={cn("border border-border bg-bg-surface p-4 relative group hover:border-ink-primary transition-colors cursor-default", className)}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-1 h-1 bg-ink-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-1 h-1 bg-ink-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-1 h-1 bg-ink-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-ink-primary opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-widest text-ink-secondary block">
          {label}
        </span>
        {icon && <div className="text-ink-primary">{icon}</div>}
      </div>
      
      <div className="font-mono font-bold text-2xl leading-none tracking-tight">
        {value}
      </div>
    </div>
  );
}
