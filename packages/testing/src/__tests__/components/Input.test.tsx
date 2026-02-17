import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@superteam-academy/testing";
import { Input } from "@superteam-academy/ui";

describe("Input Component", () => {
	it("should render with default props", () => {
		render(<Input placeholder="Enter text" />);

		const input = screen.getByPlaceholderText("Enter text");
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute("type", "text");
		expect(input).toHaveClass(
			"flex",
			"h-10",
			"w-full",
			"rounded-md",
			"border",
			"border-input",
			"bg-background",
			"px-3",
			"py-2",
			"text-sm"
		);
	});

	it("should render different input types", () => {
		const { rerender } = render(<Input type="email" />);
		expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

		rerender(<Input type="password" />);
		expect(screen.getByDisplayValue("")).toHaveAttribute("type", "password");

		rerender(<Input type="number" />);
		expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number");

		rerender(<Input type="tel" />);
		expect(screen.getByRole("textbox")).toHaveAttribute("type", "tel");
	});

	it("should handle text input", () => {
		render(<Input placeholder="Enter text" />);

		const input = screen.getByPlaceholderText("Enter text");
		fireEvent.change(input, { target: { value: "Hello World" } });

		expect(input).toHaveValue("Hello World");
	});

	it("should handle number input", () => {
		render(<Input type="number" />);

		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "42" } });

		expect(input).toHaveValue(42);
	});

	it("should be disabled when disabled prop is true", () => {
		render(<Input disabled={true} placeholder="Disabled input" />);

		const input = screen.getByPlaceholderText("Disabled input");
		expect(input).toBeDisabled();
		expect(input).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
	});

	it("should show placeholder text", () => {
		render(<Input placeholder="Type something..." />);

		const input = screen.getByPlaceholderText("Type something...");
		expect(input).toBeInTheDocument();
	});

	it("should handle focus and blur events", () => {
		const onFocus = vi.fn();
		const onBlur = vi.fn();

		render(<Input onFocus={onFocus} onBlur={onBlur} />);

		const input = screen.getByRole("textbox");
		input.focus();
		expect(onFocus).toHaveBeenCalledTimes(1);

		input.blur();
		expect(onBlur).toHaveBeenCalledTimes(1);
	});

	it("should support custom className", () => {
		render(<Input className="custom-input" />);

		const input = screen.getByRole("textbox");
		expect(input).toHaveClass("custom-input");
	});

	it("should support maxLength", () => {
		render(<Input maxLength={10} />);

		const input = screen.getByRole("textbox");
		expect(input).toHaveAttribute("maxLength", "10");
	});

	it("should support min and max for number inputs", () => {
		render(<Input type="number" min={0} max={100} />);

		const input = screen.getByRole("spinbutton");
		expect(input).toHaveAttribute("min", "0");
		expect(input).toHaveAttribute("max", "100");
	});

	it("should support step for number inputs", () => {
		render(<Input type="number" step={0.5} />);

		const input = screen.getByRole("spinbutton");
		expect(input).toHaveAttribute("step", "0.5");
	});

	it("should support pattern validation", () => {
		render(<Input pattern="[A-Za-z]+" title="Only letters allowed" />);

		const input = screen.getByRole("textbox");
		expect(input).toHaveAttribute("pattern", "[A-Za-z]+");
		expect(input).toHaveAttribute("title", "Only letters allowed");
	});

	it("should support required attribute", () => {
		render(<Input required={true} />);

		const input = screen.getByRole("textbox");
		expect(input).toHaveAttribute("required");
	});

	it("should support readOnly attribute", () => {
		render(<Input readOnly={true} value="Read only text" />);

		const input = screen.getByDisplayValue("Read only text");
		expect(input).toHaveAttribute("readOnly");
	});

	it("should support autoComplete", () => {
		render(<Input autoComplete="email" />);

		const input = screen.getByRole("textbox");
		expect(input).toHaveAttribute("autoComplete", "email");
	});

	it("should support inputMode for mobile", () => {
		render(<Input inputMode="numeric" />);

		const input = screen.getByRole("textbox");
		expect(input).toHaveAttribute("inputMode", "numeric");
	});

	it("should forward ref correctly", () => {
		const ref = { current: null };
		render(<Input ref={ref} />);

		expect(ref.current).toBeInstanceOf(HTMLInputElement);
	});

	it("should handle onChange events", () => {
		const onChange = vi.fn();
		render(<Input onChange={onChange} />);

		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "test" } });

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				target: expect.objectContaining({ value: "test" }),
			})
		);
	});

	it("should handle onKeyDown events", () => {
		const onKeyDown = vi.fn();
		render(<Input onKeyDown={onKeyDown} />);

		const input = screen.getByRole("textbox");
		fireEvent.keyDown(input, { key: "Enter" });

		expect(onKeyDown).toHaveBeenCalledTimes(1);
		expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key: "Enter" }));
	});

	it("should support aria attributes", () => {
		render(<Input aria-label="Custom label" aria-describedby="help-text" />);

		const input = screen.getByRole("textbox");
		expect(input).toHaveAttribute("aria-label", "Custom label");
		expect(input).toHaveAttribute("aria-describedby", "help-text");
	});
});
