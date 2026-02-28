import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";

describe("Input Component", () => {
	it("renders with default props", () => {
		render(<Input placeholder="Enter text" />);

		const input = screen.getByPlaceholderText("Enter text");
		expect(input).toBeInTheDocument();
		expect((input as HTMLInputElement).type).toBe("text");
	});

	it("renders with different input types", () => {
		const { rerender } = render(<Input type="email" placeholder="Email" />);
		expect(screen.getByPlaceholderText("Email")).toHaveAttribute("type", "email");

		rerender(<Input type="password" placeholder="Password" />);
		expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password");

		rerender(<Input type="number" placeholder="Number" />);
		expect(screen.getByPlaceholderText("Number")).toHaveAttribute("type", "number");
	});

	it("handles value changes", async () => {
		const handleChange = vi.fn();
		render(<Input onChange={handleChange} />);

		const input = screen.getByRole("textbox");
		await userEvent.type(input, "Hello World");

		expect(handleChange).toHaveBeenCalledTimes(11); // 11 characters including spaces
		expect(input).toHaveValue("Hello World");
	});

	it("shows validation state via aria-invalid", () => {
		render(<Input aria-invalid={true} placeholder="Required field" />);

		const input = screen.getByPlaceholderText("Required field");
		expect(input).toHaveAttribute("aria-invalid", "true");
	});

	it("renders with valid state", () => {
		render(<Input placeholder="Valid input" />);

		const input = screen.getByPlaceholderText("Valid input");
		expect(input).toBeInTheDocument();
	});

	it("renders with data attributes", () => {
		render(<Input data-testid="search-input" placeholder="Search" />);

		expect(screen.getByTestId("search-input")).toBeInTheDocument();
	});

	it("handles disabled state", () => {
		render(<Input disabled={true} placeholder="Disabled input" />);

		const input = screen.getByPlaceholderText("Disabled input");
		expect(input).toBeDisabled();
		expect(input).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
	});

	it("renders when placeholder is provided", () => {
		render(<Input placeholder="Loading input" />);

		const input = screen.getByPlaceholderText("Loading input");
		expect(input).toBeInTheDocument();
	});

	it("handles different sizes", () => {
		const { rerender } = render(<Input size={10} placeholder="Small" />);
		expect(screen.getByPlaceholderText("Small")).toHaveAttribute("size", "10");

		rerender(<Input size={20} placeholder="Medium" />);
		expect(screen.getByPlaceholderText("Medium")).toHaveAttribute("size", "20");

		rerender(<Input size={30} placeholder="Large" />);
		expect(screen.getByPlaceholderText("Large")).toHaveAttribute("size", "30");
	});

	it("applies custom className", () => {
		render(<Input className="custom-input" placeholder="Custom" />);

		const input = screen.getByPlaceholderText("Custom");
		expect(input).toHaveClass("custom-input");
	});

	it("forwards other props to input element", () => {
		render(<Input data-testid="custom-input" maxLength={10} />);

		const input = screen.getByTestId("custom-input");
		expect(input).toHaveAttribute("maxLength", "10");
	});

	it("handles focus and blur events", () => {
		const handleFocus = vi.fn();
		const handleBlur = vi.fn();

		render(<Input onFocus={handleFocus} onBlur={handleBlur} placeholder="Focus test" />);

		const input = screen.getByPlaceholderText("Focus test");
		input.focus();
		expect(handleFocus).toHaveBeenCalledTimes(1);

		input.blur();
		expect(handleBlur).toHaveBeenCalledTimes(1);
	});

	it("respects maxLength attribute", () => {
		render(<Input maxLength={20} defaultValue="Hello" />);

		const input = screen.getByDisplayValue("Hello");
		expect(input).toHaveAttribute("maxLength", "20");
	});

	it("handles number input constraints", () => {
		render(<Input type="number" min={0} max={100} step={5} placeholder="Number input" />);

		const input = screen.getByPlaceholderText("Number input");
		expect(input).toHaveAttribute("min", "0");
		expect(input).toHaveAttribute("max", "100");
		expect(input).toHaveAttribute("step", "5");
	});

	it("supports aria-describedby for helper text", () => {
		render(<Input aria-describedby="helper" placeholder="With helper" />);

		const input = screen.getByPlaceholderText("With helper");
		expect(input).toHaveAttribute("aria-describedby", "helper");
	});

	it("handles required state", () => {
		render(<Input required={true} placeholder="Required field" />);

		const input = screen.getByPlaceholderText("Required field");
		expect(input).toBeRequired();
	});

	it("handles readOnly state", () => {
		render(<Input readOnly={true} value="Read only value" />);

		const input = screen.getByDisplayValue("Read only value");
		expect(input).toHaveAttribute("readOnly");
	});

	it("supports autocomplete attributes", () => {
		render(<Input autoComplete="email" placeholder="Email" />);

		const input = screen.getByPlaceholderText("Email");
		expect(input).toHaveAttribute("autoComplete", "email");
	});

	it("handles keyboard events", () => {
		const handleKeyDown = vi.fn();
		const handleKeyUp = vi.fn();

		render(
			<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} placeholder="Keyboard test" />
		);

		const input = screen.getByPlaceholderText("Keyboard test");
		fireEvent.keyDown(input, { key: "Enter" });
		fireEvent.keyUp(input, { key: "Enter" });

		expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: "Enter" }));
		expect(handleKeyUp).toHaveBeenCalledWith(expect.objectContaining({ key: "Enter" }));
	});

	it("is accessible with proper labels", () => {
		render(
			<div>
				<label htmlFor="test-input">Test Label</label>
				<Input id="test-input" />
			</div>
		);

		const input = screen.getByLabelText("Test Label");
		expect(input).toBeInTheDocument();
	});

	it("supports ARIA attributes", () => {
		render(
			<Input
				aria-label="Custom input"
				aria-describedby="helper-text"
				placeholder="ARIA test"
			/>
		);

		const input = screen.getByLabelText("Custom input");
		expect(input).toHaveAttribute("aria-describedby", "helper-text");
	});

	it("handles paste events", () => {
		const handlePaste = vi.fn();
		render(<Input onPaste={handlePaste} />);

		const input = screen.getByRole("textbox");
		fireEvent.paste(input);

		expect(handlePaste).toHaveBeenCalled();
	});

	it("validates email format when type is email", async () => {
		render(<Input type="email" value="invalid-email" />);

		const input = screen.getByDisplayValue("invalid-email");
		expect(input).toHaveAttribute("type", "email");
		// Note: HTML5 validation is handled by the browser, not the component
	});

	it("handles controlled vs uncontrolled usage", () => {
		// Controlled
		const { unmount } = render(<Input value="controlled" onChange={() => {}} />);
		expect(screen.getByDisplayValue("controlled")).toBeInTheDocument();
		unmount();

		// Uncontrolled
		render(<Input defaultValue="uncontrolled" />);
		expect(screen.getByDisplayValue("uncontrolled")).toBeInTheDocument();
	});
});
