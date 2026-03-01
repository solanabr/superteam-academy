import { cn } from "@/lib/utils";

interface ProgressBarProps {
    value: number;
    max: number;
    label?: string;
    size?: "sm" | "md";
    className?: string;
}

export function ProgressBar({
    value,
    max,
    label,
    size = "md",
    className,
}: ProgressBarProps) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const h = size === "sm" ? "h-1.5" : "h-2.5";

    return (
        <div className={cn("w-full space-y-1", className)}>
            {label && (
                <div className="flex items-center justify-between text-sm text-muted-foreground font-game">
                    <span>{label}</span>
                    <span>
                        {value}/{max}
                    </span>
                </div>
            )}
            <div className={`w-full overflow-hidden rounded-full bg-muted ${h}`}>
                <div
                    className={`${h} rounded-full bg-primary transition-all duration-500 ease-out`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
