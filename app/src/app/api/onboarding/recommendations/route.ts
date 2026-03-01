import { NextRequest, NextResponse } from "next/server";
import { onboardingService } from "@/services/onboarding";

export async function POST(req: NextRequest) {
  const { experienceLevel, web3Level, interest } = await req.json();

  const recommendations = await onboardingService.getRecommendations({
    experienceLevel: experienceLevel ?? "beginner",
    web3Level: web3Level ?? "beginner",
    interest: interest ?? "web3",
  });

  return NextResponse.json(recommendations);
}
