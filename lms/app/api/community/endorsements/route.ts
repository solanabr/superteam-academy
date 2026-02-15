import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Endorsement } from "@/lib/db/models/endorsement";
import { ensureUser } from "@/lib/db/helpers";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { sendMemoTx } from "@/lib/solana/transactions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "missing wallet" }, { status: 400 });
  }

  await connectDB();
  const endorsements = await Endorsement.find({ endorsee: wallet })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(endorsements);
}

export async function POST(req: NextRequest) {
  const { endorser, endorsee, message } = await req.json();
  if (!endorser || !endorsee) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (endorser === endorsee) {
    return NextResponse.json({ error: "cannot endorse yourself" }, { status: 400 });
  }

  await connectDB();

  const existing = await Endorsement.findOne({ endorser, endorsee });
  if (existing) {
    return NextResponse.json({ error: "already endorsed" }, { status: 409 });
  }

  let txSignature: string | null = null;

  try {
    const backendKeypair = getBackendSigner();
    txSignature = await sendMemoTx(backendKeypair, {
      event: "endorse_user",
      endorser,
      endorsee,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // signer not configured
  }

  await Endorsement.create({
    endorser,
    endorsee,
    message: message ?? null,
    txHash: txSignature,
  });

  // Award +15 points to endorsee
  const user = await ensureUser(endorsee);
  user.communityPoints += 15;
  user.endorsementCount += 1;
  await user.save();

  return NextResponse.json({ ok: true, txSignature });
}
