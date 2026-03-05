import { cn } from "@/lib/utils";

interface DotGridProps {
	className?: string;
	opacity?: number;
}

export function DotGrid({ className, opacity }: DotGridProps) {
	return (
		<div
			className={cn(
				"absolute inset-0 z-0 pointer-events-none",
				"bg-[radial-gradient(var(--color-ink-secondary)_1px,transparent_1px)]",
				"bg-size-[40px_40px]",
				className,
			)}
			style={{ opacity: opacity ?? 0.2 }}
		/>
	);
}
