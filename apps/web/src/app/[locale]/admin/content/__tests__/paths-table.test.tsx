// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { PathsTable } from "../paths-table";
import type { AdminLearningPathWithRefs } from "@/lib/content/queries";
import messages from "@/messages/en.json";

// Real ICU-aware translator (supports the `danglingCount` plural rule),
// rather than a raw key lookup — `next-intl/server`'s `getTranslations` needs
// a request context this test environment doesn't have.
vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) =>
    createTranslator({ locale: "en", messages, namespace }),
}));

async function renderTable(paths: AdminLearningPathWithRefs[]) {
  return render(await PathsTable({ paths }));
}

describe("PathsTable", () => {
  it("renders the resolved course sequence for a healthy path", async () => {
    await renderTable([
      {
        _id: "path-main",
        title: "Main Path",
        courseIds: ["course-a", "course-b"],
        resolvedCourses: [
          { _id: "course-a", title: "Course A", slug: "a" },
          { _id: "course-b", title: "Course B", slug: "b" },
        ],
        danglingCourseIds: [],
      },
    ]);

    expect(screen.getByText("Main Path")).toBeInTheDocument();
    expect(screen.getByText("Course A")).toBeInTheDocument();
    expect(screen.getByText("Course B")).toBeInTheDocument();
    expect(screen.queryByText("missing")).not.toBeInTheDocument();
  });

  it("loudly flags a dangling course ref instead of dropping it", async () => {
    await renderTable([
      {
        _id: "path-broken",
        title: "Broken Path",
        courseIds: ["course-a", "course-ghost"],
        resolvedCourses: [{ _id: "course-a", title: "Course A", slug: "a" }],
        danglingCourseIds: ["course-ghost"],
      },
    ]);

    // The healthy ref still renders normally.
    expect(screen.getByText("Course A")).toBeInTheDocument();
    // The dangling ref is visible — the raw id, not silently dropped.
    expect(screen.getByText("missing: course-ghost")).toBeInTheDocument();
    // A visible count summarizes the breakage.
    expect(screen.getByText("1 dangling course reference")).toBeInTheDocument();
  });

  it("pluralizes the dangling count for multiple broken refs", async () => {
    await renderTable([
      {
        _id: "path-broken",
        title: "Broken Path",
        courseIds: ["ghost-1", "ghost-2"],
        resolvedCourses: [],
        danglingCourseIds: ["ghost-1", "ghost-2"],
      },
    ]);

    expect(
      screen.getByText("2 dangling course references")
    ).toBeInTheDocument();
  });

  it("shows the no-courses copy for a path with no refs at all", async () => {
    await renderTable([
      {
        _id: "path-empty",
        title: "Empty Path",
        courseIds: [],
        resolvedCourses: [],
        danglingCourseIds: [],
      },
    ]);

    expect(screen.getByText("No courses in this path.")).toBeInTheDocument();
  });

  it("shows the bundle-empty copy when there are no paths", async () => {
    await renderTable([]);
    expect(
      screen.getByText("No learning paths in the content bundle.")
    ).toBeInTheDocument();
  });
});
