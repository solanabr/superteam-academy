import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Простая защита (в реальном проекте - проверка админской роли или секретного ключа)
// Для скрипта локально сойдет.
const ADMIN_SECRET = "dev-secret"; 

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("x-admin-secret");
    if (authHeader !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, image, xpReward, collectionAddress } = body;

    // Upsert (Обновляем если есть, создаем если нет)
    const achievement = await prisma.achievement.upsert({
      where: { slug: id },
      update: {
        name,
        description,
        image,
        xpReward,
        collectionAddress
      },
      create: {
        slug: id,
        name,
        description,
        image,
        xpReward,
        collectionAddress
      }
    });

    return NextResponse.json({ success: true, achievement });

  } catch (error: any) {
    console.error("Register Achievement Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}