import { describe, it, expect } from "vitest";
import { render, screen } from "@superteam-academy/testing";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@superteam-academy/ui";

describe("Card Component", () => {
	it("should render with default props", () => {
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

	it("should support custom className", () => {
		render(<Card className="custom-card">Content</Card>);

		const card = screen.getByText("Content");
		expect(card).toHaveClass("custom-card");
	});

	it("should forward ref correctly", () => {
		const ref = { current: null };
		render(<Card ref={ref}>Content</Card>);

		expect(ref.current).toBeInstanceOf(HTMLDivElement);
	});

	it("should support additional HTML attributes", () => {
		render(<Card data-testid="custom-card">Content</Card>);

		const card = screen.getByTestId("custom-card");
		expect(card).toBeInTheDocument();
	});
});

describe("CardHeader Component", () => {
	it("should render with default props", () => {
		render(<CardHeader>Header content</CardHeader>);

		const header = screen.getByText("Header content");
		expect(header).toBeInTheDocument();
		expect(header).toHaveClass("flex", "flex-col", "space-y-1.5", "p-6");
	});

	it("should support custom className", () => {
		render(<CardHeader className="custom-header">Header</CardHeader>);

		const header = screen.getByText("Header");
		expect(header).toHaveClass("custom-header");
	});
});

describe("CardTitle Component", () => {
	it("should render as h3 with correct styling", () => {
		render(<CardTitle>Card Title</CardTitle>);

		const title = screen.getByRole("heading", { level: 3 });
		expect(title).toBeInTheDocument();
		expect(title).toHaveTextContent("Card Title");
		expect(title).toHaveClass("text-2xl", "font-semibold", "leading-none", "tracking-tight");
	});

	it("should support custom className", () => {
		render(<CardTitle className="custom-title">Title</CardTitle>);

		const title = screen.getByRole("heading", { level: 3 });
		expect(title).toHaveClass("custom-title");
	});
});

describe("CardDescription Component", () => {
	it("should render with correct styling", () => {
		render(<CardDescription>Description text</CardDescription>);

		const description = screen.getByText("Description text");
		expect(description).toBeInTheDocument();
		expect(description).toHaveClass("text-sm", "text-muted-foreground");
	});

	it("should support custom className", () => {
		render(<CardDescription className="custom-desc">Description</CardDescription>);

		const description = screen.getByText("Description");
		expect(description).toHaveClass("custom-desc");
	});
});

describe("CardContent Component", () => {
	it("should render with default props", () => {
		render(<CardContent>Content text</CardContent>);

		const content = screen.getByText("Content text");
		expect(content).toBeInTheDocument();
		expect(content).toHaveClass("p-6", "pt-0");
	});

	it("should support custom className", () => {
		render(<CardContent className="custom-content">Content</CardContent>);

		const content = screen.getByText("Content");
		expect(content).toHaveClass("custom-content");
	});
});

describe("CardFooter Component", () => {
	it("should render with default props", () => {
		render(<CardFooter>Footer content</CardFooter>);

		const footer = screen.getByText("Footer content");
		expect(footer).toBeInTheDocument();
		expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
	});

	it("should support custom className", () => {
		render(<CardFooter className="custom-footer">Footer</CardFooter>);

		const footer = screen.getByText("Footer");
		expect(footer).toHaveClass("custom-footer");
	});
});

describe("Card Composition", () => {
	it("should render a complete card with all components", () => {
		render(
			<Card>
				<CardHeader>
					<CardTitle>Complete Card</CardTitle>
					<CardDescription>This is a complete card example</CardDescription>
				</CardHeader>
				<CardContent>
					<p>Main content goes here</p>
				</CardContent>
				<CardFooter>
					<button type="button">Action Button</button>
				</CardFooter>
			</Card>
		);

		expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Complete Card");
		expect(screen.getByText("This is a complete card example")).toBeInTheDocument();
		expect(screen.getByText("Main content goes here")).toBeInTheDocument();
		expect(screen.getByRole("button")).toHaveTextContent("Action Button");
	});

	it("should render card with only content", () => {
		render(
			<Card>
				<CardContent>Simple content</CardContent>
			</Card>
		);

		expect(screen.getByText("Simple content")).toBeInTheDocument();
	});

	it("should render card with header and content only", () => {
		render(
			<Card>
				<CardHeader>
					<CardTitle>Title Only</CardTitle>
				</CardHeader>
				<CardContent>Content only</CardContent>
			</Card>
		);

		expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Title Only");
		expect(screen.getByText("Content only")).toBeInTheDocument();
	});
});
