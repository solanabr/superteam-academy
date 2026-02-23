import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch credential from Prisma
        const credential = await prisma.credential.findUnique({
            where: { id },
            include: {
                user: true
            }
        });

        if (!credential) {
            return NextResponse.json({ error: "Credential not found" }, { status: 404 });
        }

        const userProfile = credential.user.profile as any;
        const userName = userProfile?.name || credential.user.walletAddress;

        // Metaplex JSON Standard
        const metadata = {
            name: credential.trackName || "Superteam Academy Certificate",
            symbol: "STACAD",
            description: `Official certificate for completing the ${credential.trackName} track on Superteam Academy.`,
            image: "https://gateway.irys.xyz/DQzMVr36Kqkru66mbzXzAsdhqw81EL5vcziBKyBQY3gf", // Terminal Green Superteam Academy Certificate (Modular Upload)
            external_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${credential.user.walletAddress}`,
            attributes: [
                {
                    trait_type: "Track",
                    value: credential.trackName,
                },
                {
                    trait_type: "Level",
                    value: credential.level,
                },
                {
                    trait_type: "Courses Completed",
                    value: credential.coursesCompleted,
                },
                {
                    trait_type: "XP",
                    value: credential.totalXpEarned,
                },
                {
                    trait_type: "Recipient",
                    value: userName,
                },
                {
                    trait_type: "Date",
                    value: new Date(credential.earnedAt).toLocaleDateString(),
                }
            ],
            properties: {
                files: [
                    {
                        uri: "https://gateway.irys.xyz/DQzMVr36Kqkru66mbzXzAsdhqw81EL5vcziBKyBQY3gf",
                        type: "image/png"
                    }
                ],
                category: "image"
            }
        };

        return NextResponse.json(metadata);
    } catch (error) {
        console.error("Error fetching metadata:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
