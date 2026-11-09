// @vitest-environment jsdom
// The signed-in learner can change while a lesson stays open: a sign-out or a
// different sign-in in another tab reaches this one with no reload. These run
// the real ChallengeInterface and CodeEditor over a fake Monaco.
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
import { render, act, cleanup, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { EditorProps, Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { CodeBlockData, Lesson } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { CodeBlock } from "../code-block";
import type { BlockContext } from "../types";

interface FakeEditor {
  value: string;
  type: (next: string) => void;
}

const h = vi.hoisted(() => ({
  mounts: [] as FakeEditor[],
  getCode: null as (() => string) | null,
}));

// Mounts itself the way Monaco does once loaded, and reports keystrokes
// through the wrapper's current onChange, as the real wrapper does.
vi.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: function FakeMonaco(props: EditorProps) {
    const latest = useRef(props);
    latest.current = props;
    useEffect(() => {
      const fake: FakeEditor = {
        value: props.defaultValue ?? "",
        type: (next) => {
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
    return null;
  },
  loader: { config: vi.fn() },
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));
vi.mock("@/components/editor/output-panel", () => ({
  OutputPanel: () => null,
}));
vi.mock("@/components/editor/ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: () => null,
}));
vi.mock("@/components/editor/challenge-runner", () => ({
  ChallengeRunner: (props: { getCode: () => string }) => {
    h.getCode = props.getCode;
    return null;
  },
}));

const STARTER = "// starter";
const KEY = "superteam-lms-code-lesson-1";
const block = {
  _type: "code",
  key: "only",
  language: "typescript",
  starter: STARTER,
  tests: [],
  hints: [],
} as unknown as CodeBlockData;

function ui(userId: string | null) {
  const ctx = {
    lesson: { _id: "lesson-1", slug: "lesson" } as Lesson,
    courseSlug: "course",
    courseId: "course-1",
    xpReward: 30,
    earnedXp: null,
    isCompleted: false,
    isEnrolled: true,
    onEnroll: () => {},
    aiSuppressed: true,
    capstoneAiOff: false,
    userId,
    authPending: false,
  } as unknown as BlockContext;
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <CodeBlock block={block} ctx={ctx} />
    </NextIntlClientProvider>
  );
}

const screenNow = () => h.mounts.at(-1)!;
const saveSettles = () => act(() => vi.advanceTimersByTime(1500));

// Load the editor chunk once up front: its first import is slow on a busy
// machine and isn't what these tests measure.
beforeAll(async () => {
  await import("@/components/editor/challenge-interface");
}, 60_000);

beforeEach(() => {
  localStorage.clear();
  h.mounts = [];
  h.getCode = null;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("a change of signed-in learner while the lesson is open", () => {
  it("opens the next owner's draft and never saves the last one's code", async () => {
    localStorage.setItem(`${KEY}@user:user-a`, "// A's work");
    localStorage.setItem(`${KEY}@user:user-b`, "// B's older draft");
    const { rerender } = render(ui("user-a"));
    await waitFor(() => expect(h.mounts).toHaveLength(1), { timeout: 15_000 });
    expect(screenNow().value).toBe("// A's work");
    vi.useFakeTimers();

    // Signed out in another tab.
    rerender(ui(null));
    expect(screenNow().value).toBe(STARTER);
    expect(h.getCode?.()).toBe(STARTER);
    act(() => screenNow().type(`${STARTER}\n// signed out`));
    saveSettles();
    expect(localStorage.getItem(`${KEY}@anon`)).toBe(
      `${STARTER}\n// signed out`
    );

    // B signs in in another tab. Signing in keeps what's on screen.
    rerender(ui("user-b"));
    expect(screenNow().value).toBe(`${STARTER}\n// signed out`);
    act(() => screenNow().type(`${STARTER}\n// signed out\n// B`));
    saveSettles();
    expect(h.getCode?.()).toBe(`${STARTER}\n// signed out\n// B`);

    // Straight from A to B.
    rerender(ui("user-a"));
    expect(screenNow().value).toBe("// A's work");
    rerender(ui("user-b"));
    expect(screenNow().value).toBe(`${STARTER}\n// signed out\n// B`);
    expect(h.getCode?.()).toBe(`${STARTER}\n// signed out\n// B`);

    expect(localStorage.getItem(`${KEY}@user:user-a`)).toBe("// A's work");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (!key.endsWith("@user:user-a")) {
        expect(localStorage.getItem(key)).not.toContain("A's work");
      }
    }
  });

  it("keeps a signed-out learner's code on screen when they sign in", async () => {
    const { rerender } = render(ui(null));
    await waitFor(() => expect(h.mounts).toHaveLength(1), { timeout: 15_000 });
    act(() => screenNow().type("// passing work"));

    rerender(ui("user-a"));

    expect(h.mounts).toHaveLength(1);
    expect(screenNow().value).toBe("// passing work");
    expect(h.getCode?.()).toBe("// passing work");
  });
});
