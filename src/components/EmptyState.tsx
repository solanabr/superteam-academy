import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div
      className="rounded-xl py-16 px-6 flex flex-col items-center text-center gap-4"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {Icon && (
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          <Icon
            size={22}
            aria-hidden="true"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      )}
      <div>
        <p
          className="font-semibold text-base mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </p>
        {description && (
          <p
            className="text-sm max-w-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
