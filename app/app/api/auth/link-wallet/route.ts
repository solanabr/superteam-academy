import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * POST /api/auth/link-wallet
 *
 * Links a Solana wallet address to the current NextAuth session.
 * Requires the user to sign a message proving ownership of the wallet.
 *
 * Body: { walletAddress: string, signature: string, message: string }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized. Sign in first." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { walletAddress, signature, message } = body;

        if (!walletAddress || !signature || !message) {
            return NextResponse.json(
                { error: "Missing walletAddress, signature, or message." },
                { status: 400 }
            );
        }

        // Validate the wallet address format
        let publicKey: PublicKey;
        try {
            publicKey = new PublicKey(walletAddress);
        } catch {
            return NextResponse.json(
                { error: "Invalid wallet address." },
                { status: 400 }
            );
        }

        // Verify the message includes a recent timestamp (replay protection)
        const timestampMatch = message.match(/Timestamp: (\d+)/);
        if (!timestampMatch) {
            return NextResponse.json(
                { error: "Message must contain a timestamp." },
                { status: 400 }
            );
        }

        const ts = parseInt(timestampMatch[1], 10);
        const now = Date.now();
        if (Math.abs(now - ts) > 5 * 60 * 1000) {
            return NextResponse.json(
                { error: "Signature expired. Please sign again." },
                { status: 400 }
            );
        }

        // Verify the Ed25519 signature
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);

        const { verify } = await import("@noble/ed25519");
        const isValid = await verify(signatureBytes, messageBytes, publicKey.toBytes());

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid signature." },
                { status: 403 }
            );
        }

        // Signature valid — return the wallet address for the client to update the session
        return NextResponse.json({
            success: true,
            walletAddress,
        });
    } catch (error) {
        console.error("Link wallet error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
