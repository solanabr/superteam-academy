import { cn } from "@/lib/utils"

interface HexagonBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean
}

export function HexagonBadge({ className, children, active, ...props }: HexagonBadgeProps) {
    return (
        <div
            className={cn(
                "relative flex items-center justify-center hexagon-clip w-12 h-12",
                active ? "bg-neon-green/20" : "bg-white/5",
                className
            )}
            {...props}
        >
            {/* Border effect created by nested hexagon if needed, or simple background */}
            {active && (
                <div className="absolute inset-0 bg-neon-green/20 animate-pulse-slow" />
            )}
            <div className="z-10 text-xs font-bold text-foreground">
                {children}
            </div>
        </div>
    )
}
