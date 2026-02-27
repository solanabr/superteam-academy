import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
const API_TOKEN = process.env.BACKEND_API_TOKEN ?? "";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "";

const JWT_ISSUER = "academy-admin";
const JWT_AUDIENCE = "academy-admin";

const ADMIN_ONLY_ACTIONS = new Set([
  "create-course",
  "update-course",
  "update-config",
  "register-minter",
  "revoke-minter",
  "create-achievement-type",
  "deactivate-achievement-type",
  "reward-xp",
  "award-achievement",
]);

const ALLOWED_ACTIONS = new Set([
  "create-course",
  "update-config",
  "update-course",
  "complete-lesson",
  "finalize-course",
  "issue-credential",
  "upgrade-credential",
  "register-minter",
  "revoke-minter",
  "reward-xp",
  "create-achievement-type",
  "award-achievement",
  "deactivate-achievement-type",
]);

async function verifyAdminToken(token: string): Promise<boolean> {
  if (!ADMIN_JWT_SECRET || ADMIN_JWT_SECRET.length < 32) return false;
  try {
    const key = new TextEncoder().encode(ADMIN_JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, key, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload.sub === "admin";
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { ok: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  }

  if (ADMIN_ONLY_ACTIONS.has(action)) {
    const auth = request.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.json(
        { ok: false, error: "Admin JWT required" },
        { status: 401 }
      );
    }
  }

  if (!API_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured: missing API token" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    const upstream = await fetch(
      `${BACKEND_URL.replace(/\/$/, "")}/v1/academy/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_TOKEN,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: data.error ?? upstream.statusText },
        { status: upstream.status }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
