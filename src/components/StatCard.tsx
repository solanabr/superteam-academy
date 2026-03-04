import type { LucideIcon } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: "purple" | "green" | "default";
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "default",
}: StatCardProps) {
  const accentColor =
    accent === "purple"
      ? "var(--solana-purple)"
      : accent === "green"
        ? "var(--solana-green)"
        : "var(--text-muted)";

  return (
    <SpotlightCard className="rounded-xl" spotlightColor="rgba(153, 69, 255, 0.2)">
      <div
        className="rounded-xl p-5 flex flex-col gap-2"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </p>
          {Icon && (
            <Icon size={16} aria-hidden="true" style={{ color: accentColor }} />
          )}
        </div>
        <p
          className="text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {typeof value === "number" ? value.toLocaleString("en-US") : value}
        </p>
        {sub && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
      </div>
    </SpotlightCard>
  );
}
