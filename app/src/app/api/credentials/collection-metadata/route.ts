/**
 * GET /api/credentials/collection-metadata
 *
 * Metaplex Core collection-level metadata for the
 * Superteam Brazil Academy credential collection.
 */

import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ?? "https://superteam-academy-brazil.vercel.app"

  return NextResponse.json({
    name: "Superteam Brazil Academy",
    description:
      "Soulbound credentials issued by Superteam Brazil to learners who complete on-chain developer courses.",
    image: `${baseUrl}/logo.png`,
    external_url: baseUrl,
    symbol: "SBA",
  })
}
