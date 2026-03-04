import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div className={cn("h-2 w-full bg-[#e8e8ed] rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-brand transition-all duration-500 ease-out rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
