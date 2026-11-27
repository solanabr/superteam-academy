// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PlatformError from "../error";

const captureException = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

describe("(platform) error boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("reports to Sentry with the surface tag", () => {
    const error = new Error("render crash");

    render(<PlatformError error={error} reset={() => {}} />);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(error, {
      tags: { surface: "platform" },
    });
  });

  it("tags the digest so a client report can be matched to the server one", () => {
    const error = Object.assign(new Error("server render"), {
      digest: "1234567",
    });

    render(<PlatformError error={error} reset={() => {}} />);

    expect(captureException).toHaveBeenCalledWith(error, {
      tags: { surface: "platform", error_digest: "1234567" },
    });
  });

  it("reports once per error across re-renders, and still renders the fallback", () => {
    const error = new Error("render crash");

    const { rerender } = render(
      <PlatformError error={error} reset={() => {}} />
    );
    rerender(<PlatformError error={error} reset={() => {}} />);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "tryAgain" })).toBeTruthy();
  });
});
