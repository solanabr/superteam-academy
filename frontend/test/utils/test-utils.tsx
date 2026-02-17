import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { faker } from "@faker-js/faker";
import { expect, vi } from "vitest";

// Custom render function that includes providers
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
	const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
		return <>{children}</>;
	};

	return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Test data factories
export const createMockUser = () => ({
	id: faker.string.uuid(),
	name: faker.person.fullName(),
	email: faker.internet.email(),
	avatar: faker.image.avatar(),
	walletAddress: faker.string.hexadecimal({ length: 44 }),
	level: faker.number.int({ min: 1, max: 10 }),
	xp: faker.number.int({ min: 0, max: 10_000 }),
	streak: faker.number.int({ min: 0, max: 100 }),
});

export const createMockCourse = () => ({
	id: faker.string.uuid(),
	title: faker.lorem.words(3),
	description: faker.lorem.paragraph(),
	instructor: faker.person.fullName(),
	duration: faker.number.int({ min: 1, max: 20 }),
	level: faker.helpers.arrayElement(["Beginner", "Intermediate", "Advanced"]),
	xpReward: faker.number.int({ min: 100, max: 1000 }),
	lessons: faker.number.int({ min: 5, max: 20 }),
	enrolled: faker.number.int({ min: 0, max: 1000 }),
	rating: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
	tags: faker.helpers.arrayElements(
		["JavaScript", "React", "TypeScript", "Solana", "Web3", "Blockchain"],
		{ min: 1, max: 3 }
	),
});

export const createMockLesson = () => ({
	id: faker.string.uuid(),
	title: faker.lorem.words(4),
	description: faker.lorem.sentences(2),
	content: faker.lorem.paragraphs(3),
	type: faker.helpers.arrayElement(["video", "text", "interactive", "quiz"]),
	duration: faker.number.int({ min: 5, max: 60 }),
	xpReward: faker.number.int({ min: 10, max: 100 }),
	completed: faker.datatype.boolean(),
	order: faker.number.int({ min: 1, max: 20 }),
});

export const createMockWallet = () => ({
	publicKey: {
		toString: () => faker.string.hexadecimal({ length: 44 }),
		toBase58: () => faker.string.hexadecimal({ length: 44 }),
	},
	signTransaction: vi.fn(),
	signAllTransactions: vi.fn(),
	signMessage: vi.fn(),
});

export const createMockTransaction = () => ({
	signature: faker.string.hexadecimal({ length: 88 }),
	confirmed: faker.datatype.boolean(),
	timestamp: faker.date.recent(),
	amount: faker.number.int({ min: 1, max: 1000 }),
	fee: faker.number.int({ min: 5000, max: 50_000 }),
});

// Accessibility testing helpers
export const expectToBeAccessible = async (element: HTMLElement) => {
	const { axe } = await import("jest-axe");
	const results = await axe(element);
	expect(results).toHaveNoViolations();
};

// Mock service responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
	return new Promise<T>((resolve) => {
		setTimeout(() => resolve(data), delay);
	});
};

export const mockApiError = (message: string, _status = 500) => {
	return Promise.reject(new Error(message));
};

// Form testing helpers
export const fillFormField = async (field: HTMLElement, value: string) => {
	const { userEvent } = await import("@testing-library/user-event");
	const user = userEvent.setup();
	await user.clear(field);
	await user.type(field, value);
};

export const submitForm = async (form: HTMLElement) => {
	const { userEvent } = await import("@testing-library/user-event");
	const user = userEvent.setup();
	await user.click(form);
};

// Wait helpers
export const waitForLoadingToFinish = async () => {
	await new Promise((resolve) => setTimeout(resolve, 0));
};

export const waitForMs = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

// Local storage mocks
export const mockLocalStorage = () => {
	const localStorageMock = {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	};
	Object.defineProperty(window, "localStorage", {
		value: localStorageMock,
	});
	return localStorageMock;
};

// Session storage mocks
export const mockSessionStorage = () => {
	const sessionStorageMock = {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	};
	Object.defineProperty(window, "sessionStorage", {
		value: sessionStorageMock,
	});
	return sessionStorageMock;
};
