interface ProgressBarProps {
    value: number;
    max: number;
    label?: string;
    size?: "sm" | "md";
}

export function ProgressBar({
    value,
    max,
    label,
    size = "md",
}: ProgressBarProps) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const h = size === "sm" ? "h-1.5" : "h-2.5";

    return (
        <div className="w-full space-y-1">
            {label && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
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
