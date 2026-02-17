import "@testing-library/jest-dom";
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { toHaveNoViolations } from "jest-axe";

// Extend expect with jest-dom matchers
expect.extend(matchers);
expect.extend(toHaveNoViolations);

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
		dispatchEvent: () => {
			/* noop */
		},
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
