export type ActionName =
  | "complete_lesson"
  | "finalize_course"
  | "issue_credential";

export interface ActionProof {
  message: string;
  signature: string;
}

export interface ActionProofPayload {
  action: ActionName;
  learner: string;
  courseId: string;
  lessonIndex?: number;
  ts: number;
}

export interface ActionProofInput {
  action: ActionName;
  learner: string;
  courseId: string;
  lessonIndex?: number;
}

export type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array>;

export function createActionProofPayload(
  input: ActionProofInput,
): ActionProofPayload {
  return {
    action: input.action,
    learner: input.learner,
    courseId: input.courseId,
    ...(typeof input.lessonIndex === "number"
      ? { lessonIndex: input.lessonIndex }
      : {}),
    ts: Date.now(),
  };
}

export function serializeActionProofPayload(payload: ActionProofPayload): string {
  return JSON.stringify(payload);
}

export function parseActionProofPayload(
  message: string,
): ActionProofPayload | null {
  try {
    const parsed = JSON.parse(message) as Partial<ActionProofPayload>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.action !== "string" ||
      typeof parsed.learner !== "string" ||
      typeof parsed.courseId !== "string" ||
      typeof parsed.ts !== "number"
    ) {
      return null;
    }

    if (
      parsed.lessonIndex !== undefined &&
      (typeof parsed.lessonIndex !== "number" ||
        !Number.isInteger(parsed.lessonIndex))
    ) {
      return null;
    }

    if (
      parsed.action !== "complete_lesson" &&
      parsed.action !== "finalize_course" &&
      parsed.action !== "issue_credential"
    ) {
      return null;
    }

    return {
      action: parsed.action,
      learner: parsed.learner,
      courseId: parsed.courseId,
      ts: parsed.ts,
      ...(typeof parsed.lessonIndex === "number"
        ? { lessonIndex: parsed.lessonIndex }
        : {}),
    };
  } catch {
    return null;
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function createActionProof(
  signMessage: SignMessageFn | undefined,
  payload: ActionProofInput,
): Promise<ActionProof> {
  if (!signMessage) {
    throw new Error("SIGN_MESSAGE_UNAVAILABLE");
  }

  const encodedPayload = serializeActionProofPayload(
    createActionProofPayload(payload),
  );
  const messageBytes = new TextEncoder().encode(encodedPayload);
  const signature = await signMessage(messageBytes);

  return {
    message: encodedPayload,
    signature: uint8ToBase64(signature),
  };
}
