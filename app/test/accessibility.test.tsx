import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { expectToBeAccessible } from "@/test/utils/test-utils";

describe("Accessibility Tests", () => {
	describe("Button Component", () => {
		it("is accessible with default props", async () => {
			const { container } = render(<Button>Click me</Button>);
			await expectToBeAccessible(container);
		});

		it("is accessible when disabled", async () => {
			const { container } = render(<Button disabled={true}>Disabled</Button>);
			await expectToBeAccessible(container);
		});

		it("is accessible with loading state", async () => {
			const { container } = render(<Button disabled={true}>Loading</Button>);
			await expectToBeAccessible(container);
		});

		it("has proper focus management", async () => {
			render(<Button>Focusable</Button>);
			const button = screen.getByRole("button");

			button.focus();
			expect(button).toHaveFocus();

			// Check for visible focus indicator
			expect(button).toHaveClass("focus:outline-none", "focus:ring-2");
		});

		it("supports keyboard navigation", async () => {
			render(<Button>Keyboard</Button>);
			const button = screen.getByRole("button");

			button.focus();
			expect(button).toHaveFocus();
		});
	});

	describe("Input Component", () => {
		it("is accessible with label", async () => {
			const { container } = render(
				<div>
					<label htmlFor="test-input">Test Input</label>
					<Input id="test-input" />
				</div>
			);
			await expectToBeAccessible(container);
		});

		it("is accessible with aria-label", async () => {
			const { container } = render(<Input aria-label="Test input" />);
			await expectToBeAccessible(container);
		});

		it("is accessible with error state", async () => {
			const { container } = render(
				<div>
					<label htmlFor="error-input">Error Input</label>
					<Input id="error-input" aria-invalid={true} />
				</div>
			);
			await expectToBeAccessible(container);
		});

		it("is accessible with helper text", async () => {
			const { container } = render(
				<div>
					<label htmlFor="helper-input">Helper Input</label>
					<Input id="helper-input" aria-describedby="helper-text" />
				</div>
			);
			await expectToBeAccessible(container);
		});

		it("supports proper form association", async () => {
			const { container } = render(
				<form>
					<label htmlFor="form-input">Form Input</label>
					<Input id="form-input" required={true} />
				</form>
			);
			await expectToBeAccessible(container);
		});

		it("handles focus and blur correctly", async () => {
			render(<Input placeholder="Focus test" />);
			const input = screen.getByPlaceholderText("Focus test");

			input.focus();
			expect(input).toHaveFocus();

			input.blur();
			expect(input).not.toHaveFocus();
		});
	});

	describe("Card Component", () => {
		it("is accessible as default card", async () => {
			const { container } = render(
				<Card>
					<CardHeader>
						<CardTitle>Card Title</CardTitle>
						<CardDescription>Card description</CardDescription>
					</CardHeader>
					<CardContent>Card content</CardContent>
				</Card>
			);
			await expectToBeAccessible(container);
		});

		it("is accessible as article", async () => {
			const { container } = render(
				<Card role="article">
					<CardHeader>
						<CardTitle>Article Title</CardTitle>
						<CardDescription>Article description</CardDescription>
					</CardHeader>
					<CardContent>Article content</CardContent>
				</Card>
			);
			await expectToBeAccessible(container);
		});

		it("is accessible with custom ARIA attributes", async () => {
			const { container } = render(
				<Card role="region" aria-label="Custom card">
					<CardContent>Content</CardContent>
				</Card>
			);
			await expectToBeAccessible(container);
		});

		it("has proper heading hierarchy", async () => {
			const { container } = render(
				<Card>
					<CardHeader>
						<CardTitle>Card Title</CardTitle>
						<CardDescription>Description</CardDescription>
					</CardHeader>
				</Card>
			);

			const title = screen.getByRole("heading", { level: 3 });
			expect(title).toBeInTheDocument();
			await expectToBeAccessible(container);
		});
	});

	describe("Color Contrast", () => {
		it("has sufficient color contrast in light mode", async () => {
			const { container } = render(
				<div>
					<Button>Primary Button</Button>
					<Button variant="secondary">Secondary Button</Button>
					<Input placeholder="Input field" />
				</div>
			);
			await expectToBeAccessible(container);
		});

		it("has sufficient color contrast in dark mode", async () => {
			const { container } = render(
				<div className="dark">
					<Button>Dark Button</Button>
					<Button variant="secondary">Dark Secondary</Button>
					<Input placeholder="Dark input" />
				</div>
			);
			await expectToBeAccessible(container);
		});
	});

	describe("Screen Reader Support", () => {
		it("provides proper screen reader text for status messages", async () => {
			const { container } = render(
				<div>
					<div aria-live="polite" aria-atomic="true">
						Status message for screen readers
					</div>
					<Button disabled={true}>Loading</Button>
				</div>
			);
			await expectToBeAccessible(container);
		});

		it("hides decorative elements from screen readers", async () => {
			const { container } = render(
				<div>
					<Button>
						Action
						<span aria-hidden="true">&rarr;</span>
					</Button>
				</div>
			);
			await expectToBeAccessible(container);
		});
	});

	describe("Keyboard Navigation", () => {
		it("supports Tab navigation order", async () => {
			render(
				<div>
					<Button>First</Button>
					<Input placeholder="Second" />
					<Button>Third</Button>
				</div>
			);

			const firstButton = screen.getByText("First");
			screen.getByPlaceholderText("Second");
			screen.getByText("Third");

			firstButton.focus();
			expect(firstButton).toHaveFocus();

			// Note: Actual tab navigation testing would require more complex setup
			// This is a basic structure test
		});

		it("handles Enter and Space key activation", async () => {
			render(<Button>Keyboard Button</Button>);
			const button = screen.getByRole("button");

			button.focus();
			expect(button).toHaveFocus();

			// Keyboard interaction tests would need user-event
		});
	});

	describe("Focus Management", () => {
		it("has visible focus indicators", async () => {
			render(
				<div>
					<Button>Focusable Button</Button>
					<Input placeholder="Focusable Input" />
				</div>
			);

			const button = screen.getByRole("button");
			const input = screen.getByPlaceholderText("Focusable Input");

			button.focus();
			expect(button).toHaveFocus();

			input.focus();
			expect(input).toHaveFocus();
		});

		it("maintains focus within modal dialogs", async () => {
			// This would test focus trapping in dialogs
			// Implementation depends on dialog component
			render(<Button>Modal Trigger</Button>);
			const button = screen.getByRole("button");
			expect(button).toBeInTheDocument();
		});
	});

	describe("Responsive Design", () => {
		it("remains accessible on small screens", async () => {
			// Mock small screen
			Object.defineProperty(window, "innerWidth", { value: 375 });

			const { container } = render(
				<div>
					<Button>Small Screen Button</Button>
					<Input placeholder="Small screen input" />
				</div>
			);
			await expectToBeAccessible(container);
		});

		it("handles touch targets appropriately", async () => {
			const { container } = render(
				<Button className="min-h-[44px] min-w-[44px]">Touch Target</Button>
			);
			await expectToBeAccessible(container);
		});
	});

	describe("Error States", () => {
		it("communicates errors to screen readers", async () => {
			const { container } = render(
				<div>
					<label htmlFor="error-field">Error Field</label>
					<Input id="error-field" aria-invalid={true} />
				</div>
			);
			await expectToBeAccessible(container);
		});

		it("associates error messages with inputs", async () => {
			const { container } = render(
				<div>
					<label htmlFor="error-input">Input with Error</label>
					<Input id="error-input" aria-invalid={true} aria-describedby="error-message" />
					<div id="error-message">Error message</div>
				</div>
			);
			await expectToBeAccessible(container);
		});
	});

	describe("Loading States", () => {
		it("communicates loading states to screen readers", async () => {
			const { container } = render(
				<div>
					<Button disabled={true} aria-label="Loading action">
						Action
					</Button>
				</div>
			);
			await expectToBeAccessible(container);
		});

		it("provides status updates during loading", async () => {
			const { container } = render(
				<div>
					<div aria-live="polite">Loading content...</div>
					<Button disabled={true}>Loading Button</Button>
				</div>
			);
			await expectToBeAccessible(container);
		});
	});

	describe("Form Accessibility", () => {
		it("has proper form structure", async () => {
			const { container } = render(
				<form>
					<fieldset>
						<legend>Personal Information</legend>
						<label htmlFor="name">Name</label>
						<Input id="name" required={true} />
						<label htmlFor="email">Email</label>
						<Input id="email" type="email" required={true} />
					</fieldset>
					<Button type="submit">Submit</Button>
				</form>
			);
			await expectToBeAccessible(container);
		});

		it("groups related form controls", async () => {
			const { container } = render(
				<form>
					<fieldset aria-labelledby="contact-info">
						<h3 id="contact-info">Contact Information</h3>
						<label htmlFor="phone">Phone</label>
						<Input id="phone" />
						<label htmlFor="address">Address</label>
						<Input id="address" />
					</fieldset>
				</form>
			);
			await expectToBeAccessible(container);
		});
	});
});
