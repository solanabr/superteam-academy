import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full py-24 text-center px-4">
      <div className="rounded-[2px] border border-dashed border-[var(--c-border-prominent)] p-4 mb-6">
        <Icon className="w-12 h-12 text-[var(--c-text-2)]/30" />
      </div>
      <p className="font-mono text-xs text-[var(--c-text-2)]/50 mb-3">
        &#47;&#47; empty
      </p>
      <h3 className="text-xl font-medium text-[var(--c-text-em)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--c-text-2)] max-w-md mx-auto mb-8">
        {description}
      </p>
      {action &&
        (action.href ? (
          <Link href={action.href}>
            <Button>{action.label}</Button>
          </Link>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        ))}
    </div>
  );
}
