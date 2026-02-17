import { faker } from "@faker-js/faker";
import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode, ReactElement } from "react";

// Custom render hook with providers
export const renderHookWithProviders = <TProps, TResult>(
	hook: (props: TProps) => TResult,
	options?: RenderHookOptions<TProps>
) => {
	const AllTheProviders = ({ children }: { children: ReactNode }): ReactElement => {
		return children as ReactElement;
	};

	return renderHook(hook, {
		...options,
		wrapper: AllTheProviders,
	});
};

// Wait for a specific amount of time
export const wait = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

// Generate test data using faker
export const generateUser = (overrides = {}) => ({
	id: faker.string.uuid(),
	email: faker.internet.email(),
	name: faker.person.fullName(),
	avatar: faker.image.avatar(),
	createdAt: faker.date.past(),
	...overrides,
});

export const generateCourse = (overrides = {}) => ({
	id: faker.string.uuid(),
	title: faker.lorem.words(3),
	description: faker.lorem.paragraph(),
	instructor: faker.person.fullName(),
	duration: faker.number.int({ min: 1800, max: 7200 }), // 30min to 2hrs
	level: faker.helpers.arrayElement(["beginner", "intermediate", "advanced"]),
	tags: faker.helpers.arrayElements(["javascript", "react", "typescript", "solana"], 2),
	...overrides,
});

export const generateLesson = (overrides = {}) => ({
	id: faker.string.uuid(),
	title: faker.lorem.words(4),
	content: faker.lorem.paragraphs(3),
	duration: faker.number.int({ min: 300, max: 1800 }), // 5min to 30min
	type: faker.helpers.arrayElement(["video", "text", "quiz", "interactive"]),
	...overrides,
});

export const generateChallenge = (overrides = {}) => ({
	id: faker.string.uuid(),
	title: faker.lorem.words(5),
	description: faker.lorem.paragraph(),
	difficulty: faker.helpers.arrayElement(["easy", "medium", "hard"]),
	language: faker.helpers.arrayElement(["typescript", "javascript", "rust", "solidity"]),
	xpReward: faker.number.int({ min: 10, max: 100 }),
	...overrides,
});

// Mock functions
export const createMockFunction = <T extends (...args: unknown[]) => unknown>(
	implementation?: T
) => {
	const mock = vi.fn(implementation);
	return mock;
};

// Async utilities
export const flushPromises = (): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, 0);
	});

export const waitForNextTick = (): Promise<void> =>
	new Promise((resolve) => process.nextTick(resolve));

// DOM utilities
export const createMockElement = (tagName: string, properties = {}) => {
	const element = document.createElement(tagName);
	Object.assign(element, properties);
	return element;
};

// Event utilities
export const createMockEvent = (type: string, properties = {}) => {
	const event = new Event(type);
	Object.assign(event, properties);
	return event;
};

// Local storage mock
export const mockLocalStorage = () => {
	const store: Record<string, string> = {};

	Object.defineProperty(window, "localStorage", {
		value: {
			getItem: vi.fn((key: string) => store[key] || null),
			setItem: vi.fn((key: string, value: string) => {
				store[key] = value.toString();
			}),
			removeItem: vi.fn((key: string) => {
				delete store[key];
			}),
			clear: vi.fn(() => {
				for (const key of Object.keys(store)) {
					delete store[key];
				}
			}),
			key: vi.fn((index: number) => Object.keys(store)[index] || null),
			get length() {
				return Object.keys(store).length;
			},
		},
		writable: true,
	});
};

// Session storage mock
export const mockSessionStorage = () => {
	const store: Record<string, string> = {};

	Object.defineProperty(window, "sessionStorage", {
		value: {
			getItem: vi.fn((key: string) => store[key] || null),
			setItem: vi.fn((key: string, value: string) => {
				store[key] = value.toString();
			}),
			removeItem: vi.fn((key: string) => {
				delete store[key];
			}),
			clear: vi.fn(() => {
				for (const key of Object.keys(store)) {
					delete store[key];
				}
			}),
			key: vi.fn((index: number) => Object.keys(store)[index] || null),
			get length() {
				return Object.keys(store).length;
			},
		},
		writable: true,
	});
};

// Intersection Observer mock
export const mockIntersectionObserver = () => {
	const mockIntersectionObserver = vi.fn();
	mockIntersectionObserver.mockReturnValue({
		observe: () => null,
		unobserve: () => null,
		disconnect: () => null,
	});
	window.IntersectionObserver = mockIntersectionObserver;
};

// Resize Observer mock
export const mockResizeObserver = () => {
	const mockResizeObserver = vi.fn();
	mockResizeObserver.mockReturnValue({
		observe: () => null,
		unobserve: () => null,
		disconnect: () => null,
	});
	window.ResizeObserver = mockResizeObserver;
};

// Match Media mock
export const mockMatchMedia = (matches = false) => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
};

// Performance API mock
export const mockPerformance = () => {
	const mockPerformance = {
		mark: vi.fn(),
		measure: vi.fn(),
		getEntriesByName: vi.fn().mockReturnValue([]),
		getEntriesByType: vi.fn().mockReturnValue([]),
		clearMarks: vi.fn(),
		clearMeasures: vi.fn(),
		now: vi.fn().mockReturnValue(Date.now()),
	};

	Object.defineProperty(window, "performance", {
		value: mockPerformance,
		writable: true,
	});
};

// Geolocation mock
export const mockGeolocation = (position = { latitude: 0, longitude: 0 }) => {
	const mockGeolocation = {
		getCurrentPosition: vi.fn().mockImplementation((success) =>
			success({
				coords: {
					latitude: position.latitude,
					longitude: position.longitude,
					accuracy: 100,
					altitude: null,
					altitudeAccuracy: null,
					heading: null,
					speed: null,
				},
				timestamp: Date.now(),
			})
		),
		watchPosition: vi.fn(),
		clearWatch: vi.fn(),
	};

	Object.defineProperty(navigator, "geolocation", {
		value: mockGeolocation,
		writable: true,
	});
};
