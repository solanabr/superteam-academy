// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeploymentState } from "@superteam-lms/deploy";
import {
  clearDeployState,
  readDeployBinary,
  readDeployState,
  saveDeployBinary,
  writeDeployState,
  type DeployStateScope,
} from "../deploy-state-storage";

const SCOPE: DeployStateScope = {
  keyPrefix: "LabKey11",
  courseId: "course-1",
  lessonId: "lesson-1",
};

const STATE: DeploymentState = {
  buildUuid: "build-1",
  bufferKeypairSecret: Array(64).fill(1),
  programKeypairSecret: Array(64).fill(2),
  lastUploadedChunk: 3,
  totalChunks: 9,
  phase: "uploading",
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deploy state storage", () => {
  it("reads back the state it wrote, as a reload would", () => {
    writeDeployState(SCOPE, STATE);
    expect(readDeployState(SCOPE)).toEqual(STATE);
  });

  it("has nothing for a lesson with no saved deploy", () => {
    expect(readDeployState(SCOPE)).toBeNull();
  });

  it.each([
    ["another lab key", { keyPrefix: "OtherKey" }],
    ["another lesson", { lessonId: "lesson-2" }],
    ["another course", { courseId: "course-2" }],
  ])("keeps a saved deploy away from %s", (_name, change) => {
    writeDeployState(SCOPE, STATE);
    expect(readDeployState({ ...SCOPE, ...change })).toBeNull();
  });

  it("saves nothing without a lab key", () => {
    writeDeployState({ ...SCOPE, keyPrefix: "" }, STATE);
    expect(sessionStorage.length).toBe(0);
    expect(readDeployState({ ...SCOPE, keyPrefix: "" })).toBeNull();
  });

  it("treats text that is not JSON as no saved deploy", () => {
    writeDeployState(SCOPE, STATE);
    const key = sessionStorage.key(0) ?? "";
    sessionStorage.setItem(key, "{not json");
    expect(readDeployState(SCOPE)).toBeNull();
  });

  it("keeps the compiled program's bytes for the build they belong to", () => {
    const bytes = Uint8Array.from({ length: 5000 }, (_, i) => i % 251);
    saveDeployBinary(SCOPE, "build-1", bytes);

    const read = readDeployBinary(SCOPE, "build-1");
    expect(read).not.toBeNull();
    expect(Array.from(read ?? [])).toEqual(Array.from(bytes));
    expect(readDeployBinary(SCOPE, "build-2")).toBeNull();
  });

  it("returns no bytes when the stored program is damaged", () => {
    saveDeployBinary(SCOPE, "build-1", new Uint8Array([1, 2, 3]));
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i) ?? "";
      if (key.startsWith("deploy-binary-")) {
        sessionStorage.setItem(
          key,
          JSON.stringify({ buildUuid: "build-1", base64: "***" })
        );
      }
    }
    expect(readDeployBinary(SCOPE, "build-1")).toBeNull();
  });

  it("carries on when storage has no room for the program", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() =>
      saveDeployBinary(SCOPE, "build-1", new Uint8Array([1]))
    ).not.toThrow();
    expect(() => writeDeployState(SCOPE, STATE)).not.toThrow();
  });

  it("clears the state and the program together", () => {
    writeDeployState(SCOPE, STATE);
    saveDeployBinary(SCOPE, "build-1", new Uint8Array([1, 2, 3]));

    clearDeployState(SCOPE);

    expect(readDeployState(SCOPE)).toBeNull();
    expect(readDeployBinary(SCOPE, "build-1")).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it("writes only to session storage", () => {
    writeDeployState(SCOPE, STATE);
    saveDeployBinary(SCOPE, "build-1", new Uint8Array([1, 2, 3]));
    expect(localStorage.length).toBe(0);
  });
});
