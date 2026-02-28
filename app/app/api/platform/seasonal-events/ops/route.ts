import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import {
	getSeasonalBaseState,
	listSeasonalUsers,
	resetSeasonalUserProgress,
	setSeasonalEventStatus,
	setSeasonalProgress,
} from "@/lib/seasonal-events-store";

export async function GET() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id, session.user.email);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const users = listSeasonalUsers();
	return NextResponse.json({
		event: getSeasonalBaseState(),
		participants: users,
		stats: {
			totalParticipants: users.length,
			joinedParticipants: users.filter((user) => user.joined).length,
			completedAny: users.filter((user) => user.completedChallenges > 0).length,
		},
	});
}

export async function POST(request: Request) {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });

	if (!session) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const admin = await isUserAdmin(session.user.id, session.user.email);
	if (!admin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const body = (await request.json()) as
		| {
				action: "set-status";
				status: "upcoming" | "active" | "ended";
		  }
		| {
				action: "reset-user";
				userId: string;
		  }
		| {
				action: "set-user-progress";
				userId: string;
				joined: boolean;
				completedChallenges: number;
		  };

	if (body.action === "set-status") {
		setSeasonalEventStatus(body.status);
		return NextResponse.json({ success: true, event: getSeasonalBaseState() });
	}

	if (body.action === "reset-user") {
		if (!body.userId) {
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });
		}
		resetSeasonalUserProgress(body.userId);
		return NextResponse.json({ success: true });
	}

	if (body.action === "set-user-progress") {
		if (!body.userId) {
			return NextResponse.json({ error: "Missing userId" }, { status: 400 });
		}
		setSeasonalProgress(body.userId, {
			joined: body.joined,
			completedChallenges: Math.max(0, body.completedChallenges),
		});
		return NextResponse.json({ success: true });
	}

	return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
