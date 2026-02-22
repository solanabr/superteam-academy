import { useState, useCallback, useRef } from "react";
import { TouchInteractions } from "./touch-interactions";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface MobileGesturesProps {
	children: React.ReactNode;
	onSwipeLeft?: (() => void) | undefined;
	onSwipeRight?: (() => void) | undefined;
	onSwipeUp?: (() => void) | undefined;
	onSwipeDown?: (() => void) | undefined;
	onPinchIn?: ((scale: number) => void) | undefined;
	onPinchOut?: ((scale: number) => void) | undefined;
	onPan?: ((deltaX: number, deltaY: number) => void) | undefined;
	onDoubleTap?: (() => void) | undefined;
	onLongPress?: (() => void) | undefined;
	swipeThreshold?: number | undefined;
	pinchThreshold?: number | undefined;
	enableHapticFeedback?: boolean | undefined;
	className?: string | undefined;
	style?: React.CSSProperties | undefined;
}

export function MobileGestures({
	children,
	onSwipeLeft,
	onSwipeRight,
	onSwipeUp,
	onSwipeDown,
	onPinchIn,
	onPinchOut,
	onPan,
	onDoubleTap,
	onLongPress,
	swipeThreshold = 50,
	pinchThreshold = 0.1,
	enableHapticFeedback = true,
	className,
	style,
}: MobileGesturesProps) {
	const { toast } = useToast();
	const t = useTranslations("gestures");
	const lastScaleRef = useRef(1);
	const lastPanTimeRef = useRef(Date.now());

	const handleSwipe = useCallback(
		(direction: "up" | "down" | "left" | "right", distance: number) => {
			if (distance < swipeThreshold) return;

			switch (direction) {
				case "left":
					onSwipeLeft?.();
					toast({
						title: t("swipeLeft"),
						description: t("swipeLeftDescription"),
					});
					break;
				case "right":
					onSwipeRight?.();
					toast({
						title: t("swipeRight"),
						description: t("swipeRightDescription"),
					});
					break;
				case "up":
					onSwipeUp?.();
					toast({
						title: t("swipeUp"),
						description: t("swipeUpDescription"),
					});
					break;
				case "down":
					onSwipeDown?.();
					toast({
						title: t("swipeDown"),
						description: t("swipeDownDescription"),
					});
					break;
				default:
					break;
			}
		},
		[swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, toast, t]
	);

	const handlePinch = useCallback(
		(scale: number, _center: { x: number; y: number }) => {
			const scaleDelta = scale - lastScaleRef.current;

			if (Math.abs(scaleDelta) < pinchThreshold) return;

			if (scaleDelta > 0) {
				onPinchOut?.(scale);
				toast({
					title: t("pinchOut"),
					description: t("pinchOutDescription"),
				});
			} else {
				onPinchIn?.(scale);
				toast({
					title: t("pinchIn"),
					description: t("pinchInDescription"),
				});
			}

			lastScaleRef.current = scale;
			lastPanTimeRef.current = Date.now();
		},
		[pinchThreshold, onPinchIn, onPinchOut, toast, t]
	);

	const handlePan = useCallback(
		(deltaX: number, deltaY: number) => {
			onPan?.(deltaX, deltaY);
			lastPanTimeRef.current = Date.now();
		},
		[onPan]
	);

	const handleDoubleTap = useCallback(() => {
		onDoubleTap?.();
		toast({
			title: t("doubleTap"),
			description: t("doubleTapDescription"),
		});
	}, [onDoubleTap, toast, t]);

	const handleLongPress = useCallback(() => {
		onLongPress?.();
		toast({
			title: t("longPress"),
			description: t("longPressDescription"),
		});
	}, [onLongPress, toast, t]);

	return (
		<TouchInteractions
			className={className}
			style={style}
			onSwipe={handleSwipe}
			onPinch={handlePinch}
			onPan={handlePan}
			onDoubleTap={handleDoubleTap}
			onLongPress={handleLongPress}
			swipeThreshold={swipeThreshold}
			enableHapticFeedback={enableHapticFeedback}
		>
			{children}
		</TouchInteractions>
	);
}

// Specific gesture components for common use cases

interface SwipeableCardProps {
	children: React.ReactNode;
	onSwipeLeft?: (() => void) | undefined;
	onSwipeRight?: (() => void) | undefined;
	onSwipeUp?: (() => void) | undefined;
	onSwipeDown?: (() => void) | undefined;
	className?: string | undefined;
}

export function SwipeableCard({
	children,
	onSwipeLeft,
	onSwipeRight,
	onSwipeUp,
	onSwipeDown,
	className,
}: SwipeableCardProps) {
	return (
		<MobileGestures
			onSwipeLeft={onSwipeLeft}
			onSwipeRight={onSwipeRight}
			onSwipeUp={onSwipeUp}
			onSwipeDown={onSwipeDown}
			className={className}
		>
			{children}
		</MobileGestures>
	);
}

interface ZoomableContentProps {
	children: React.ReactNode;
	onZoomIn?: ((scale: number) => void) | undefined;
	onZoomOut?: ((scale: number) => void) | undefined;
	className?: string | undefined;
}

export function ZoomableContent({
	children,
	onZoomIn,
	onZoomOut,
	className,
}: ZoomableContentProps) {
	return (
		<MobileGestures onPinchOut={onZoomIn} onPinchIn={onZoomOut} className={className}>
			{children}
		</MobileGestures>
	);
}

interface PullToRefreshProps {
	children: React.ReactNode;
	onRefresh?: () => void;
	refreshThreshold?: number;
	className?: string;
}

export function PullToRefresh({
	children,
	onRefresh,
	refreshThreshold = 100,
	className,
}: PullToRefreshProps) {
	const [pullDistance, setPullDistance] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handlePan = useCallback(
		(_deltaX: number, deltaY: number) => {
			if (deltaY > 0 && !isRefreshing) {
				setPullDistance(Math.min(deltaY, refreshThreshold * 2));
			}
		},
		[refreshThreshold, isRefreshing]
	);

	const handleSwipeDown = useCallback(() => {
		if (pullDistance >= refreshThreshold && !isRefreshing) {
			setIsRefreshing(true);
			onRefresh?.();
			setTimeout(() => {
				setIsRefreshing(false);
				setPullDistance(0);
			}, 1000);
		} else {
			setPullDistance(0);
		}
	}, [pullDistance, refreshThreshold, isRefreshing, onRefresh]);

	return (
		<div className={`relative overflow-hidden ${className}`}>
			<div
				className="absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
				style={{
					transform: `translateY(${Math.max(-50, pullDistance - 50)}px)`,
					opacity: pullDistance > 0 ? Math.min(1, pullDistance / refreshThreshold) : 0,
				}}
			>
				<div className="flex items-center gap-2">
					<div
						className={`w-4 h-4 border-2 border-primary border-t-transparent rounded-full ${isRefreshing ? "animate-spin" : ""}`}
					/>
					<span className="text-sm text-muted-foreground">
						{isRefreshing ? "Refreshing..." : "Pull to refresh"}
					</span>
				</div>
			</div>
			<MobileGestures
				onPan={handlePan}
				onSwipeDown={handleSwipeDown}
				className="relative z-0"
				style={{
					transform: `translateY(${pullDistance}px)`,
					transition: isRefreshing ? "none" : "transform 0.3s ease-out",
				}}
			>
				{children}
			</MobileGestures>
		</div>
	);
}
