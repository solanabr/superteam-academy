// @vitest-environment jsdom
// #875: the catalog states the JS prerequisite plainly and carries the
// segment-3 refer-out. The catalog spec's audience scope is explicit — every
// course gates on working JavaScript, segment 3 is out of scope for this wave,
// and marketing copy must not imply otherwise.
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { CourseCatalogClient } from "../courses-client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getSession: async () => ({ data: { session: null } }) },
  }),
}));
vi.mock("@/components/course/paths-view", () => ({
  PathsView: () => <div />,
}));
// The intake segment/goal come from the auth-scoped store; irrelevant here.
vi.mock("@/lib/onboarding/use-segment-state", () => ({
  useSegmentState: () => ({ segment: undefined, goal: undefined }),
}));

function renderCatalog(): ReturnType<typeof render> {
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <CourseCatalogClient courses={[]} learningPaths={[]} />
    </NextIntlClientProvider>
  );
  return render(ui);
}

describe("CourseCatalogClient — prerequisite + refer-out", () => {
  it("states the JavaScript prerequisite in a labelled region", () => {
    renderCatalog();
    const region = screen.getByRole("region", {
      name: messages.courses.prereqTitle,
    });
    expect(region).toBeInTheDocument();
    expect(screen.getByText(messages.courses.prereqBody)).toBeInTheDocument();
  });

  it("points a from-scratch learner at freeCodeCamp with an external link", () => {
    renderCatalog();
    const link = screen.getByRole("link", {
      name: new RegExp(messages.courses.prereqFccLink),
    });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("freecodecamp.org")
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
