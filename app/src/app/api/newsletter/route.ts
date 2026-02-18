import { NextResponse } from "next/server";
import { SupabaseNewsletterService } from "@/services/newsletter";

const newsletterService = new SupabaseNewsletterService();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, locale } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 },
            );
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 },
            );
        }

        const result = await newsletterService.subscribe(email, locale);

        return NextResponse.json({
            success: true,
            alreadySubscribed: result.alreadySubscribed,
        });
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return NextResponse.json(
            { error: "Failed to subscribe" },
            { status: 500 },
        );
    }
}
