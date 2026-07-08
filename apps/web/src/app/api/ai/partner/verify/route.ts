import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openCheck } from "@/lib/ai/check-seal";
import type { VerifyResponse } from "@/lib/ai/partner-types";

// Cheap server-side grade for the comprehension-check gate (Fix A on PR
// #346's claude-review finding): the answer never reaches the browser in the
// clear (see check-seal.ts + partner/route.ts), so grading a pick has to
// happen here. No DB state, no Gemini call — just an AES-GCM open + compare —
// so no assist budget / rate limit applies; brute-forcing 3 options for no
// reward is pointless, and auth alone is sufficient friction.

const MAX_BODY_CHARS = 4_000;
const MAX_TOKEN_CHARS = 1024;

interface VerifyRequestBody {
  checkToken?: unknown;
  pickedIndex?: unknown;
}

function isValidPickedIndex(value: unknown): value is 0 | 1 | 2 {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    (value === 0 || value === 1 || value === 2)
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  let body: VerifyRequestBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { checkToken, pickedIndex } = body;

  if (
    typeof checkToken !== "string" ||
    !checkToken ||
    checkToken.length > MAX_TOKEN_CHARS ||
    !isValidPickedIndex(pickedIndex)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const opened = openCheck(checkToken);
  if (!opened) {
    return NextResponse.json({ error: "invalid check" }, { status: 400 });
  }

  const result: VerifyResponse = {
    correct: pickedIndex === opened.correctIndex,
    explanation: opened.explanation,
  };
  return NextResponse.json(result);
}
