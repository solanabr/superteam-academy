import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "primary" | "xp" | "success";
  className?: string;
  showLabel?: boolean;
}

const fillVariantClass = {
  primary: "pf-primary",
  xp: "pf-xp",
  success: "pf-success",
} as const;

export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  className,
  showLabel = false,
}: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="prog-track w-full"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("prog-fill", fillVariantClass[variant])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium tabular-nums text-text-3">
          {percent}%
        </span>
      )}
    </div>
  );
}
