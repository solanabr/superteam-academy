/* eslint-disable @next/next/no-html-link-for-pages */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../shared/empty-state";
import { BookOpen } from "lucide-react";

// ---------------------------------------------------------------------------
// EmptyState component — the shared component used for all empty state UIs
// ---------------------------------------------------------------------------

describe("EmptyState — rendering", () => {
  it("renders the title", () => {
    render(<EmptyState title="No courses yet" />);
    expect(screen.getByText("No courses yet")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(<EmptyState title="No courses" description="Explore the catalog to get started" />);
    expect(screen.getByText("Explore the catalog to get started")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);
    const p = container.querySelector("p.text-muted-foreground");
    expect(p).toBeNull();
  });

  it("renders the action node when provided", () => {
    render(
      <EmptyState
        title="Empty"
        action={<button>Start Now</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Start Now" })).toBeInTheDocument();
  });

  it("does not render action area when action is not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the icon when provided", () => {
    const { container } = render(<EmptyState title="Empty" icon={BookOpen} />);
    const iconWrapper = container.querySelector(".rounded-full");
    expect(iconWrapper).not.toBeNull();
  });

  it("does not render icon wrapper when icon is not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);
    const iconWrapper = container.querySelector(".rounded-full");
    expect(iconWrapper).toBeNull();
  });

  it("renders title as h3", () => {
    render(<EmptyState title="No data" />);
    const heading = screen.getByRole("heading", { level: 3, name: "No data" });
    expect(heading).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Dashboard empty state scenario
// ---------------------------------------------------------------------------

describe("EmptyState — dashboard with no courses scenario", () => {
  it("shows correct title for empty dashboard", () => {
    render(
      <EmptyState
        title="Start your learning journey"
        description="You are not enrolled in any courses yet."
        action={<a href="/courses">Explore courses</a>}
      />
    );
    expect(screen.getByText("Start your learning journey")).toBeInTheDocument();
    expect(screen.getByText("You are not enrolled in any courses yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore courses" })).toBeInTheDocument();
  });

  it("link in action node has correct href", () => {
    render(
      <EmptyState
        title="No courses"
        action={<a href="/courses">Browse courses</a>}
      />
    );
    const link = screen.getByRole("link", { name: "Browse courses" });
    expect(link).toHaveAttribute("href", "/courses");
  });
});

// ---------------------------------------------------------------------------
// Leaderboard empty state scenario
// ---------------------------------------------------------------------------

describe("EmptyState — leaderboard with no entries scenario", () => {
  it("shows correct text for empty leaderboard", () => {
    render(
      <EmptyState
        title="No data available yet"
        description="Be the first on the leaderboard!"
      />
    );
    expect(screen.getByText("No data available yet")).toBeInTheDocument();
    expect(screen.getByText("Be the first on the leaderboard!")).toBeInTheDocument();
  });

  it("renders without action when no action provided", () => {
    render(<EmptyState title="No entries" description="Earn XP to appear here" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// CourseGrid empty state scenario
// ---------------------------------------------------------------------------

describe("EmptyState — CourseGrid with no courses scenario", () => {
  it("shows no-results title for course grid", () => {
    render(
      <EmptyState
        title="No courses match your filters."
        description="Try adjusting your search or filters"
        action={<button type="button">Clear filters</button>}
      />
    );
    expect(screen.getByText("No courses match your filters.")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search or filters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("shows coming soon text for completely empty catalog", () => {
    render(
      <EmptyState
        title="Courses coming soon!"
        description="We're preparing amazing Solana content for you."
      />
    );
    expect(screen.getByText("Courses coming soon!")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Profile empty state scenario
// ---------------------------------------------------------------------------

describe("EmptyState — profile with no achievements scenario", () => {
  it("shows no credentials text", () => {
    render(
      <EmptyState
        title="No credentials yet"
        description="Complete a course to earn your first one!"
      />
    );
    expect(screen.getByText("No credentials yet")).toBeInTheDocument();
    expect(screen.getByText("Complete a course to earn your first one!")).toBeInTheDocument();
  });

  it("shows no badges text without icon", () => {
    render(
      <EmptyState
        title="No badges yet"
        description="Complete courses to earn NFT credentials."
      />
    );
    const heading = screen.getByRole("heading", { name: "No badges yet" });
    expect(heading).toBeInTheDocument();
  });

  it("renders sign-in required text with action", () => {
    render(
      <EmptyState
        title="Sign in to view your profile"
        description="Create a free account or sign in to access your profile."
        action={<button>Sign In</button>}
      />
    );
    expect(screen.getByText("Sign in to view your profile")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });
});
