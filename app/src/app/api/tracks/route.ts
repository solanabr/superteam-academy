import { NextResponse } from "next/server";
import { getAllTracks } from "@/lib/tracks-service";

export async function GET() {
  const tracks = await getAllTracks();
  return NextResponse.json(tracks);
}
