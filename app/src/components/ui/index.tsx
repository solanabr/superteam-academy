"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="px-6 py-16 border-b border-white/5">
      <div className="max-w-6xl mx-auto">
        {children && <div className="flex items-center gap-3 mb-4">{children}</div>}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
        {subtitle && <p className="text-white/50 text-lg max-w-2xl">{subtitle}</p>}
      </div>
    </div>
  );
}

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: ReactNode;
  className?: string;
}

const BADGE_VARIANTS = {
  default: "bg-white/10 text-white/80",
  success: "bg-green-500/20 text-green-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  error: "bg-red-500/20 text-red-400",
  info: "bg-blue-500/20 text-blue-400",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${BADGE_VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ icon, label, value, className = "" }: StatCardProps) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-2">{icon}</div>
      <div className="text-white/60 text-sm">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-white/50 mb-6 max-w-md">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const SPINNER_SIZES = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return (
    <div className={`${SPINNER_SIZES[size]} border-2 border-white/10 border-t-white rounded-full animate-spin`} />
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 100, className = "" }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className={`h-2 bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
