import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@superteam-academy/testing";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@superteam-academy/ui";

describe("Dialog Component", () => {
	it("should not render dialog content when closed", () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
				</DialogContent>
			</Dialog>
		);

		expect(screen.getByRole("button", { name: /open dialog/i })).toBeInTheDocument();
		expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();
		expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
	});

	it("should open dialog when trigger is clicked", async () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
				</DialogContent>
			</Dialog>
		);

		const trigger = screen.getByRole("button", { name: /open dialog/i });
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("Dialog Title")).toBeInTheDocument();
			expect(screen.getByText("Dialog content")).toBeInTheDocument();
		});
	});

	it("should close dialog when close button is clicked", async () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
				</DialogContent>
			</Dialog>
		);

		// Open dialog
		const trigger = screen.getByRole("button", { name: /open dialog/i });
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("Dialog Title")).toBeInTheDocument();
		});

		// Close dialog
		const closeButton = screen.getByRole("button", { name: /close/i });
		fireEvent.click(closeButton);

		await waitFor(() => {
			expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();
		});
	});

	it("should close dialog when clicking overlay", async () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
				</DialogContent>
			</Dialog>
		);

		// Open dialog
		const trigger = screen.getByRole("button", { name: /open dialog/i });
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("Dialog Title")).toBeInTheDocument();
		});

		// Click overlay
		const overlay = document.querySelector("[data-radix-dialog-overlay]");
		if (overlay) {
			fireEvent.click(overlay);
		}

		await waitFor(() => {
			expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();
		});
	});

	it("should support controlled open state", () => {
		const { rerender } = render(
			<Dialog open={false}>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();

		rerender(
			<Dialog open={true}>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		expect(screen.getByText("Dialog Title")).toBeInTheDocument();
	});

	it("should call onOpenChange when dialog state changes", async () => {
		const onOpenChange = vi.fn();

		render(
			<Dialog onOpenChange={onOpenChange}>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		const trigger = screen.getByRole("button", { name: /open dialog/i });
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(true);
		});

		const closeButton = screen.getByRole("button", { name: /close/i });
		fireEvent.click(closeButton);

		await waitFor(() => {
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});
	});
});

describe("DialogHeader Component", () => {
	it("should render with correct styling", () => {
		render(
			<Dialog open={true}>
				<DialogContent>
					<DialogHeader>
						<h2>Header Content</h2>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		);

		const header = screen.getByText("Header Content").parentElement;
		expect(header).toHaveClass(
			"flex",
			"flex-col",
			"space-y-1.5",
			"text-center",
			"sm:text-left"
		);
	});
});

describe("DialogTitle Component", () => {
	it("should render as proper heading with correct styling", () => {
		render(
			<Dialog open={true}>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		const title = screen.getByRole("heading");
		expect(title).toHaveTextContent("Dialog Title");
		expect(title).toHaveClass("text-lg", "font-semibold", "leading-none", "tracking-tight");
	});
});

describe("DialogDescription Component", () => {
	it("should render with correct styling", () => {
		render(
			<Dialog open={true}>
				<DialogContent>
					<DialogDescription>Description text</DialogDescription>
				</DialogContent>
			</Dialog>
		);

		const description = screen.getByText("Description text");
		expect(description).toHaveClass("text-sm", "text-muted-foreground");
	});
});

describe("DialogFooter Component", () => {
	it("should render with correct styling", () => {
		render(
			<Dialog open={true}>
				<DialogContent>
					<DialogFooter>
						<button type="button">Cancel</button>
						<button type="button">Confirm</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);

		const footer = screen.getByText("Cancel").parentElement;
		expect(footer).toHaveClass(
			"flex",
			"flex-col-reverse",
			"sm:flex-row",
			"sm:justify-end",
			"sm:space-x-2"
		);
	});
});

describe("DialogClose Component", () => {
	it("should close dialog when clicked", async () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<DialogClose>Custom Close</DialogClose>
				</DialogContent>
			</Dialog>
		);

		// Open dialog
		const trigger = screen.getByRole("button", { name: /open dialog/i });
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("Dialog Title")).toBeInTheDocument();
		});

		// Close with custom close button
		const customClose = screen.getByText("Custom Close");
		fireEvent.click(customClose);

		await waitFor(() => {
			expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();
		});
	});
});

describe("Dialog Accessibility", () => {
	it("should have proper ARIA attributes", async () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Accessible Dialog</DialogTitle>
					<DialogDescription>This is an accessible dialog</DialogDescription>
				</DialogContent>
			</Dialog>
		);

		const trigger = screen.getByRole("button", { name: /open dialog/i });
		fireEvent.click(trigger);

		await waitFor(() => {
			const dialog = screen.getByRole("dialog");
			expect(dialog).toBeInTheDocument();
			expect(dialog).toHaveAttribute("aria-labelledby");
			expect(dialog).toHaveAttribute("aria-describedby");
		});
	});

	it("should trap focus within dialog", async () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Focus Trapped Dialog</DialogTitle>
					<button type="button">First Button</button>
					<button type="button">Second Button</button>
				</DialogContent>
			</Dialog>
		);

		const trigger = screen.getByRole("button", { name: /open dialog/i });
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("Focus Trapped Dialog")).toBeInTheDocument();
		});

		// Focus should be trapped within the dialog
		const firstButton = screen.getByText("First Button");
		const _secondButton = screen.getByText("Second Button");
		const _closeButton = screen.getByRole("button", { name: /close/i });

		expect(document.activeElement).toBe(firstButton);
	});

	it("should restore focus to trigger when closed", async () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		const trigger = screen.getByRole("button", { name: /open dialog/i });
		trigger.focus();
		fireEvent.click(trigger);

		await waitFor(() => {
			expect(screen.getByText("Dialog Title")).toBeInTheDocument();
		});

		const closeButton = screen.getByRole("button", { name: /close/i });
		fireEvent.click(closeButton);

		await waitFor(() => {
			expect(document.activeElement).toBe(trigger);
		});
	});
});
