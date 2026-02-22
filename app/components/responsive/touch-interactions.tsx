import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface TouchPosition {
	x: number;
	y: number;
}

interface TouchGesture {
	type: "tap" | "double-tap" | "long-press" | "swipe" | "pinch" | "pan";
	startPosition: TouchPosition;
	endPosition?: TouchPosition;
	duration?: number;
	distance?: number;
	direction?: "up" | "down" | "left" | "right";
	scale?: number;
}

interface TouchInteractionsProps {
	children: React.ReactNode;
	onGesture?: ((gesture: TouchGesture) => void) | undefined;
	onSwipe?: ((direction: "up" | "down" | "left" | "right", distance: number) => void) | undefined;
	onPinch?: ((scale: number, center: TouchPosition) => void) | undefined;
	onPan?: ((deltaX: number, deltaY: number) => void) | undefined;
	onTap?: ((position: TouchPosition) => void) | undefined;
	onDoubleTap?: ((position: TouchPosition) => void) | undefined;
	onLongPress?: ((position: TouchPosition) => void) | undefined;
	className?: string | undefined;
	style?: React.CSSProperties | undefined;
	enableHapticFeedback?: boolean | undefined;
	swipeThreshold?: number | undefined;
	longPressDelay?: number | undefined;
}

export function TouchInteractions({
	children,
	onGesture,
	onSwipe,
	onPinch,
	onPan,
	onTap,
	onDoubleTap,
	onLongPress,
	className,
	style,
	enableHapticFeedback = true,
	swipeThreshold = 50,
	longPressDelay = 500,
}: TouchInteractionsProps) {
	const { toast: _toast } = useToast();
	const elementRef = useRef<HTMLDivElement>(null);

	const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
	const [_touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
	const [isLongPress, setIsLongPress] = useState(false);
	const [lastTap, setLastTap] = useState<number>(0);
	const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
	const [isMultiTouch, setIsMultiTouch] = useState(false);
	const [initialDistance, setInitialDistance] = useState<number>(0);
	const [initialCenter, setInitialCenter] = useState<TouchPosition>({ x: 0, y: 0 });

	const getTouchPosition = useCallback(
		(touch: React.Touch): TouchPosition => ({
			x: touch.clientX,
			y: touch.clientY,
		}),
		[]
	);

	const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
		const dx = touch1.clientX - touch2.clientX;
		const dy = touch1.clientY - touch2.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}, []);

	const getCenter = useCallback(
		(touch1: React.Touch, touch2: React.Touch): TouchPosition => ({
			x: (touch1.clientX + touch2.clientX) / 2,
			y: (touch1.clientY + touch2.clientY) / 2,
		}),
		[]
	);

	const getDirection = useCallback(
		(start: TouchPosition, end: TouchPosition): "up" | "down" | "left" | "right" => {
			const dx = end.x - start.x;
			const dy = end.y - start.y;

			if (Math.abs(dx) > Math.abs(dy)) {
				return dx > 0 ? "right" : "left";
			}
			return dy > 0 ? "down" : "up";
		},
		[]
	);

	const triggerHapticFeedback = useCallback(
		(type: "light" | "medium" | "heavy" = "light") => {
			if (!enableHapticFeedback || !navigator.vibrate) return;

			const patterns = {
				light: 50,
				medium: 100,
				heavy: 200,
			};

			navigator.vibrate(patterns[type]);
		},
		[enableHapticFeedback]
	);

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			const touches = e.touches;

			if (touches.length === 1) {
				const touch = touches[0];
				const position = getTouchPosition(touch);
				setTouchStart(position);
				setIsMultiTouch(false);

				// Start long press timer
				const timer = setTimeout(() => {
					setIsLongPress(true);
					triggerHapticFeedback("medium");
					onLongPress?.(position);
					onGesture?.({
						type: "long-press",
						startPosition: position,
					});
				}, longPressDelay);
				setLongPressTimer(timer);
			} else if (touches.length === 2) {
				setIsMultiTouch(true);
				const touch1 = touches[0];
				const touch2 = touches[1];
				setInitialDistance(getDistance(touch1, touch2));
				setInitialCenter(getCenter(touch1, touch2));
			}
		},
		[
			getTouchPosition,
			getDistance,
			getCenter,
			longPressDelay,
			triggerHapticFeedback,
			onLongPress,
			onGesture,
		]
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			const touches = e.touches;

			if (longPressTimer) {
				clearTimeout(longPressTimer);
				setLongPressTimer(null);
			}

			if (touches.length === 1 && touchStart && !isMultiTouch) {
				const touch = touches[0];
				const currentPosition = getTouchPosition(touch);
				const deltaX = currentPosition.x - touchStart.x;
				const deltaY = currentPosition.y - touchStart.y;

				onPan?.(deltaX, deltaY);
			} else if (touches.length === 2 && initialDistance > 0) {
				const touch1 = touches[0];
				const touch2 = touches[1];
				const currentDistance = getDistance(touch1, touch2);
				const scale = currentDistance / initialDistance;
				const center = getCenter(touch1, touch2);

				onPinch?.(scale, center);
				onGesture?.({
					type: "pinch",
					startPosition: initialCenter,
					scale,
				});
			}
		},
		[
			touchStart,
			isMultiTouch,
			initialDistance,
			initialCenter,
			longPressTimer,
			getTouchPosition,
			getDistance,
			getCenter,
			onPan,
			onPinch,
			onGesture,
		]
	);

	const handleTouchEnd = useCallback(
		(e: React.TouchEvent) => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
				setLongPressTimer(null);
			}

			const touches = e.changedTouches;
			if (touches.length === 1 && touchStart) {
				const touch = touches[0];
				const endPosition = getTouchPosition(touch);
				setTouchEnd(endPosition);

				const deltaX = endPosition.x - touchStart.x;
				const deltaY = endPosition.y - touchStart.y;
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
				const duration = Date.now() - (lastTap || 0);

				if (!isLongPress && distance < 10) {
					// Tap detected
					if (duration < 300 && lastTap > 0) {
						// Double tap
						triggerHapticFeedback("light");
						onDoubleTap?.(endPosition);
						onGesture?.({
							type: "double-tap",
							startPosition: touchStart,
						});
						setLastTap(0);
					} else {
						// Single tap
						triggerHapticFeedback("light");
						onTap?.(endPosition);
						onGesture?.({
							type: "tap",
							startPosition: touchStart,
						});
						setLastTap(Date.now());
					}
				} else if (!isLongPress && distance > swipeThreshold) {
					// Swipe detected
					const direction = getDirection(touchStart, endPosition);
					triggerHapticFeedback("light");
					onSwipe?.(direction, distance);
					onGesture?.({
						type: "swipe",
						startPosition: touchStart,
						endPosition,
						distance,
						direction,
					});
				} else if (!isLongPress) {
					// Pan gesture
					onGesture?.({
						type: "pan",
						startPosition: touchStart,
						endPosition,
					});
				}
			}

			setTouchStart(null);
			setTouchEnd(null);
			setIsLongPress(false);
			setIsMultiTouch(false);
			setInitialDistance(0);
		},
		[
			touchStart,
			lastTap,
			isLongPress,
			swipeThreshold,
			longPressTimer,
			getTouchPosition,
			getDirection,
			triggerHapticFeedback,
			onTap,
			onDoubleTap,
			onSwipe,
			onGesture,
		]
	);

	useEffect(() => {
		return () => {
			if (longPressTimer) {
				clearTimeout(longPressTimer);
			}
		};
	}, [longPressTimer]);

	return (
		<div
			ref={elementRef}
			className={className}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			style={{ touchAction: "none", ...style }}
		>
			{children}
		</div>
	);
}

// Hook for using touch interactions
export function useTouchInteractions(
	options: Omit<TouchInteractionsProps, "children" | "className"> = {}
) {
	const [gestures, setGestures] = useState<TouchGesture[]>([]);

	const handleGesture = useCallback(
		(gesture: TouchGesture) => {
			setGestures((prev) => [...prev.slice(-9), gesture]); // Keep last 10 gestures
			options.onGesture?.(gesture);
		},
		[options]
	);

	return {
		gestures,
		touchProps: {
			...options,
			onGesture: handleGesture,
		},
	};
}
