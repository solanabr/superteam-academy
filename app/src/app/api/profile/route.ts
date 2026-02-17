import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { profileService } from "@/services/profile";
import { updateProfileSchema } from "@/lib/validations/profile";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json(
      { error: "username parameter required" },
      { status: 400 },
    );
  }

  const profile = await profileService.getProfileByUsername(username);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Check privacy: if profile is private, only the owner can view
  if (!profile.isPublic) {
    const { session } = await requireAuth();
    if (!session || session.user.id !== profile.id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
  }

  const stats = await profileService.getProfileStats(profile.id);
  const completedCourses = await profileService.getCompletedCourses(profile.id);

  return NextResponse.json({ profile, stats, completedCourses });
}

export async function PATCH(request: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateProfileSchema.safeParse(body);
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
    if (err instanceof Error && err.message === "USERNAME_TAKEN") {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 },
      );
    }
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
