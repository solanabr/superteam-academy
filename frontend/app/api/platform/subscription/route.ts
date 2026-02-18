import { NextRequest, NextResponse } from "next/server";
import { readPlatformStore, writePlatformStore } from "@/lib/platform-store";

const plans = [
	{ id: "free", name: "Free", price: 0, currency: "USD", features: ["Basic courses", "Community"] },
	{ id: "premium", name: "Premium", price: 29, currency: "USD", features: ["Unlimited courses", "Credentials", "Priority support"] },
	{ id: "pro", name: "Pro", price: 99, currency: "USD", features: ["Team features", "API access", "Advanced analytics"] },
];

export async function GET(request: NextRequest) {
	const userId = request.nextUrl.searchParams.get("userId") ?? "anonymous";
	const store = await readPlatformStore();
	const subscription =
		store.subscriptionByUser[userId] ??
		{
			id: `sub-${userId}`,
			planId: "free",
			status: "active",
			currentPeriodStart: new Date().toISOString(),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
			cancelAtPeriodEnd: false,
		};

	return NextResponse.json({
		subscription,
		plans,
		stats: {
			coursesAccessed: 0,
			challengesCompleted: 0,
			certificatesEarned: 0,
			daysActive: 0,
		},
	});
}

export async function POST(request: NextRequest) {
	const body = (await request.json()) as
		| { action: "upgrade"; userId: string; planId: string }
		| { action: "cancel"; userId: string }
		| { action: "reactivate"; userId: string };

	const store = await readPlatformStore();
	const current =
		store.subscriptionByUser[body.userId] ??
		{
			id: `sub-${body.userId}`,
			planId: "free",
			status: "active" as const,
			currentPeriodStart: new Date().toISOString(),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
			cancelAtPeriodEnd: false,
		};

	if (body.action === "upgrade") {
		store.subscriptionByUser[body.userId] = { ...current, planId: body.planId, status: "active" };
	}
	if (body.action === "cancel") {
		store.subscriptionByUser[body.userId] = {
			...current,
			status: "canceled",
			cancelAtPeriodEnd: true,
		};
	}
	if (body.action === "reactivate") {
		store.subscriptionByUser[body.userId] = {
			...current,
			status: "active",
			cancelAtPeriodEnd: false,
		};
	}

	await writePlatformStore(store);
	return NextResponse.json({ success: true });
}
