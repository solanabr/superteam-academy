import "@testing-library/jest-dom";
import { expect, afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { toHaveNoViolations } from "jest-axe";

// Extend expect with jest-dom matchers and jest-axe matchers
expect.extend({ ...matchers, ...toHaveNoViolations });

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {
			/* noop */
		},
		removeListener: () => {
			/* noop */
		},
		addEventListener: () => {
			/* noop */
		},
		removeEventListener: () => {
			/* noop */
		},
		dispatchEvent: () => false,
	}),
});

// Mock window.ResizeObserver
global.ResizeObserver = class ResizeObserver {
	observe() {
		/* noop */
	}
	unobserve() {
		/* noop */
	}
	disconnect() {
		/* noop */
	}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
	readonly root: Element | Document | null = null;
	readonly rootMargin: string = "";
	readonly thresholds: readonly number[] = [];
	observe() {
		/* noop */
	}
	unobserve() {
		/* noop */
	}
	disconnect() {
		/* noop */
	}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
};

// Mock window.scrollTo
Object.defineProperty(window, "scrollTo", {
	writable: true,
	value: () => {
		/* noop */
	},
});

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === "string" &&
			args[0].includes("Warning: ReactDOM.render is no longer supported")
		) {
			return;
		}
		originalConsoleError.call(console, ...args);
	};

	console.warn = (...args: unknown[]) => {
		if (
			typeof args[0] === "string" &&
			(args[0].includes("Warning:") || args[0].includes("was not wrapped in act"))
		) {
			return;
		}
		originalConsoleWarn.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalConsoleError;
	console.warn = originalConsoleWarn;
});
