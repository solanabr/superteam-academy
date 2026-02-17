import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { profileService } from "@/services/profile";
import { updatePreferencesSchema } from "@/lib/validations/profile";

export async function PATCH(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updatePreferencesSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await profileService.updateProfile(
      session.user.id,
      result.data,
    );
    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error("Preferences update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
