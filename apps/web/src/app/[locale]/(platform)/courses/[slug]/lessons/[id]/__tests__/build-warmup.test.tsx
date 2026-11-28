// @vitest-environment jsdom
// The lesson page asks the build server to start while the learner reads, but
// only where a build can follow: a signed-in learner on a lesson with a
// buildable code block.
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Lesson } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { LessonPageClient } from "../lesson-client";

const h = vi.hoisted(() => ({
  auth: {
    userId: "user-1" as string | null,
    profile: { wallet_address: "wallet" } as { wallet_address: string } | null,
    isLoading: false,
  },
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/auth/auth-provider", () => ({ useAuth: () => h.auth }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { id: "e" } }),
            eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/hooks/use-on-chain-enroll", () => ({
  useOnChainEnroll: () => ({
    isEnrolling: false,
    handleEnroll: () => {},
    enrollError: null,
    reauthPrompt: null,
    isWalletResolving: false,
  }),
}));
vi.mock("@/components/community/thread-list", () => ({
  ThreadList: () => null,
}));
vi.mock("@/components/community/thread-composer", () => ({
  ThreadComposer: () => null,
}));
vi.mock("@/components/auth/auth-modal", () => ({ AuthModal: () => null }));
vi.mock("@/components/wallet/linked-wallet-prompt", () => ({
  LinkedWalletPrompt: () => null,
}));
vi.mock("@/components/editor/challenge-interface", () => ({
  ChallengeInterface: () => <div data-testid="editor" />,
}));
vi.mock("@/components/deploy/deploy-panel", () => ({
  DeployPanel: () => null,
}));

function lessonWith(buildType: "standard" | "buildable"): Lesson {
  return {
    _id: "lesson-1",
    title: "First build",
    slug: "first-build",
    blocks: [
      {
        _type: "code",
        key: "only",
        language: buildType === "buildable" ? "rust" : "typescript",
        buildType,
        deployable: false,
        starter: "// starter",
        tests: [],
        hints: [],
      },
    ],
  } as unknown as Lesson;
}

const fetchMock = vi.fn<typeof fetch>();

function warmCalls() {
  return fetchMock.mock.calls.filter(
    ([url]) => url === "/api/build-program/warm"
  );
}

async function viewLesson(lesson: Lesson) {
  const result = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LessonPageClient
        lesson={lesson}
        allLessons={[
          { _id: "lesson-1", title: "L", slug: lesson.slug } as never,
        ]}
        locale="en"
        courseSlug="anchor-101"
        courseId="course-1"
        courseXpPerLesson={30}
      />
    </NextIntlClientProvider>
  );
  await act(async () => {
    await vi.runAllTimersAsync();
  });
  return result;
}

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  window.localStorage.clear();
  h.auth.userId = "user-1";
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response('{"status":"ready"}'));
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
  class MockIntersectionObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
});

describe("lesson page build warm-up", () => {
  it("signed in on a buildable lesson: one warm call for the view", async () => {
    await viewLesson(lessonWith("buildable"));

    expect(warmCalls()).toHaveLength(1);
    expect(warmCalls()[0]![1]).toMatchObject({ method: "POST" });
  });

  it("signed out on a buildable lesson: no warm call", async () => {
    h.auth.userId = null;

    await viewLesson(lessonWith("buildable"));

    expect(warmCalls()).toHaveLength(0);
  });

  it("signed in on a lesson without a buildable block: no warm call", async () => {
    await viewLesson(lessonWith("standard"));

    expect(warmCalls()).toHaveLength(0);
  });
});
