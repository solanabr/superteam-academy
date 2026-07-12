// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminPage from "../page";
import AdminPublishRedirect from "../publish/page";
import AdminDeployRedirect from "../deploy/page";

/**
 * Routing contract of the merged Courses screen:
 *   - `/admin` (valid session) lands on `/admin/courses` (was `/admin/status`)
 *   - `/admin/publish` and `/admin/deploy` — the two screens Courses replaced —
 *     stay alive as redirects so bookmarks and muscle memory don't 404.
 * The redirect target is locale-prefixed, so a `pt-BR` admin stays in `pt-BR`.
 */

const { redirectMock, isValidAdminSessionMock, cookieGetMock } = vi.hoisted(
  () => ({
    redirectMock: vi.fn<(url: string) => never>(),
    isValidAdminSessionMock: vi.fn<() => boolean>(),
    cookieGetMock: vi.fn<() => { value: string } | undefined>(),
  })
);

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGetMock }),
}));
vi.mock("@/lib/admin/auth", () => ({
  isValidAdminSession: isValidAdminSessionMock,
}));
vi.mock("../admin-login-form", () => ({
  AdminLoginForm: () => <div data-testid="admin-login-form" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  cookieGetMock.mockReturnValue({ value: "signed-session" });
  isValidAdminSessionMock.mockReturnValue(true);
});

describe("/admin default landing", () => {
  it("sends an authenticated admin to the Courses screen", async () => {
    await AdminPage({ params: { locale: "en" } });
    expect(redirectMock).toHaveBeenCalledWith("/en/admin/courses");
  });

  it("keeps the locale prefix on the landing redirect", async () => {
    await AdminPage({ params: { locale: "pt-BR" } });
    expect(redirectMock).toHaveBeenCalledWith("/pt-BR/admin/courses");
  });

  it("still renders the login form (and never redirects) without a session", async () => {
    isValidAdminSessionMock.mockReturnValue(false);
    cookieGetMock.mockReturnValue(undefined);

    render(
      (await AdminPage({ params: { locale: "en" } })) as React.ReactElement
    );

    expect(screen.getByTestId("admin-login-form")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("retired admin routes", () => {
  it("redirects /admin/publish to /admin/courses", () => {
    AdminPublishRedirect({ params: { locale: "en" } });
    expect(redirectMock).toHaveBeenCalledWith("/en/admin/courses");
  });

  it("redirects /admin/deploy to /admin/courses", () => {
    AdminDeployRedirect({ params: { locale: "es" } });
    expect(redirectMock).toHaveBeenCalledWith("/es/admin/courses");
  });
});
