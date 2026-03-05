import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

process.env.SKIP_ENV_VALIDATION = "1";

const getServerSessionMock = vi.fn();
const enrollInCourseMock = vi.fn();
const verifyEnrollmentAccountExistsMock = vi.fn();

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  userWallet: {
    findFirst: vi.fn(),
  },
};

vi.mock("next-auth/next", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/auth/config", () => ({
  authOptions: {},
}));

vi.mock("@/lib/services/progress-factory", () => ({
  getProgressService: () => ({
    enrollInCourse: enrollInCourseMock,
  }),
}));

vi.mock("@/lib/progress/onchain-sync", () => ({
  verifyEnrollmentAccountExists: verifyEnrollmentAccountExistsMock,
}));

vi.mock("@/lib/db/client", () => ({
  prisma: prismaMock,
}));

describe("POST /api/progress/enroll-existing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrollInCourseMock.mockResolvedValue(undefined);
    verifyEnrollmentAccountExistsMock.mockResolvedValue({ ok: true });
    prismaMock.user.findUnique.mockResolvedValue({
      walletAddress: "11111111111111111111111111111111",
    });
    prismaMock.userWallet.findFirst.mockResolvedValue(null);
  });

  it("requires an authenticated session", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/progress/enroll-existing/route");
    const response = await POST(
      new NextRequest("http://localhost/api/progress/enroll-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: "solana-fundamentals",
          courseId: "solana-fundamentals",
          walletAddress: "11111111111111111111111111111111",
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("rejects when wallet is not linked to the authenticated user", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUnique.mockResolvedValue({
      walletAddress: "22222222222222222222222222222222",
    });
    prismaMock.userWallet.findFirst.mockResolvedValue(null);

    const { POST } = await import("@/app/api/progress/enroll-existing/route");
    const response = await POST(
      new NextRequest("http://localhost/api/progress/enroll-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: "solana-fundamentals",
          courseId: "solana-fundamentals",
          walletAddress: "11111111111111111111111111111111",
        }),
      })
    );

    expect(response.status).toBe(403);
    expect(enrollInCourseMock).not.toHaveBeenCalled();
  });

  it("rejects when enrollment PDA does not exist on-chain", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    verifyEnrollmentAccountExistsMock.mockResolvedValue({
      ok: false,
      error: "Enrollment account does not exist on devnet",
    });

    const { POST } = await import("@/app/api/progress/enroll-existing/route");
    const response = await POST(
      new NextRequest("http://localhost/api/progress/enroll-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: "solana-fundamentals",
          courseId: "solana-fundamentals",
          walletAddress: "11111111111111111111111111111111",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(enrollInCourseMock).not.toHaveBeenCalled();
  });

  it("syncs progress when enrollment already exists on-chain", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/progress/enroll-existing/route");
    const response = await POST(
      new NextRequest("http://localhost/api/progress/enroll-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: "solana-fundamentals",
          courseId: "solana-fundamentals",
          walletAddress: "11111111111111111111111111111111",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(verifyEnrollmentAccountExistsMock).toHaveBeenCalledWith({
      courseId: "solana-fundamentals",
      walletAddress: "11111111111111111111111111111111",
    });
    expect(enrollInCourseMock).toHaveBeenCalledWith("user-1", "solana-fundamentals");
  });
});
