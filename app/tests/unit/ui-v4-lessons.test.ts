import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("UI V4 lesson surfaces", () => {
  it("uses the V4 shell on lesson runner and lesson page clients", () => {
    const learnRunnerSource = readFileSync(resolve("src/components/learn/LearnRunner.tsx"), "utf8");
    const lessonClientSource = readFileSync(resolve("src/components/lessons/LessonPageClient.tsx"), "utf8");

    expect(learnRunnerSource).toContain("PageShell");
    expect(lessonClientSource).toContain("PageShell");
    expect(learnRunnerSource).toContain("LessonHeader");
    expect(lessonClientSource).toContain("LessonHeader");
  });

  it("does not use legacy dark slabs or hardcoded hex colors in learning surfaces", () => {
    const learnRunnerSource = readFileSync(resolve("src/components/learn/LearnRunner.tsx"), "utf8");
    const lessonClientSource = readFileSync(resolve("src/components/lessons/LessonPageClient.tsx"), "utf8");

    expect(learnRunnerSource).not.toContain("bg-[#");
    expect(lessonClientSource).not.toContain("bg-[#");
    expect(learnRunnerSource).not.toContain("text-[#");
    expect(lessonClientSource).not.toContain("text-[#");
    expect(learnRunnerSource).not.toContain("bg-[#1e1e1e]");
  });

  it("uses lesson prose and token-based code surfaces", () => {
    const learnRunnerSource = readFileSync(resolve("src/components/learn/LearnRunner.tsx"), "utf8");
    const lessonClientSource = readFileSync(resolve("src/components/lessons/LessonPageClient.tsx"), "utf8");

    expect(learnRunnerSource).toContain("lesson-prose");
    expect(learnRunnerSource).toContain("lesson-code-panel");
    expect(lessonClientSource).toContain("lesson-prose");
    expect(lessonClientSource).toContain("lesson-code-panel");
  });

  it("uses an explicit wallet enrollment gate instead of auto-enrolling on load", () => {
    const lessonClientSource = readFileSync(resolve("src/components/lessons/LessonPageClient.tsx"), "utf8");

    expect(lessonClientSource).not.toContain("hasAttemptedAutoEnroll");
    expect(lessonClientSource).not.toContain("enrollWithoutWallet");
    expect(lessonClientSource).toContain("handleWalletEnrollment");
    expect(lessonClientSource).toContain("showEnrollmentGate");
  });

  it("shows a user-facing error when lesson completion request fails", () => {
    const lessonClientSource = readFileSync(resolve("src/components/lessons/LessonPageClient.tsx"), "utf8");

    expect(lessonClientSource).toContain("Could not mark lesson as complete");
    expect(lessonClientSource).toContain("toast.error");
  });
});
