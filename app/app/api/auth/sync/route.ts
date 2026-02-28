import { NextResponse } from "next/server";
import { requireSession } from "@/lib/route-utils";
import { syncAuthSession } from "./action";

export async function POST() {
	const auth = await requireSession();
	if (!auth.ok) return auth.response;
	const result = await syncAuthSession(auth.session);
	return NextResponse.json(result);
}
