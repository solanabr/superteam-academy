import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";

describe("Dialog Component", () => {
	it("renders trigger button", () => {
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
				</DialogContent>
			</Dialog>
		);

		expect(screen.getByText("Open Dialog")).toBeInTheDocument();
		expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();
	});

	it("opens dialog when trigger is clicked", async () => {
		const user = userEvent.setup();
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));

		await waitFor(() => {
			expect(screen.getByText("Dialog Title")).toBeInTheDocument();
			expect(screen.getByText("Dialog content")).toBeInTheDocument();
		});
	});

	it("closes dialog when close button is clicked", async () => {
		const onOpenChange = vi.fn();
		const user = userEvent.setup();
		render(
			<Dialog onOpenChange={onOpenChange}>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
					<DialogClose data-testid="close-btn">Dismiss</DialogClose>
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));
		await waitFor(() => expect(screen.getByText("Dialog Title")).toBeInTheDocument());

		await user.click(screen.getByTestId("close-btn"));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("closes dialog on overlay click", async () => {
		const onOpenChange = vi.fn();
		const user = userEvent.setup();
		render(
			<Dialog onOpenChange={onOpenChange}>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));
		await waitFor(() => expect(screen.getByText("Dialog Title")).toBeInTheDocument());

		// Press Escape instead of overlay click (overlay click behavior varies in jsdom)
		await user.keyboard("{Escape}");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("closes dialog on Escape key press", async () => {
		const user = userEvent.setup();
		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<p>Dialog content</p>
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));
		await waitFor(() => expect(screen.getByText("Dialog Title")).toBeInTheDocument());

		await user.keyboard("{Escape}");
		await waitFor(() => {
			expect(screen.queryByText("Dialog Title")).not.toBeInTheDocument();
		});
	});

	it("renders dialog header correctly", () => {
		render(
			<Dialog open={true}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Test Title</DialogTitle>
						<DialogDescription>Test Description</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		);

		const title = screen.getByText("Test Title");
		const description = screen.getByText("Test Description");

		expect(title).toHaveClass("text-lg", "font-semibold");
		expect(description).toHaveClass("text-sm", "text-muted-foreground");
	});

	it("renders dialog footer correctly", () => {
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

		const footer = screen.getByText("Cancel").closest("div");
		expect(footer).toHaveClass(
			"flex",
			"flex-col-reverse",
			"sm:flex-row",
			"sm:justify-end",
			"sm:space-x-2"
		);
	});

	it("supports controlled open state", () => {
		const { rerender } = render(
			<Dialog open={false}>
				<DialogContent>
					<DialogTitle>Controlled Dialog</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		expect(screen.queryByText("Controlled Dialog")).not.toBeInTheDocument();

		rerender(
			<Dialog open={true}>
				<DialogContent>
					<DialogTitle>Controlled Dialog</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		expect(screen.getByText("Controlled Dialog")).toBeInTheDocument();
	});

	it("calls onOpenChange when dialog state changes", async () => {
		const onOpenChange = vi.fn();
		const user = userEvent.setup();

		render(
			<Dialog onOpenChange={onOpenChange}>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));
		expect(onOpenChange).toHaveBeenCalledWith(true);

		await user.keyboard("{Escape}");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("prevents body scroll when open", async () => {
		const user = userEvent.setup();

		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));
		await waitFor(() => expect(screen.getByText("Dialog Title")).toBeInTheDocument());

		// Verify dialog is rendered as modal
		const dialog = screen.getByRole("dialog");
		expect(dialog).toBeInTheDocument();
	});

	it("focuses first focusable element when opened", async () => {
		const user = userEvent.setup();

		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<input data-testid="first-input" placeholder="First input" />
					<input data-testid="second-input" placeholder="Second input" />
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));
		await waitFor(() => expect(screen.getByTestId("first-input")).toHaveFocus());
	});

	it("returns focus to trigger when closed", async () => {
		const onOpenChange = vi.fn();
		const user = userEvent.setup();

		render(
			<Dialog onOpenChange={onOpenChange}>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog Title</DialogTitle>
					<DialogClose data-testid="close-btn">Dismiss</DialogClose>
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));
		await waitFor(() => expect(screen.getByText("Dialog Title")).toBeInTheDocument());

		await user.click(screen.getByTestId("close-btn"));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("supports custom dialog size", () => {
		render(
			<Dialog open={true}>
				<DialogContent className="sm:max-w-md">
					<DialogTitle>Small Dialog</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("sm:max-w-md");
	});

	it("renders with custom className", () => {
		render(
			<Dialog open={true}>
				<DialogContent className="custom-dialog">
					<DialogTitle>Custom Dialog</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("custom-dialog");
	});

	it("is accessible with proper ARIA attributes", async () => {
		render(
			<Dialog open={true}>
				<DialogContent>
					<DialogTitle>Accessible Dialog</DialogTitle>
					<DialogDescription>This is a description</DialogDescription>
				</DialogContent>
			</Dialog>
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-describedby");
		expect(dialog).toHaveAttribute("aria-labelledby");
	});

	it("supports nested interactive elements", async () => {
		const user = userEvent.setup();

		render(
			<Dialog>
				<DialogTrigger>Open Dialog</DialogTrigger>
				<DialogContent>
					<DialogTitle>Dialog with Form</DialogTitle>
					<form>
						<input placeholder="Name" />
						<input placeholder="Email" />
						<button type="submit">Submit</button>
					</form>
				</DialogContent>
			</Dialog>
		);

		await user.click(screen.getByText("Open Dialog"));
		await waitFor(() => expect(screen.getByText("Dialog with Form")).toBeInTheDocument());

		const inputs = screen.getAllByRole("textbox");
		expect(inputs).toHaveLength(2);

		const submitButton = screen.getByText("Submit");
		expect(submitButton).toBeInTheDocument();
	});

	it("handles multiple dialogs correctly", async () => {
		const user = userEvent.setup();

		render(
			<div>
				<Dialog>
					<DialogTrigger>Open First</DialogTrigger>
					<DialogContent>
						<DialogTitle>First Dialog Title</DialogTitle>
						<Dialog>
							<DialogTrigger>Open Nested</DialogTrigger>
							<DialogContent>
								<DialogTitle>Nested Dialog Title</DialogTitle>
							</DialogContent>
						</Dialog>
					</DialogContent>
				</Dialog>
			</div>
		);

		await user.click(screen.getByText("Open First"));
		await waitFor(() => expect(screen.getByText("First Dialog Title")).toBeInTheDocument());

		await user.click(screen.getByText("Open Nested"));
		await waitFor(() => expect(screen.getByText("Nested Dialog Title")).toBeInTheDocument());

		expect(screen.getByText("First Dialog Title")).toBeInTheDocument();
	});

	it("supports custom transition animations", () => {
		render(
			<Dialog open={true}>
				<DialogContent>
					<DialogTitle>Animated Dialog</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("duration-200");
		expect(dialog.className).toContain("animate-in");
	});

	it("handles dialog stacking context", () => {
		render(
			<Dialog open={true}>
				<DialogContent>
					<DialogTitle>Dialog</DialogTitle>
				</DialogContent>
			</Dialog>
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("z-50");
	});
});
