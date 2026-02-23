import * as jose from "jose";

const JWT_ISSUER = "academy-admin";
const JWT_AUDIENCE = "academy-admin";
const JWT_EXP = "24h";

export type AdminPayload = {
  sub: "admin";
  iat: number;
  exp: number;
};

export async function signAdminJwt(secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(JWT_EXP)
    .sign(key);
}

export async function verifyAdminJwt(
  token: string,
  secret: string
): Promise<AdminPayload | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, key, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (payload.sub !== "admin") return null;
    return {
      sub: payload.sub,
      iat: (payload.iat ?? 0) as number,
      exp: (payload.exp ?? 0) as number,
    };
  } catch {
    return null;
  }
}
