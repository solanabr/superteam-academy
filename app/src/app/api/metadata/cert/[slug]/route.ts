// app/src/app/api/metadata/cert/[slug]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || "1";

    const course = await prisma.course.findUnique({
      where: { slug }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Формируем JSON по стандарту Metaplex
    const metadata = {
      name: `${course.title} Certificate`,
      symbol: "ACADEMY",
      description: `Official completion certificate for the ${course.title} course on Superteam Academy.`,
      // Используем картинку курса или дефолтную для сертификата
      image: course.imageUrl || "https://arweave.net/Yx0n2TqR0GqNeJnoYx4SMCjZt0r9uS-KRwQoK_vG2Wc",
      attributes: [
        {
          trait_type: "Course",
          value: course.title
        },
        {
          trait_type: "Difficulty",
          value: course.difficulty
        },
        {
          trait_type: "Level",
          value: level
        },
        {
          trait_type: "Issuer",
          value: "Superteam Brazil"
        }
      ],
      properties: {
        category: "image",
        files: [
          {
            uri: course.imageUrl || "https://arweave.net/Yx0n2TqR0GqNeJnoYx4SMCjZt0r9uS-KRwQoK_vG2Wc",
            type: "image/png"
          }
        ]
      }
    };

    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate metadata" }, { status: 500 });
  }
}