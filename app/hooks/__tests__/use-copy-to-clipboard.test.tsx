import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useCopyToClipboard } from "../use-copy-to-clipboard";

describe("useCopyToClipboard", () => {
	const writeText = vi.fn().mockResolvedValue(undefined);

	beforeEach(() => {
		vi.useFakeTimers();
		Object.assign(navigator, { clipboard: { writeText } });
		writeText.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts with copied=false", () => {
		const { result } = renderHook(() => useCopyToClipboard());
		expect(result.current.copied).toBe(false);
	});

	it("copies text and sets copied=true", async () => {
		const { result } = renderHook(() => useCopyToClipboard());
		await act(async () => {
			await result.current.copy("hello");
		});
		expect(writeText).toHaveBeenCalledWith("hello");
		expect(result.current.copied).toBe(true);
	});

	it("resets copied after default timeout", async () => {
		const { result } = renderHook(() => useCopyToClipboard());
		await act(async () => {
			await result.current.copy("test");
		});
		expect(result.current.copied).toBe(true);
		act(() => {
			vi.advanceTimersByTime(2000);
		});
		expect(result.current.copied).toBe(false);
	});

	it("respects custom timeout", async () => {
		const { result } = renderHook(() => useCopyToClipboard(500));
		await act(async () => {
			await result.current.copy("test");
		});
		act(() => {
			vi.advanceTimersByTime(499);
		});
		expect(result.current.copied).toBe(true);
		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current.copied).toBe(false);
	});
});
