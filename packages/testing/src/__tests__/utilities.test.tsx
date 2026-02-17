import { describe, it, expect } from "vitest";
import { render, screen } from "@superteam-academy/testing";
import { generateUser, mockLocalStorage, wait } from "@superteam-academy/testing";

// Example test demonstrating the testing utilities
describe("Testing Utilities", () => {
	describe("generateUser", () => {
		it("should generate a valid user object", () => {
			const user = generateUser();

			expect(user).toHaveProperty("id");
			expect(user).toHaveProperty("email");
			expect(user).toHaveProperty("name");
			expect(user).toHaveProperty("avatar");
			expect(user).toHaveProperty("createdAt");
			expect(typeof user.id).toBe("string");
			expect(typeof user.email).toBe("string");
			expect(typeof user.name).toBe("string");
		});

		it("should override default values", () => {
			const customUser = generateUser({
				name: "Custom Name",
				email: "custom@example.com",
			});

			expect(customUser.name).toBe("Custom Name");
			expect(customUser.email).toBe("custom@example.com");
		});
	});

	describe("mockLocalStorage", () => {
		it("should mock localStorage functionality", () => {
			mockLocalStorage();

			// Test setItem
			localStorage.setItem("testKey", "testValue");
			expect(localStorage.getItem("testKey")).toBe("testValue");

			// Test removeItem
			localStorage.removeItem("testKey");
			expect(localStorage.getItem("testKey")).toBeNull();

			// Test clear
			localStorage.setItem("key1", "value1");
			localStorage.setItem("key2", "value2");
			localStorage.clear();
			expect(localStorage.getItem("key1")).toBeNull();
			expect(localStorage.getItem("key2")).toBeNull();
		});
	});

	describe("wait utility", () => {
		it("should wait for specified milliseconds", async () => {
			const start = Date.now();
			await wait(100);
			const end = Date.now();

			expect(end - start).toBeGreaterThanOrEqual(95); // Allow some tolerance
		});
	});

	describe("render function", () => {
		it("should render components with providers", () => {
			const TestComponent = () => <div data-testid="test">Hello World</div>;

			render(<TestComponent />);

			expect(screen.getByTestId("test")).toBeInTheDocument();
			expect(screen.getByText("Hello World")).toBeInTheDocument();
		});
	});
});
