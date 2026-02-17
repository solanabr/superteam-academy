import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
	useFocusManagement,
	useLiveRegion,
	useKeyboardNavigation,
	useReducedMotion,
	useHighContrast,
	useId,
	getFocusableElements,
	trapFocus,
	announceToScreenReader,
} from "@superteam-academy/ui";

describe("useFocusManagement Hook", () => {
	it("should initialize with null focused element", () => {
		const { result } = renderHook(() => useFocusManagement());

		expect(result.current.focusedElement).toBeNull();
	});

	it("should focus an element when focusElement is called", () => {
		const { result } = renderHook(() => useFocusManagement());

		const mockElement = document.createElement("button");
		document.body.appendChild(mockElement);

		const focusSpy = vi.spyOn(mockElement, "focus");

		act(() => {
			result.current.focusElement(mockElement);
		});

		expect(focusSpy).toHaveBeenCalled();
		expect(result.current.focusedElement).toBe(mockElement);

		document.body.removeChild(mockElement);
	});

	it("should focus first focusable element", () => {
		const { result } = renderHook(() => useFocusManagement());

		const container = document.createElement("div");
		const button1 = document.createElement("button");
		const button2 = document.createElement("button");
		container.appendChild(button1);
		container.appendChild(button2);
		document.body.appendChild(container);

		const focusSpy = vi.spyOn(button1, "focus");

		act(() => {
			result.current.focusFirst(container);
		});

		expect(focusSpy).toHaveBeenCalled();

		document.body.removeChild(container);
	});

	it("should focus last focusable element", () => {
		const { result } = renderHook(() => useFocusManagement());

		const container = document.createElement("div");
		const button1 = document.createElement("button");
		const button2 = document.createElement("button");
		container.appendChild(button1);
		container.appendChild(button2);
		document.body.appendChild(container);

		const focusSpy = vi.spyOn(button2, "focus");

		act(() => {
			result.current.focusLast(container);
		});

		expect(focusSpy).toHaveBeenCalled();

		document.body.removeChild(container);
	});
});

describe("useLiveRegion Hook", () => {
	it("should initialize with polite politeness by default", () => {
		const { result } = renderHook(() => useLiveRegion());

		expect(result.current.liveRegionRef.current).toBeNull();
	});

	it("should announce messages to screen readers", () => {
		const { result } = renderHook(() => useLiveRegion());

		const mockDiv = document.createElement("div");
		result.current.liveRegionRef.current = mockDiv;

		act(() => {
			result.current.announce("Test message");
		});

		expect(mockDiv.textContent).toBe("Test message");
	});

	it("should set assertive politeness when specified", () => {
		const { result } = renderHook(() => useLiveRegion("assertive"));

		const mockDiv = document.createElement("div");
		result.current.liveRegionRef.current = mockDiv;

		// Trigger useEffect
		expect(mockDiv.getAttribute("aria-live")).toBe("assertive");
	});
});

describe("useKeyboardNavigation Hook", () => {
	let addEventListenerSpy: vi.SpyInstance;
	let removeEventListenerSpy: vi.SpyInstance;

	beforeEach(() => {
		addEventListenerSpy = vi.spyOn(document, "addEventListener");
		removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should add and remove event listeners", () => {
		const { unmount } = renderHook(() => useKeyboardNavigation());

		expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
	});

	it("should call onEnter when Enter key is pressed", () => {
		const onEnter = vi.fn();
		renderHook(() => useKeyboardNavigation(onEnter));

		const event = new KeyboardEvent("keydown", { key: "Enter" });
		document.dispatchEvent(event);

		expect(onEnter).toHaveBeenCalled();
	});

	it("should call onEscape when Escape key is pressed", () => {
		const onEscape = vi.fn();
		renderHook(() => useKeyboardNavigation(undefined, onEscape));

		const event = new KeyboardEvent("keydown", { key: "Escape" });
		document.dispatchEvent(event);

		expect(onEscape).toHaveBeenCalled();
	});

	it("should call arrow key handlers", () => {
		const onArrowUp = vi.fn();
		const onArrowDown = vi.fn();
		const onArrowLeft = vi.fn();
		const onArrowRight = vi.fn();

		renderHook(() =>
			useKeyboardNavigation(
				undefined,
				undefined,
				onArrowUp,
				onArrowDown,
				onArrowLeft,
				onArrowRight
			)
		);

		const arrowUpEvent = new KeyboardEvent("keydown", { key: "ArrowUp" });
		const arrowDownEvent = new KeyboardEvent("keydown", { key: "ArrowDown" });
		const arrowLeftEvent = new KeyboardEvent("keydown", { key: "ArrowLeft" });
		const arrowRightEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });

		document.dispatchEvent(arrowUpEvent);
		document.dispatchEvent(arrowDownEvent);
		document.dispatchEvent(arrowLeftEvent);
		document.dispatchEvent(arrowRightEvent);

		expect(onArrowUp).toHaveBeenCalled();
		expect(onArrowDown).toHaveBeenCalled();
		expect(onArrowLeft).toHaveBeenCalled();
		expect(onArrowRight).toHaveBeenCalled();
	});

	it("should prevent default for arrow keys", () => {
		renderHook(() => useKeyboardNavigation(undefined, undefined, vi.fn()));

		const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
		const preventDefaultSpy = vi.spyOn(event, "preventDefault");

		document.dispatchEvent(event);

		expect(preventDefaultSpy).toHaveBeenCalled();
	});
});

describe("useReducedMotion Hook", () => {
	let matchMediaSpy: vi.SpyInstance;

	beforeEach(() => {
		matchMediaSpy = vi.spyOn(window, "matchMedia");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return false when prefers-reduced-motion is not set", () => {
		matchMediaSpy.mockReturnValue({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});

		const { result } = renderHook(() => useReducedMotion());

		expect(result.current).toBe(false);
	});

	it("should return true when prefers-reduced-motion is set", () => {
		matchMediaSpy.mockReturnValue({
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});

		const { result } = renderHook(() => useReducedMotion());

		expect(result.current).toBe(true);
	});

	it("should update when media query changes", () => {
		const listeners: ((event: MediaQueryListEvent) => void)[] = [];

		matchMediaSpy.mockReturnValue({
			matches: false,
			addEventListener: vi.fn((event, listener) => {
				if (event === "change") listeners.push(listener);
			}),
			removeEventListener: vi.fn(),
		});

		const { result } = renderHook(() => useReducedMotion());

		expect(result.current).toBe(false);

		// Simulate media query change
		act(() => {
			listeners[0]({ matches: true } as MediaQueryListEvent);
		});

		expect(result.current).toBe(true);
	});
});

describe("useHighContrast Hook", () => {
	let matchMediaSpy: vi.SpyInstance;

	beforeEach(() => {
		matchMediaSpy = vi.spyOn(window, "matchMedia");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return false when prefers-contrast is not high", () => {
		matchMediaSpy.mockReturnValue({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});

		const { result } = renderHook(() => useHighContrast());

		expect(result.current).toBe(false);
	});

	it("should return true when prefers-contrast is high", () => {
		matchMediaSpy.mockReturnValue({
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		});

		const { result } = renderHook(() => useHighContrast());

		expect(result.current).toBe(true);
	});
});

describe("useId Hook", () => {
	it("should generate unique IDs", () => {
		const { result: result1 } = renderHook(() => useId());
		const { result: result2 } = renderHook(() => useId());

		expect(result1.current).toMatch(/^id-\d+$/);
		expect(result2.current).toMatch(/^id-\d+$/);
		expect(result1.current).not.toBe(result2.current);
	});

	it("should use custom prefix", () => {
		const { result } = renderHook(() => useId("custom"));

		expect(result.current).toMatch(/^custom-\d+$/);
	});

	it("should remain stable across re-renders", () => {
		const { result, rerender } = renderHook(() => useId());

		const firstId = result.current;
		rerender();

		expect(result.current).toBe(firstId);
	});
});

describe("getFocusableElements", () => {
	it("should return focusable elements", () => {
		const container = document.createElement("div");

		const button = document.createElement("button");
		const input = document.createElement("input");
		const link = document.createElement("a");
		link.href = "#";
		const disabledButton = document.createElement("button");
		disabledButton.disabled = true;

		container.appendChild(button);
		container.appendChild(input);
		container.appendChild(link);
		container.appendChild(disabledButton);

		document.body.appendChild(container);

		const focusableElements = getFocusableElements(container);

		expect(focusableElements).toContain(button);
		expect(focusableElements).toContain(input);
		expect(focusableElements).toContain(link);
		expect(focusableElements).not.toContain(disabledButton);

		document.body.removeChild(container);
	});

	it("should exclude hidden elements", () => {
		const container = document.createElement("div");

		const visibleButton = document.createElement("button");
		const hiddenButton = document.createElement("button");
		hiddenButton.style.display = "none";

		container.appendChild(visibleButton);
		container.appendChild(hiddenButton);

		document.body.appendChild(container);

		const focusableElements = getFocusableElements(container);

		expect(focusableElements).toContain(visibleButton);
		expect(focusableElements).not.toContain(hiddenButton);

		document.body.removeChild(container);
	});
});

describe("trapFocus", () => {
	let addEventListenerSpy: vi.SpyInstance;
	let removeEventListenerSpy: vi.SpyInstance;

	beforeEach(() => {
		addEventListenerSpy = vi.spyOn(document, "addEventListener");
		removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should add event listeners for focus trapping", () => {
		const container = document.createElement("div");
		const cleanup = trapFocus(container);

		expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
		expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

		cleanup();

		expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
	});
});

describe("announceToScreenReader", () => {
	let appendChildSpy: vi.SpyInstance;
	let removeChildSpy: vi.SpyInstance;

	beforeEach(() => {
		appendChildSpy = vi.spyOn(document.body, "appendChild");
		removeChildSpy = vi.spyOn(document.body, "removeChild");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should create and remove announcement element", () => {
		vi.useFakeTimers();

		announceToScreenReader("Test announcement");

		expect(appendChildSpy).toHaveBeenCalled();
		const announcementElement = appendChildSpy.mock.calls[0][0];

		expect(announcementElement.getAttribute("aria-live")).toBe("polite");
		expect(announcementElement.getAttribute("aria-atomic")).toBe("true");
		expect(announcementElement.textContent).toBe("Test announcement");

		vi.advanceTimersByTime(1000);

		expect(removeChildSpy).toHaveBeenCalledWith(announcementElement);

		vi.useRealTimers();
	});

	it("should use assertive priority when specified", () => {
		announceToScreenReader("Test announcement", "assertive");

		const announcementElement = appendChildSpy.mock.calls[0][0];
		expect(announcementElement.getAttribute("aria-live")).toBe("assertive");
	});
});
