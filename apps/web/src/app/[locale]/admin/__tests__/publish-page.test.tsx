// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminPublishPage from "../publish/page";
import messages from "@/messages/en.json";

// Render smoke only — ContentSyncPanel carries its own tests and fetches on
// mount, so it is stubbed out here.
vi.mock("@/components/admin/content-sync-panel", () => ({
  ContentSyncPanel: () => <div data-testid="content-sync-panel" />,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => (key: string) => {
    const path = `${namespace}.${key}`.split(".");
    let node: unknown = messages;
    for (const segment of path) {
      node = (node as Record<string, unknown>)[segment];
    }
    return node as string;
  },
}));

describe("AdminPublishPage (smoke)", () => {
  it("renders the i18n'd screen title and the content-sync panel", async () => {
    render(await AdminPublishPage());
    expect(
      screen.getByRole("heading", { name: messages.admin.screens.publish })
    ).toBeInTheDocument();
    expect(screen.getByTestId("content-sync-panel")).toBeInTheDocument();
  });
});
