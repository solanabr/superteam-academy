import { NextRequest, NextResponse } from "next/server";
import { profileService } from "@/services/profile";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  if (!username) {
    return NextResponse.json(
      { error: "username parameter required" },
      { status: 400 },
    );
  }

  const exclude = request.nextUrl.searchParams.get("exclude") ?? undefined;
  const available = await profileService.checkUsernameAvailable(
    username,
    exclude,
  );

  return NextResponse.json({ available });
}
