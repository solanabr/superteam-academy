// app/src/app/api/metadata/badge/[slug]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    const achievement = await prisma.achievement.findUnique({
      where: { slug }
    });

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
    }

    const metadata = {
      name: achievement.name,
      symbol: "BADGE",
      description: achievement.description,
      image: achievement.image, // URL из базы (dicebear или реальный)
      attributes: [
        {
          trait_type: "Type",
          value: "Achievement Badge"
        },
        {
          trait_type: "XP Reward",
          value: achievement.xpReward.toString()
        }
      ],
      properties: {
        category: "image",
        files: [{ uri: achievement.image, type: "image/svg+xml" }]
      }
    };

    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate metadata" }, { status: 500 });
  }
}