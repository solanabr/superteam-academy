"use client";

type SyncStatus =
  | "synced"
  | "out_of_sync"
  | "not_deployed"
  | "draft"
  | "missing_fields";

interface StatusBadgeProps {
  status: SyncStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<SyncStatus, { label: string; className: string }> = {
    synced: {
      label: "Synced",
      className: "bg-success-bg border-success text-success",
    },
    out_of_sync: {
      label: "Out of sync",
      className: "bg-accent-bg border-accent text-accent-dark dark:text-accent",
    },
    not_deployed: {
      label: "Not on chain",
      className: "bg-danger-light border-danger text-danger",
    },
    draft: {
      label: "Draft",
      className: "bg-subtle border-border text-text-3",
    },
    missing_fields: {
      label: "Missing fields",
      className: "bg-streak-light border-streak text-streak",
    },
  };

  const { label, className } = config[status];
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
