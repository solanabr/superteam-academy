import { NextResponse } from "next/server";
import { getAllDifficulties } from "@/lib/difficulties-service";

export async function GET() {
  const difficulties = await getAllDifficulties();
  return NextResponse.json(difficulties);
}
