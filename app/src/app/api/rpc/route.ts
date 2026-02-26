import { NextRequest, NextResponse } from "next/server";

const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
const HELIUS_KEY = process.env.HELIUS_API_KEY ?? "";

const UPSTREAM_URL = HELIUS_KEY
  ? `https://${SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet"}.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : SOLANA_NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

// Only allow safe RPC methods
const ALLOWED_METHODS = new Set([
  "getBalance",
  "getTokenAccountBalance",
  "getTokenLargestAccounts",
  "getAccountInfo",
  "getProgramAccounts",
  "getLatestBlockhash",
  "getTransaction",
  "sendTransaction",
  "simulateTransaction",
  "getAssetsByOwner",
  "getMultipleAccounts",
  "getSignaturesForAddress",
  "getSignatureStatuses",
  "isBlockhashValid",
  "getSlot",
  "getBlockHeight",
]);

// In-memory rate limiter: 30 requests per 60s per IP
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const ipRequests = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRequests) {
    if (now > entry.resetAt) ipRequests.delete(ip);
  }
}, 300_000);

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  let body: string;
  let parsed: { method?: string };

  try {
    body = await req.text();
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  if (!parsed.method || !ALLOWED_METHODS.has(parsed.method)) {
    return NextResponse.json(
      { error: `Method "${parsed.method ?? ""}" is not allowed.` },
      { status: 403 },
    );
  }

  const upstream = await fetch(UPSTREAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await upstream.text();
  return new NextResponse(data, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
