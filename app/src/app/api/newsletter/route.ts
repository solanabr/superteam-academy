import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const newsletterSchema = z.object({
  email: z.string().email(),
  source: z.string().trim().min(1).max(50).optional().default("landing"),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as unknown;
    const { email, source } = newsletterSchema.parse(body);

    await prisma.newsletterSubscription.upsert({
      where: { email },
      update: { source },
      create: { email, source },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid signup payload" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Could not save newsletter signup" },
      { status: 500 }
    );
  }
}
