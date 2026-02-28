import { NextRequest, NextResponse } from "next/server";
import { ensureUser } from "@/lib/db/helpers";

export async function POST(req: NextRequest) {
  const { refereeId, referrerId, txSignature } = await req.json();
  if (!refereeId || !referrerId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  if (refereeId === referrerId) {
    return NextResponse.json(
      { error: "cannot refer yourself" },
      { status: 400 },
    );
  }

  // MongoDB sync (backup for on-chain register_referral)
  const referee = await ensureUser(refereeId);
  if (referee.referrer) {
    return NextResponse.json({
      ok: true,
      txSignature: null,
      alreadyRegistered: true,
    });
  }

  referee.referrer = referrerId;
  await referee.save();

  const referrer = await ensureUser(referrerId);
  referrer.referralCount += 1;
  await referrer.save();

  return NextResponse.json({ ok: true, txSignature: txSignature ?? null });
}
