import { NextResponse } from "next/server";
import { getAllTracks } from "@/lib/services/sanity-content";

export async function GET() {
  try {
    const tracks = await getAllTracks();
    return NextResponse.json({ tracks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch tracks";
    return NextResponse.json({ error: msg, tracks: [] }, { status: 200 });
  }
}
