import { cn } from "@/lib/utils"

interface SegmentedProgressProps {
    value: number
    max?: number
    segments?: number
    className?: string
}

export function SegmentedProgress({
    value,
    max = 100,
    segments = 20,
    className,
}: SegmentedProgressProps) {
    const percentage = Math.min(Math.max(value / max, 0), 1)
    const filledSegments = Math.round(percentage * segments)

    return (
        <div className={cn("flex gap-1", className)}>
            {Array.from({ length: segments }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "h-3 w-full rounded-sm transition-all duration-300",
                        i < filledSegments
                            ? "bg-neon-green shadow-[0_0_8px_rgba(0,255,163,0.5)]"
                            : "bg-white/10"
                    )}
                />
            ))}
        </div>
    )
}
