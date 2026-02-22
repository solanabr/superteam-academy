import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
	children: React.ReactNode;
	className?: string;
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
	padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export function ResponsiveContainer({
	children,
	className,
	maxWidth = "xl",
	padding = "md",
}: ResponsiveContainerProps) {
	const maxWidthClasses = {
		sm: "max-w-sm",
		md: "max-w-md",
		lg: "max-w-lg",
		xl: "max-w-xl",
		"2xl": "max-w-2xl",
		full: "max-w-full",
	};

	const paddingClasses = {
		none: "",
		sm: "px-4 py-2",
		md: "px-6 py-4",
		lg: "px-8 py-6",
		xl: "px-12 py-8",
	};

	return (
		<div
			className={cn(
				"mx-auto w-full",
				maxWidthClasses[maxWidth],
				paddingClasses[padding],
				className
			)}
		>
			{children}
		</div>
	);
}

interface ResponsiveGridProps {
	children: React.ReactNode;
	className?: string;
	cols?: {
		default?: number;
		sm?: number;
		md?: number;
		lg?: number;
		xl?: number;
	};
	gap?: "none" | "sm" | "md" | "lg" | "xl";
}

export function ResponsiveGrid({
	children,
	className,
	cols = { default: 1, md: 2, lg: 3 },
	gap = "md",
}: ResponsiveGridProps) {
	const gapClasses = {
		none: "gap-0",
		sm: "gap-2",
		md: "gap-4",
		lg: "gap-6",
		xl: "gap-8",
	};

	const colClasses = [
		cols.default && `grid-cols-${cols.default}`,
		cols.sm && `sm:grid-cols-${cols.sm}`,
		cols.md && `md:grid-cols-${cols.md}`,
		cols.lg && `lg:grid-cols-${cols.lg}`,
		cols.xl && `xl:grid-cols-${cols.xl}`,
	]
		.filter(Boolean)
		.join(" ");

	return <div className={cn("grid", colClasses, gapClasses[gap], className)}>{children}</div>;
}

interface ResponsiveFlexProps {
	children: React.ReactNode;
	className?: string;
	direction?: "row" | "col";
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
	wrap?: boolean;
	gap?: "none" | "sm" | "md" | "lg" | "xl";
}

export function ResponsiveFlex({
	children,
	className,
	direction = "row",
	align = "center",
	justify = "start",
	wrap = false,
	gap = "md",
}: ResponsiveFlexProps) {
	const directionClasses = {
		row: "flex-row",
		col: "flex-col",
	};

	const alignClasses = {
		start: "items-start",
		center: "items-center",
		end: "items-end",
		stretch: "items-stretch",
	};

	const justifyClasses = {
		start: "justify-start",
		center: "justify-center",
		end: "justify-end",
		between: "justify-between",
		around: "justify-around",
		evenly: "justify-evenly",
	};

	const gapClasses = {
		none: "gap-0",
		sm: "gap-2",
		md: "gap-4",
		lg: "gap-6",
		xl: "gap-8",
	};

	return (
		<div
			className={cn(
				"flex",
				directionClasses[direction],
				alignClasses[align],
				justifyClasses[justify],
				wrap && "flex-wrap",
				gapClasses[gap],
				className
			)}
		>
			{children}
		</div>
	);
}

interface ResponsiveTextProps {
	children: React.ReactNode;
	className?: string;
	size?: {
		default?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
		sm?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
		md?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
		lg?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
	};
	weight?: "normal" | "medium" | "semibold" | "bold";
	align?: "left" | "center" | "right" | "justify";
}

export function ResponsiveText({
	children,
	className,
	size = { default: "base" },
	weight = "normal",
	align = "left",
}: ResponsiveTextProps) {
	const sizeClasses = [
		size.default && `text-${size.default}`,
		size.sm && `sm:text-${size.sm}`,
		size.md && `md:text-${size.md}`,
		size.lg && `lg:text-${size.lg}`,
	]
		.filter(Boolean)
		.join(" ");

	const weightClasses = {
		normal: "font-normal",
		medium: "font-medium",
		semibold: "font-semibold",
		bold: "font-bold",
	};

	const alignClasses = {
		left: "text-left",
		center: "text-center",
		right: "text-right",
		justify: "text-justify",
	};

	return (
		<div className={cn(sizeClasses, weightClasses[weight], alignClasses[align], className)}>
			{children}
		</div>
	);
}

interface ResponsiveBreakpointProps {
	children: React.ReactNode;
	className?: string;
	show?: {
		default?: boolean;
		sm?: boolean;
		md?: boolean;
		lg?: boolean;
		xl?: boolean;
	};
}

export function ResponsiveBreakpoint({
	children,
	className,
	show = { default: true },
}: ResponsiveBreakpointProps) {
	const showClasses = [
		show.default === false && "hidden",
		show.sm !== undefined && (show.sm ? "sm:block" : "sm:hidden"),
		show.md !== undefined && (show.md ? "md:block" : "md:hidden"),
		show.lg !== undefined && (show.lg ? "lg:block" : "lg:hidden"),
		show.xl !== undefined && (show.xl ? "xl:block" : "xl:hidden"),
	]
		.filter(Boolean)
		.join(" ");

	return <div className={cn(showClasses, className)}>{children}</div>;
}
