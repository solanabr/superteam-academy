// Test configuration and setup
export * from "./config";

// Test utilities and helpers
export * from "./utils";

// Mock servers and data
export * from "./mocks";

// Test data factories
export * from "./factories";

// Re-export commonly used testing library functions
export {
	render,
	screen,
	waitFor,
	fireEvent,
	act,
	within,
} from "@testing-library/react";

export { default as userEvent } from "@testing-library/user-event";
