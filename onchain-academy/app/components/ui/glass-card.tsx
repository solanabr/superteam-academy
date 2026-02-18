import { cn } from "@/lib/utils"
import { forwardRef } from "react"

const GlassCard = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { hoverEffect?: boolean }
>(({ className, hoverEffect = true, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "glass-panel rounded-xl p-6 relative overflow-hidden",
            hoverEffect && "glass-panel-hover group",
            className
        )}
        {...props}
    >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />

        <div className="relative z-10">
            {props.children}
        </div>
    </div>
))
GlassCard.displayName = "GlassCard"

export { GlassCard }
