import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveUserId } from "@/lib/auth-utils";
import type { Prisma } from "@/generated/prisma/client";

// Correct answers for the 6 assessment questions (keyed by question id)
const CORRECT_ANSWERS: Record<string, string> = {
  q1: "b", // async/await — pausing execution until promise resolves
  q2: "c", // transaction — signed instruction(s) submitted to the network
  q3: "b", // PDA — deterministic address without a private key
  q4: "c", // ownership — memory safety without a garbage collector
  q5: "a", // #[account] — defines account deserialization + validation
  q6: "b", // AMM — algorithmic formula based on pool ratios
};

function scoreAssessment(answers: Record<string, string>): number {
  let score = 0;
  for (const [key, correct] of Object.entries(CORRECT_ANSWERS)) {
    if (answers[key] === correct) score++;
  }
  return score;
}

function computeSkillLevel(score: number): string {
  if (score <= 1) return "beginner";
  if (score <= 3) return "intermediate";
  return "advanced";
}

export async function GET() {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingCompleted: true,
      onboardingData: true,
      skillLevel: true,
      skillScore: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    onboardingCompleted: user.onboardingCompleted,
    skillLevel: user.skillLevel,
    skillScore: user.skillScore,
    preferences: user.onboardingData,
  });
}

export async function POST(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { preferences, assessment, skip } = body as {
    preferences?: Record<string, unknown>;
    assessment?: Record<string, string>;
    skip?: boolean;
  };

  // Skip onboarding — mark complete with no data
  if (skip) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      },
    });
    return NextResponse.json({ skipped: true });
  }

  const skillScore = assessment ? scoreAssessment(assessment) : null;
  const skillLevel = skillScore !== null ? computeSkillLevel(skillScore) : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingCompleted: true,
      onboardingData: (preferences as Prisma.InputJsonValue) ?? undefined,
      skillLevel,
      skillScore,
      assessmentAnswers: (assessment as Prisma.InputJsonValue) ?? undefined,
      onboardingCompletedAt: new Date(),
    },
  });

  return NextResponse.json({ skillLevel, skillScore });
}
