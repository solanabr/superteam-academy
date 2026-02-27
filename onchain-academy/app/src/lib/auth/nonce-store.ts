import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const NONCE_COOKIE = "auth-nonce";
const NONCE_TTL_S = 300; // 5 minutes

/** Generate a new nonce, store it in an httpOnly cookie, and return it. */
export async function createNonce(): Promise<string> {
  const nonce = randomUUID();
  const jar = await cookies();
  jar.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: NONCE_TTL_S,
    path: "/",
  });
  return nonce;
}

/** Consume and validate a nonce from the cookie. Single-use: deleted after read. */
export async function consumeNonce(nonce: string): Promise<boolean> {
  const jar = await cookies();
  const stored = jar.get(NONCE_COOKIE)?.value;
  jar.delete(NONCE_COOKIE);
  return !!stored && stored === nonce;
}
