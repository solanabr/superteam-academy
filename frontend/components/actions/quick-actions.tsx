"use client";

import { useEffect, type ReactNode } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Share,
    Download,
    Upload,
    Copy,
    Bookmark,
    Star,
    Eye,
    EyeOff,
    Settings,
    MoreHorizontal,
    Zap,
    Target,
    Trophy,
    Users,
    Calendar,
    Bell,
} from "@/components/lucide-shim";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface QuickAction {
	id: string;
	label: string;
	icon: ReactNode;
	shortcut?: string;
	action: () => void | Promise<void>;
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
	disabled?: boolean;
	tooltip?: string;
	group?: string;
}

interface QuickActionsProps {
	actions: QuickAction[];
	variant?: "buttons" | "dropdown" | "floating";
	size?: "sm" | "default" | "lg";
	showLabels?: boolean;
	maxVisible?: number;
	className?: string;
}

export function QuickActions({
	actions,
	variant = "buttons",
	size = "default",
	showLabels = true,
	maxVisible = 3,
	className,
}: QuickActionsProps) {
	const t = useTranslations("actions");
	const { toast } = useToast();

	const handleAction = async (action: QuickAction) => {
		try {
			await action.action();
		} catch (_error) {
			toast({
				title: t("error"),
				description: t("actionFailed", { action: action.label }),
				variant: "destructive",
			});
		}
	};

	const groupedActions = actions.reduce(
		(acc, action) => {
			const group = action.group || "general";
			if (!acc[group]) acc[group] = [];
			acc[group].push(action);
			return acc;
		},
		{} as Record<string, QuickAction[]>
	);

	const visibleActions = actions.slice(0, maxVisible);
	const overflowActions = actions.slice(maxVisible);

	if (variant === "dropdown") {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild={true}>
					<Button variant="outline" size={size}>
						<MoreHorizontal className="h-4 w-4" />
						{showLabels && <span className="ml-2">{t("actions")}</span>}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{Object.entries(groupedActions).map(([group, groupActions]) => (
						<div key={group}>
							{group !== "general" && (
								<>
									<DropdownMenuLabel>{group}</DropdownMenuLabel>
									<DropdownMenuSeparator />
								</>
							)}
							{groupActions.map((action) => (
								<DropdownMenuItem
									key={action.id}
									onClick={() => handleAction(action)}
									disabled={action.disabled ?? false}
									className={cn(
										action.variant === "destructive" &&
											"text-destructive focus:text-destructive"
									)}
								>
									{action.icon}
									<span className="ml-2">{action.label}</span>
									{action.shortcut && (
										<span className="ml-auto text-xs text-muted-foreground">
											{action.shortcut}
										</span>
									)}
								</DropdownMenuItem>
							))}
							{group !==
								Object.keys(groupedActions)[
									Object.keys(groupedActions).length - 1
								] && <DropdownMenuSeparator />}
						</div>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}

	if (variant === "floating") {
		return (
			<div className={cn("fixed bottom-4 right-4 z-50", className)}>
				<div className="flex flex-col gap-2">
					{actions.slice(0, 4).map((action) => (
						<TooltipProvider key={action.id}>
							<Tooltip>
								<TooltipTrigger asChild={true}>
									<Button
										size={size}
										variant={action.variant || "default"}
										onClick={() => handleAction(action)}
										disabled={action.disabled}
										className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
									>
										{action.icon}
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left">
									<div className="flex items-center gap-2">
										<span>{action.label}</span>
										{action.shortcut && (
											<span className="text-xs text-muted-foreground">
												{action.shortcut}
											</span>
										)}
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					))}
				</div>
			</div>
		);
	}

	// Default buttons variant
	return (
		<TooltipProvider>
			<div className={cn("flex items-center gap-2 flex-wrap", className)}>
				{visibleActions.map((action) => (
					<Tooltip key={action.id}>
						<TooltipTrigger asChild={true}>
							<Button
								size={size}
								variant={action.variant || "outline"}
								onClick={() => handleAction(action)}
								disabled={action.disabled}
								className={cn(
									"transition-all duration-200",
									action.variant === "destructive" &&
										"hover:bg-destructive hover:text-destructive-foreground"
								)}
							>
								{action.icon}
								{showLabels && <span className="ml-2">{action.label}</span>}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<div className="flex items-center gap-2">
								<span>{action.label}</span>
								{action.shortcut && (
									<span className="text-xs text-muted-foreground">
										{action.shortcut}
									</span>
								)}
							</div>
						</TooltipContent>
					</Tooltip>
				))}

				{overflowActions.length > 0 && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild={true}>
							<Button variant="outline" size={size}>
								<MoreHorizontal className="h-4 w-4" />
								{showLabels && <span className="ml-2">{t("more")}</span>}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{overflowActions.map((action) => (
								<DropdownMenuItem
									key={action.id}
									onClick={() => handleAction(action)}
									disabled={action.disabled ?? false}
									className={cn(
										action.variant === "destructive" &&
											"text-destructive focus:text-destructive"
									)}
								>
									{action.icon}
									<span className="ml-2">{action.label}</span>
									{action.shortcut && (
										<span className="ml-auto text-xs text-muted-foreground">
											{action.shortcut}
										</span>
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</TooltipProvider>
	);
}

// Predefined Quick Actions for common use cases
export const createCommonActions = (
	handlers: {
		onCreate?: () => void;
		onEdit?: () => void;
		onDelete?: () => void;
		onShare?: () => void;
		onDownload?: () => void;
		onUpload?: () => void;
		onDuplicate?: () => void;
		onBookmark?: () => void;
		onFavorite?: () => void;
		onView?: () => void;
		onHide?: () => void;
		onSettings?: () => void;
		onQuickStart?: () => void;
		onSetGoal?: () => void;
		onViewAchievements?: () => void;
		onJoinCommunity?: () => void;
		onSchedule?: () => void;
		onNotifications?: () => void;
	},
	t: (key: string) => string
): QuickAction[] => {
	const actions: QuickAction[] = [
		{
			id: "create",
			label: t("create"),
			icon: <Plus className="h-4 w-4" />,
			shortcut: "Ctrl+N",
			action:
				handlers.onCreate ||
				(() => {
					/* ignored */
				}),
			variant: "default",
			group: "creation",
		},
		{
			id: "edit",
			label: t("edit"),
			icon: <Edit className="h-4 w-4" />,
			shortcut: "Ctrl+E",
			action:
				handlers.onEdit ||
				(() => {
					/* ignored */
				}),
			group: "editing",
		},
		{
			id: "delete",
			label: t("delete"),
			icon: <Trash2 className="h-4 w-4" />,
			shortcut: "Del",
			action:
				handlers.onDelete ||
				(() => {
					/* ignored */
				}),
			variant: "destructive",
			group: "editing",
		},
		{
			id: "share",
			label: t("share"),
			icon: <Share className="h-4 w-4" />,
			shortcut: "Ctrl+S",
			action:
				handlers.onShare ||
				(() => {
					/* ignored */
				}),
			group: "sharing",
		},
		{
			id: "download",
			label: t("download"),
			icon: <Download className="h-4 w-4" />,
			shortcut: "Ctrl+D",
			action:
				handlers.onDownload ||
				(() => {
					/* ignored */
				}),
			group: "file",
		},
		{
			id: "upload",
			label: t("upload"),
			icon: <Upload className="h-4 w-4" />,
			shortcut: "Ctrl+U",
			action:
				handlers.onUpload ||
				(() => {
					/* ignored */
				}),
			group: "file",
		},
		{
			id: "duplicate",
			label: t("duplicate"),
			icon: <Copy className="h-4 w-4" />,
			shortcut: "Ctrl+C",
			action:
				handlers.onDuplicate ||
				(() => {
					/* ignored */
				}),
			group: "editing",
		},
		{
			id: "bookmark",
			label: t("bookmark"),
			icon: <Bookmark className="h-4 w-4" />,
			shortcut: "Ctrl+B",
			action:
				handlers.onBookmark ||
				(() => {
					/* ignored */
				}),
			group: "favorites",
		},
		{
			id: "favorite",
			label: t("favorite"),
			icon: <Star className="h-4 w-4" />,
			shortcut: "Ctrl+F",
			action:
				handlers.onFavorite ||
				(() => {
					/* ignored */
				}),
			group: "favorites",
		},
		{
			id: "view",
			label: t("view"),
			icon: <Eye className="h-4 w-4" />,
			shortcut: "Ctrl+V",
			action:
				handlers.onView ||
				(() => {
					/* ignored */
				}),
			group: "view",
		},
		{
			id: "hide",
			label: t("hide"),
			icon: <EyeOff className="h-4 w-4" />,
			action:
				handlers.onHide ||
				(() => {
					/* ignored */
				}),
			group: "view",
		},
		{
			id: "settings",
			label: t("settings"),
			icon: <Settings className="h-4 w-4" />,
			shortcut: "Ctrl+,",
			action:
				handlers.onSettings ||
				(() => {
					/* ignored */
				}),
			group: "settings",
		},
		{
			id: "quick-start",
			label: t("quickStart"),
			icon: <Zap className="h-4 w-4" />,
			action:
				handlers.onQuickStart ||
				(() => {
					/* ignored */
				}),
			variant: "default",
			group: "learning",
		},
		{
			id: "set-goal",
			label: t("setGoal"),
			icon: <Target className="h-4 w-4" />,
			action:
				handlers.onSetGoal ||
				(() => {
					/* ignored */
				}),
			group: "learning",
		},
		{
			id: "achievements",
			label: t("achievements"),
			icon: <Trophy className="h-4 w-4" />,
			action:
				handlers.onViewAchievements ||
				(() => {
					/* ignored */
				}),
			group: "learning",
		},
		{
			id: "community",
			label: t("community"),
			icon: <Users className="h-4 w-4" />,
			action:
				handlers.onJoinCommunity ||
				(() => {
					/* ignored */
				}),
			group: "social",
		},
		{
			id: "schedule",
			label: t("schedule"),
			icon: <Calendar className="h-4 w-4" />,
			action:
				handlers.onSchedule ||
				(() => {
					/* ignored */
				}),
			group: "planning",
		},
		{
			id: "notifications",
			label: t("notifications"),
			icon: <Bell className="h-4 w-4" />,
			action:
				handlers.onNotifications ||
				(() => {
					/* ignored */
				}),
			group: "settings",
		},
	];
	return actions.filter((action) => handlers[action.id as keyof typeof handlers]);
};

// Keyboard Shortcuts Manager
interface KeyboardShortcutsProps {
	shortcuts: Array<{
		key: string;
		action: () => void;
		description: string;
	}>;
}

export function KeyboardShortcuts({ shortcuts }: KeyboardShortcutsProps) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const shortcut = shortcuts.find((s) => {
				const keys = s.key.toLowerCase().split("+");
				const ctrl = keys.includes("ctrl") && (event.ctrlKey || event.metaKey);
				const shift = keys.includes("shift") && event.shiftKey;
				const alt = keys.includes("alt") && event.altKey;
				const key = keys[keys.length - 1].toLowerCase();

				return (
					(keys.includes("ctrl") ? ctrl : !event.ctrlKey && !event.metaKey) &&
					(keys.includes("shift") ? shift : !event.shiftKey) &&
					(keys.includes("alt") ? alt : !event.altKey) &&
					event.key.toLowerCase() === key
				);
			});

			if (shortcut) {
				event.preventDefault();
				shortcut.action();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [shortcuts]);

	return null; // This component doesn't render anything
}
