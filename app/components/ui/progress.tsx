"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
	<ProgressPrimitive.Root
		ref={ref}
		className={cn(
			"relative h-2 w-full bg-ink-secondary/10", // No overflow-hidden
			className,
		)}
		{...props}
	>
		<ProgressPrimitive.Indicator
			className="h-full bg-ink-primary transition-all relative" // Removed w-full flex-1
			style={{ width: `${value || 0}%` }} // Use width instead of transform
		>
			{/* Technical Marker - sticks out Top and Bottom slightly */}
			<div className="absolute right-0 -top-0.5 h-[calc(100%+4px)] w-0.5 bg-ink-primary shadow-[0_0_2px_rgba(0,0,0,0.2)]" />
		</ProgressPrimitive.Indicator>
	</ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
