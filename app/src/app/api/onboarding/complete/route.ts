import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { onboardingService } from "@/services/onboarding";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await onboardingService.completeOnboarding(session.user.id);
  return NextResponse.json({ success: true });
}
