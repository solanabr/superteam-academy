import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useToast } from "../use-toast";

describe("useToast", () => {
	it("starts with empty toasts", () => {
		const { result } = renderHook(() => useToast());
		expect(result.current.toasts).toEqual([]);
	});

	it("adds a toast and returns its id", () => {
		const { result } = renderHook(() => useToast());
		let id: string;
		act(() => {
			id = result.current.toast({ title: "Hello" });
		});
		expect(result.current.toasts).toHaveLength(1);
		expect(result.current.toasts[0].title).toBe("Hello");
		expect(result.current.toasts[0].id).toBe(id!);
	});

	it("supports variant and description", () => {
		const { result } = renderHook(() => useToast());
		act(() => {
			result.current.toast({
				title: "Error",
				description: "Something broke",
				variant: "destructive",
			});
		});
		expect(result.current.toasts[0].variant).toBe("destructive");
		expect(result.current.toasts[0].description).toBe("Something broke");
	});

	it("dismiss removes a toast by id", () => {
		const { result } = renderHook(() => useToast());
		let id: string;
		act(() => {
			id = result.current.toast({ title: "A" });
			result.current.toast({ title: "B" });
		});
		expect(result.current.toasts).toHaveLength(2);
		act(() => {
			result.current.dismiss(id);
		});
		expect(result.current.toasts).toHaveLength(1);
		expect(result.current.toasts[0].title).toBe("B");
	});

	it("auto-dismisses after default duration", () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useToast());
		act(() => {
			result.current.toast({ title: "Auto" });
		});
		expect(result.current.toasts).toHaveLength(1);
		act(() => {
			vi.advanceTimersByTime(5000);
		});
		expect(result.current.toasts).toHaveLength(0);
		vi.useRealTimers();
	});

	it("auto-dismisses after custom duration", () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useToast());
		act(() => {
			result.current.toast({ title: "Quick", duration: 1000 });
		});
		act(() => {
			vi.advanceTimersByTime(999);
		});
		expect(result.current.toasts).toHaveLength(1);
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current.toasts).toHaveLength(0);
		vi.useRealTimers();
	});
});
