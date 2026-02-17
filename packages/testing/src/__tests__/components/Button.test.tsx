import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@superteam-academy/testing";
import { Button } from "@superteam-academy/ui";

describe("Button Component", () => {
	it("should render with default props", () => {
		render(<Button>Click me</Button>);

		const button = screen.getByRole("button", { name: /click me/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("inline-flex", "items-center", "justify-center");
	});

	it("should render different variants", () => {
		const { rerender } = render(<Button variant="default">Default</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-primary");

		rerender(<Button variant="destructive">Destructive</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-destructive");

		rerender(<Button variant="outline">Outline</Button>);
		expect(screen.getByRole("button")).toHaveClass("border", "border-input");

		rerender(<Button variant="secondary">Secondary</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-secondary");

		rerender(<Button variant="ghost">Ghost</Button>);
		expect(screen.getByRole("button")).toHaveClass("hover:bg-accent");

		rerender(<Button variant="link">Link</Button>);
		expect(screen.getByRole("button")).toHaveClass("text-primary", "underline-offset-4");
	});

	it("should render different sizes", () => {
		const { rerender } = render(<Button size="default">Default</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-10", "px-4", "py-2");

		rerender(<Button size="sm">Small</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-9", "px-3");

		rerender(<Button size="lg">Large</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-11", "px-8");

		rerender(<Button size="icon">Icon</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-10", "w-10");
	});

	it("should handle click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		const button = screen.getByRole("button");
		fireEvent.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should be disabled when disabled prop is true", () => {
		const handleClick = vi.fn();
		render(
			<Button disabled={true} onClick={handleClick}>
				Disabled
			</Button>
		);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();

		fireEvent.click(button);
		expect(handleClick).not.toHaveBeenCalled();
	});

	it("should show loading state", () => {
		render(<Button loading={true}>Loading</Button>);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute("aria-busy", "true");
	});

	it("should render as child component when asChild is true", () => {
		render(
			<Button asChild={true}>
				<a href="/test">Link Button</a>
			</Button>
		);

		const link = screen.getByRole("link");
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/test");
	});

	it("should have correct accessibility attributes", () => {
		render(<Button aria-label="Custom label">Button</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-label", "Custom label");
	});

	it("should support custom className", () => {
		render(<Button className="custom-class">Custom</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveClass("custom-class");
	});

	it("should forward ref correctly", () => {
		const ref = { current: null };
		render(<Button ref={ref}>Button</Button>);

		expect(ref.current).toBeInstanceOf(HTMLButtonElement);
	});
});
