import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const trimmed = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        await prisma.newsletterSubscriber.upsert({
            where: { email: trimmed },
            update: { unsubscribedAt: null },
            create: { email: trimmed },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[Newsletter] Subscribe error:", error);
        return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }
}
