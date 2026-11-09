// @vitest-environment jsdom
// The signed-in learner can change while a lesson stays open: a sign-out or a
// different sign-in in another tab reaches this one with no reload. These run
// the real lesson page, ChallengeInterface and CodeEditor over a fake Monaco,
// with the page reload stubbed.
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import { useEffect, useRef } from "react";
import {
  render,
  act,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { EditorProps, Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { Lesson } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { LessonPageClient } from "../lesson-client";

interface FakeEditor {
  value: string;
  type: (next: string) => void;
}

const h = vi.hoisted(() => ({
  auth: {
    userId: null as string | null,
    profile: { wallet_address: "wallet" } as { wallet_address: string } | null,
    isLoading: false,
  },
  mounts: [] as FakeEditor[],
  getCode: null as (() => string) | null,
  reload: vi.fn(),
}));

// Mounts itself the way Monaco does once loaded, and reports keystrokes
// through the wrapper's current onChange, as the real wrapper does. A
// keystroke also reaches the page as a keydown, as the real one does.
vi.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: function FakeMonaco(props: EditorProps) {
    const latest = useRef(props);
    latest.current = props;
    const area = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
      const fake: FakeEditor = {
        value: props.defaultValue ?? "",
        type: (next) => {
          fireEvent.keyDown(area.current!, { key: "a" });
          fake.value = next;
          latest.current.onChange?.(
            next,
            {} as editor.IModelContentChangedEvent
          );
        },
      };
      const instance = {
        onDidFocusEditorWidget: () => ({ dispose() {} }),
        onDidBlurEditorWidget: () => ({ dispose() {} }),
        getDomNode: () => document.createElement("div"),
        getValue: () => fake.value,
        setValue: (next: string) => {
          fake.value = next;
        },
      };
      h.mounts.push(fake);
      props.onMount?.(
        instance as unknown as editor.IStandaloneCodeEditor,
        {} as Monaco
      );
      // Mount once, as Monaco does; later prop changes don't remount it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <textarea ref={area} />;
  },
  loader: { config: vi.fn() },
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/auth/auth-provider", () => ({ useAuth: () => h.auth }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null }),
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
vi.mock("@/components/auth/auth-modal", () => ({
  AuthModal: ({ trigger }: { trigger?: React.ReactNode }) => <>{trigger}</>,
}));
vi.mock("@/components/wallet/linked-wallet-prompt", () => ({
  LinkedWalletPrompt: () => null,
}));
vi.mock("@/components/editor/output-panel", () => ({
  OutputPanel: () => null,
}));
vi.mock("@/components/editor/ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: () => null,
}));
vi.mock("@/components/deploy/deploy-panel", () => ({
  DeployPanel: () => null,
}));
vi.mock("@/components/editor/challenge-runner", () => ({
  ChallengeRunner: (props: { getCode: () => string }) => {
    h.getCode = props.getCode;
    return null;
  },
}));

const STARTER = "// starter";
const lesson = {
  _id: "lesson-1",
  title: "One rung",
  slug: "one-rung",
  blocks: [
    {
      _type: "code",
      key: "only",
      language: "typescript",
      buildType: "standard",
      deployable: false,
      starter: STARTER,
      tests: [],
      hints: [],
    },
  ],
} as unknown as Lesson;

function ui() {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <LessonPageClient
        lesson={lesson}
        allLessons={[
          { _id: "lesson-1", title: "L", slug: "one-rung" } as never,
        ]}
        locale="en"
        courseSlug="course"
        courseId="course-1"
        courseXpPerLesson={30}
      />
    </NextIntlClientProvider>
  );
}

const screenNow = () => h.mounts.at(-1)!;

async function open(userId: string | null) {
  h.auth.userId = userId;
  const view = render(ui());
  await waitFor(() => expect(h.mounts).toHaveLength(1), { timeout: 15_000 });
  return {
    as: (next: string | null) => {
      h.auth.userId = next;
      view.rerender(ui());
    },
  };
}

// Load the editor chunk once up front: its first import is slow on a busy
// machine and isn't what these tests measure.
beforeAll(async () => {
  await import("@/components/editor/challenge-interface");
}, 60_000);

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
});

beforeEach(() => {
  localStorage.clear();
  h.mounts = [];
  h.getCode = null;
  h.reload.mockReset();
  h.auth.isLoading = false;
  Object.defineProperty(window, "location", {
    value: { ...window.location, reload: h.reload },
    writable: true,
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: false }))
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("a change of signed-in learner while the lesson is open", () => {
  it("reloads when the signed-in learner signs out", async () => {
    const page = await open("user-a");
    page.as(null);
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it("reloads when another learner signs in", async () => {
    const page = await open("user-a");
    page.as("user-b");
    expect(h.reload).toHaveBeenCalledTimes(1);
  });

  it("keeps a signed-out learner's code on screen when they sign in", async () => {
    const page = await open(null);
    act(() => screenNow().type("// passing work"));

    page.as("user-a");

    expect(h.reload).not.toHaveBeenCalled();
    expect(h.mounts).toHaveLength(1);
    expect(screenNow().value).toBe("// passing work");
    expect(h.getCode?.()).toBe("// passing work");
  });

  it("doesn't reload when sign-in first resolves, or for the same learner", async () => {
    h.auth.isLoading = true;
    h.auth.userId = null;
    const view = render(ui());
    h.auth.isLoading = false;
    h.auth.userId = "user-a";
    view.rerender(ui());
    await waitFor(() => expect(h.mounts).toHaveLength(1), { timeout: 15_000 });
    view.rerender(ui());

    expect(h.reload).not.toHaveBeenCalled();
  });
});
