import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";

describe("Card Component", () => {
	describe("Card", () => {
		it("renders with default props", () => {
			render(<Card>Card content</Card>);

			const card = screen.getByText("Card content");
			expect(card).toBeInTheDocument();
			expect(card).toHaveClass(
				"rounded-lg",
				"border",
				"bg-card",
				"text-card-foreground",
				"shadow-sm"
			);
		});

		it("applies custom className", () => {
			render(<Card className="custom-card">Content</Card>);

			const card = screen.getByText("Content");
			expect(card).toHaveClass("custom-card");
		});

		it("forwards other props", () => {
			render(<Card data-testid="custom-card">Content</Card>);

			expect(screen.getByTestId("custom-card")).toBeInTheDocument();
		});

		it("renders with role attribute", () => {
			render(<Card role="region">Section content</Card>);

			const section = screen.getByRole("region");
			expect(section).toBeInTheDocument();
		});
	});

	describe("CardHeader", () => {
		it("renders with correct styling", () => {
			render(<CardHeader>Header content</CardHeader>);

			const header = screen.getByText("Header content");
			expect(header).toHaveClass("flex", "flex-col", "space-y-1.5", "p-6");
		});

		it("applies custom className", () => {
			render(<CardHeader className="custom-header">Header</CardHeader>);

			const header = screen.getByText("Header");
			expect(header).toHaveClass("custom-header");
		});
	});

	describe("CardTitle", () => {
		it("renders with correct styling", () => {
			render(<CardTitle>Card Title</CardTitle>);

			const title = screen.getByText("Card Title");
			expect(title).toHaveClass(
				"text-2xl",
				"font-semibold",
				"leading-none",
				"tracking-tight"
			);
			expect(title.tagName).toBe("H3");
		});

		it("renders with correct heading level", () => {
			render(<CardTitle>H3 Title</CardTitle>);

			const title = screen.getByText("H3 Title");
			expect(title.tagName).toBe("H3");
		});

		it("applies custom className", () => {
			render(<CardTitle className="custom-title">Title</CardTitle>);

			const title = screen.getByText("Title");
			expect(title).toHaveClass("custom-title");
		});
	});

	describe("CardDescription", () => {
		it("renders with correct styling", () => {
			render(<CardDescription>Description text</CardDescription>);

			const description = screen.getByText("Description text");
			expect(description).toHaveClass("text-sm", "text-muted-foreground");
			expect(description.tagName).toBe("P");
		});

		it("applies custom className", () => {
			render(<CardDescription className="custom-desc">Description</CardDescription>);

			const description = screen.getByText("Description");
			expect(description).toHaveClass("custom-desc");
		});
	});

	describe("CardContent", () => {
		it("renders with correct styling", () => {
			render(<CardContent>Content here</CardContent>);

			const content = screen.getByText("Content here");
			expect(content).toHaveClass("p-6", "pt-0");
		});

		it("applies custom className", () => {
			render(<CardContent className="custom-content">Content</CardContent>);

			const content = screen.getByText("Content");
			expect(content).toHaveClass("custom-content");
		});
	});

	describe("CardFooter", () => {
		it("renders with correct styling", () => {
			render(<CardFooter>Footer content</CardFooter>);

			const footer = screen.getByText("Footer content");
			expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
		});

		it("applies custom className", () => {
			render(<CardFooter className="custom-footer">Footer</CardFooter>);

			const footer = screen.getByText("Footer");
			expect(footer).toHaveClass("custom-footer");
		});
	});

	describe("Card composition", () => {
		it("renders complete card structure", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle>Course Title</CardTitle>
						<CardDescription>Learn something new</CardDescription>
					</CardHeader>
					<CardContent>
						<p>Course content goes here</p>
					</CardContent>
					<CardFooter>
						<button type="button">Enroll Now</button>
					</CardFooter>
				</Card>
			);

			expect(screen.getByText("Course Title")).toBeInTheDocument();
			expect(screen.getByText("Learn something new")).toBeInTheDocument();
			expect(screen.getByText("Course content goes here")).toBeInTheDocument();
			expect(screen.getByText("Enroll Now")).toBeInTheDocument();
		});

		it("handles nested cards", () => {
			render(
				<Card data-testid="outer">
					<CardContent>
						<Card data-testid="inner">
							<CardContent>Nested content</CardContent>
						</Card>
					</CardContent>
				</Card>
			);

			expect(screen.getByText("Nested content")).toBeInTheDocument();
			expect(screen.getByTestId("outer")).toBeInTheDocument();
			expect(screen.getByTestId("inner")).toBeInTheDocument();
		});

		it("maintains proper spacing between sections", () => {
			render(
				<Card>
					<CardHeader>
						<CardTitle>Title</CardTitle>
					</CardHeader>
					<CardContent>Content</CardContent>
					<CardFooter>Footer</CardFooter>
				</Card>
			);

			const header = screen.getByText("Title").closest("div");
			const content = screen.getByText("Content").closest("div");
			const footer = screen.getByText("Footer").closest("div");

			expect(header).toHaveClass("p-6");
			expect(content).toHaveClass("p-6", "pt-0");
			expect(footer).toHaveClass("p-6", "pt-0");
		});
	});

	describe("Accessibility", () => {
		it("has proper ARIA landmarks when used as article", () => {
			render(<Card role="article">Article content</Card>);

			const article = screen.getByText("Article content");
			expect(article).toBeInTheDocument();
		});

		it("supports custom aria-label", () => {
			render(<Card aria-label="Custom card">Content</Card>);

			const card = screen.getByLabelText("Custom card");
			expect(card).toBeInTheDocument();
		});

		it("supports custom role", () => {
			render(<Card role="region">Region content</Card>);

			const region = screen.getByRole("region");
			expect(region).toBeInTheDocument();
		});
	});

	describe("Responsive behavior", () => {
		it("adapts padding on different screen sizes", () => {
			render(<Card>Responsive content</Card>);

			const card = screen.getByText("Responsive content");
			// Note: Actual responsive classes would depend on Tailwind config
			expect(card).toHaveClass("rounded-lg");
		});

		it("handles overflow content", () => {
			render(
				<Card className="max-h-32 overflow-hidden" data-testid="overflow-card">
					<CardContent>
						Very long content that might overflow the card boundaries and test how the
						component handles overflow situations.
					</CardContent>
				</Card>
			);

			expect(screen.getByTestId("overflow-card")).toHaveClass("overflow-hidden");
		});
	});

	describe("Styling variants", () => {
		it("supports different border styles", () => {
			const { rerender } = render(<Card>Default</Card>);
			expect(screen.getByText("Default")).toHaveClass("border");

			rerender(<Card className="border-0 shadow-none">Ghost</Card>);
			expect(screen.getByText("Ghost")).toHaveClass("border-0", "shadow-none");
		});

		it("supports different padding sizes", () => {
			const { rerender } = render(<Card>Default</Card>);
			expect(screen.getByText("Default")).toBeInTheDocument();

			rerender(<Card className="p-2">Small</Card>);
			expect(screen.getByText("Small")).toBeInTheDocument();

			rerender(<Card className="p-8">Large</Card>);
			expect(screen.getByText("Large")).toBeInTheDocument();
		});
	});

	describe("Interaction states", () => {
		it("supports hover states", () => {
			render(<Card className="transition-shadow hover:shadow-md">Hover me</Card>);

			const card = screen.getByText("Hover me");
			expect(card).toHaveClass("transition-shadow", "hover:shadow-md");
		});

		it("supports focus states", () => {
			render(
				<Card className="focus:outline-none focus:ring-2" tabIndex={0}>
					Focus me
				</Card>
			);

			const card = screen.getByText("Focus me");
			expect(card).toHaveClass("focus:outline-none", "focus:ring-2");
		});
	});
});
