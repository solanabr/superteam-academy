import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminPage from "../page";
import AdminPublishRedirect from "../publish/page";
import AdminDeployRedirect from "../deploy/page";

/**
 * Routing contract of the session-based admin console:
 *   - `/admin` (allowlisted session) lands on `/admin/courses`
 *   - a signed-in NON-admin gets a 404 (notFound), never a redirect — the
 *     panel's existence is not revealed (anonymous visitors are bounced to the
 *     landing by the middleware before this page runs)
 *   - `/admin/publish` and `/admin/deploy` — the two screens Courses replaced —
 *     stay alive as redirects so bookmarks and muscle memory don't 404.
 * The redirect target is locale-prefixed, so a `pt-BR` admin stays in `pt-BR`.
 */

const { redirectMock, notFoundMock, requireAdminMock } = vi.hoisted(() => ({
  redirectMock: vi.fn<(url: string) => never>(),
  notFoundMock: vi.fn<() => never>(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  requireAdminMock: vi.fn<() => Promise<{ userId: string } | null>>(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));
vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: requireAdminMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ userId: "admin-1" });
});

describe("/admin default landing", () => {
  it("sends an allowlisted admin to the Courses screen", async () => {
    await AdminPage({ params: Promise.resolve({ locale: "en" }) });
    expect(redirectMock).toHaveBeenCalledWith("/en/admin/courses");
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("keeps the locale prefix on the landing redirect", async () => {
    await AdminPage({ params: Promise.resolve({ locale: "pt-BR" }) });
    expect(redirectMock).toHaveBeenCalledWith("/pt-BR/admin/courses");
  });

  it("404s a signed-in non-admin and never redirects (panel not revealed)", async () => {
    requireAdminMock.mockResolvedValue(null);

    await expect(
      AdminPage({ params: Promise.resolve({ locale: "en" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("retired admin routes", () => {
  it("redirects /admin/publish to /admin/courses", async () => {
    await AdminPublishRedirect({ params: Promise.resolve({ locale: "en" }) });
    expect(redirectMock).toHaveBeenCalledWith("/en/admin/courses");
  });

  it("redirects /admin/deploy to /admin/courses", async () => {
    await AdminDeployRedirect({ params: Promise.resolve({ locale: "es" }) });
    expect(redirectMock).toHaveBeenCalledWith("/es/admin/courses");
  });
});
