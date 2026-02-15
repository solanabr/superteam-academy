import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Thread } from "@/lib/db/models/thread";
import { User } from "@/lib/db/models/user";
import { ensureUser } from "@/lib/db/helpers";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { sendMemoTx } from "@/lib/solana/transactions";

async function resolveDisplayNames(wallets: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(wallets)];
  const users = await User.find({ wallet: { $in: unique } }, { wallet: 1, displayName: 1 }).lean();
  const map: Record<string, string> = {};
  for (const u of users) {
    map[u.wallet] = u.displayName || `${u.wallet.slice(0, 4)}...${u.wallet.slice(-4)}`;
  }
  for (const w of unique) {
    if (!map[w]) map[w] = `${w.slice(0, 4)}...${w.slice(-4)}`;
  }
  return map;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") ?? "recent";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 20;

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (type && type !== "all") filter.type = type;
  if (tag) filter.tags = tag;

  const sortOption: Record<string, 1 | -1> =
    sort === "popular"
      ? { upvotes: -1, createdAt: -1 }
      : sort === "unsolved"
        ? { isSolved: 1, createdAt: -1 }
        : { isPinned: -1, createdAt: -1 };

  const [threads, total] = await Promise.all([
    Thread.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Thread.countDocuments(filter),
  ]);

  const names = await resolveDisplayNames(threads.map((t) => t.author));

  const threadsWithNames = threads.map((t) => ({
    ...t,
    authorName: names[t.author],
  }));

  return NextResponse.json({ threads: threadsWithNames, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { userId, title, body, type, tags } = await req.json();
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  let txSignature: string | null = null;

  try {
    const backendKeypair = getBackendSigner();
    txSignature = await sendMemoTx(backendKeypair, {
      event: "create_thread",
      wallet: userId,
      title: title.slice(0, 80),
      type: type ?? "discussion",
      timestamp: new Date().toISOString(),
    });
  } catch {
    // signer not configured
  }

  await connectDB();

  const thread = await Thread.create({
    author: userId,
    title,
    body,
    type: type ?? "discussion",
    tags: tags ?? [],
    txHash: txSignature,
  });

  // Award points
  const user = await ensureUser(userId);
  user.communityPoints += 10;
  await user.save();

  return NextResponse.json({ ok: true, txSignature, thread });
}
