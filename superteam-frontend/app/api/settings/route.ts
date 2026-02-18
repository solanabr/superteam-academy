import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  getUserSettings,
  updateUserSettings,
} from "@/lib/server/user-settings-store";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getUserSettings(user.walletAddress);
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const updated = await updateUserSettings(user.walletAddress, body);
  return NextResponse.json({ settings: updated });
}
