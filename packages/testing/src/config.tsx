import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">): RenderResult =>
	render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Test configuration
export const testConfig = {
	timeout: 10_000,
	retry: 3,
	slowTestThreshold: 5000,
};

// Common test data
export const testData = {
	user: {
		id: "test-user-id",
		email: "test@example.com",
		name: "Test User",
		avatar: "https://example.com/avatar.jpg",
	},
	course: {
		id: "test-course-id",
		title: "Test Course",
		description: "A test course for testing purposes",
		instructor: "Test Instructor",
		duration: 3600, // 1 hour in seconds
		level: "beginner" as const,
	},
	lesson: {
		id: "test-lesson-id",
		title: "Test Lesson",
		content: "Test lesson content",
		duration: 600, // 10 minutes
		type: "video" as const,
	},
};
