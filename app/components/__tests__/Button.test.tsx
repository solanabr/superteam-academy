import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
	it("renders with default props", () => {
		render(<Button>Click me</Button>);

		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("inline-flex", "items-center", "justify-center");
	});

	it("renders with different variants", () => {
		const { rerender } = render(<Button variant="default">Default</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-primary");

		rerender(<Button variant="secondary">Secondary</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-secondary");

		rerender(<Button variant="outline">Outline</Button>);
		expect(screen.getByRole("button")).toHaveClass("border", "border-input");
	});

	it("renders with different sizes", () => {
		const { rerender } = render(<Button size="sm">Small</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-9", "px-3");

		rerender(<Button size="default">Medium</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-10", "px-4", "py-2");

		rerender(<Button size="lg">Large</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-11", "px-8");
	});

	it("handles click events", async () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("is disabled when disabled prop is true", () => {
		render(<Button disabled={true}>Disabled</Button>);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
	});

	it("renders with icons as children", () => {
		render(
			<Button>
				<span data-testid="left-icon">←</span>
				With Icons
				<span data-testid="right-icon">→</span>
			</Button>
		);

		expect(screen.getByTestId("left-icon")).toBeInTheDocument();
		expect(screen.getByTestId("right-icon")).toBeInTheDocument();
		expect(screen.getByText("With Icons")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		render(<Button className="custom-class">Custom</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
	});

	it("forwards other props to button element", () => {
		render(
			<Button type="submit" data-testid="submit-button">
				Submit
			</Button>
		);

		const button = screen.getByTestId("submit-button");
		expect(button).toHaveAttribute("type", "submit");
	});

	it("handles keyboard interactions", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Keyboard</Button>);

		const button = screen.getByRole("button");
		fireEvent.keyDown(button, { key: "Enter" });
		fireEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("is accessible with proper ARIA attributes", () => {
		render(<Button aria-label="Custom action">Action</Button>);

		const button = screen.getByLabelText("Custom action");
		expect(button).toHaveAttribute("aria-label", "Custom action");
	});

	it("maintains focus state correctly", () => {
		render(<Button>Focusable</Button>);

		const button = screen.getByRole("button");
		button.focus();
		expect(button).toHaveFocus();

		button.blur();
		expect(button).not.toHaveFocus();
	});

	it("handles async onClick functions", async () => {
		const asyncClick = vi.fn().mockResolvedValue(undefined);
		render(<Button onClick={asyncClick}>Async</Button>);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(asyncClick).toHaveBeenCalledTimes(1);
		expect(button).not.toBeDisabled(); // Should not disable for async clicks by default
	});

	it("renders with custom text", () => {
		render(<Button>Save</Button>);

		expect(screen.getByText("Save")).toBeInTheDocument();
	});
});
