import "server-only";
import dns from "node:dns/promises";
import net from "node:net";

/**
 * Fetch a remote image by URL, safely, so "add image by URL" can pin it into
 * Sanity (→ cdn.sanity.io) rather than embedding a foreign URL the lesson
 * renderer's CSP would block. Guards against SSRF: https-only, no embedded
 * credentials, and the host must resolve to a PUBLIC address (private/loopback/
 * link-local ranges are rejected, and redirects are refused so a 3xx can't
 * bounce to an internal host). Size is capped by streaming, not trust in
 * Content-Length.
 */

export type RemoteImageReason =
  | "invalid_url"
  | "not_https"
  | "blocked_host"
  | "bad_type"
  | "too_large"
  | "fetch_failed";

export class RemoteImageError extends Error {
  constructor(public reason: RemoteImageReason) {
    super(reason);
    this.name = "RemoteImageError";
  }
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n));
  if (
    parts.length !== 4 ||
    parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
  ) {
    return true; // malformed → treat as unsafe
  }
  const [a, b] = parts as [number, number, number, number];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) || // link-local
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) // CGNAT 100.64/10
  );
}

function isPrivateIPv6(ip: string): boolean {
  const s = ip.toLowerCase();
  if (s === "::1" || s === "::") return true;
  if (/^f[cd]/.test(s)) return true; // ULA fc00::/7
  if (/^fe[89ab]/.test(s)) return true; // link-local fe80::/10
  const mapped = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped && mapped[1]) return isPrivateIPv4(mapped[1]);
  return false;
}

function isPrivateIp(ip: string): boolean {
  const kind = net.isIP(ip);
  if (kind === 4) return isPrivateIPv4(ip);
  if (kind === 6) return isPrivateIPv6(ip);
  return true; // not a recognizable IP → unsafe
}

async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RemoteImageError("invalid_url");
  }
  if (url.protocol !== "https:") throw new RemoteImageError("not_https");
  if (url.username || url.password) throw new RemoteImageError("invalid_url");

  const host = url.hostname;
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new RemoteImageError("blocked_host");
    return url;
  }
  let resolved: { address: string }[];
  try {
    resolved = await dns.lookup(host, { all: true });
  } catch {
    throw new RemoteImageError("blocked_host");
  }
  if (resolved.length === 0 || resolved.some((r) => isPrivateIp(r.address))) {
    throw new RemoteImageError("blocked_host");
  }
  return url;
}

export interface FetchedImage {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export async function fetchRemoteImage(
  raw: string,
  opts: {
    maxBytes: number;
    allowedTypes: ReadonlySet<string>;
    timeoutMs?: number;
  }
): Promise<FetchedImage> {
  const url = await assertPublicHttpsUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 10_000);

  try {
    const res = await fetch(url, {
      // Refuse redirects — a 3xx could bounce to an internal host and bypass the
      // pre-flight DNS check.
      redirect: "error",
      signal: controller.signal,
      headers: { accept: "image/*" },
    });
    if (!res.ok) throw new RemoteImageError("fetch_failed");

    const contentType = (
      (res.headers.get("content-type") ?? "").split(";")[0] ?? ""
    )
      .trim()
      .toLowerCase();
    if (!opts.allowedTypes.has(contentType)) {
      throw new RemoteImageError("bad_type");
    }
    const declared = Number(res.headers.get("content-length") ?? "0");
    if (Number.isFinite(declared) && declared > opts.maxBytes) {
      throw new RemoteImageError("too_large");
    }

    // Stream with a hard cap — don't trust Content-Length for the real size.
    const reader = res.body?.getReader();
    if (!reader) throw new RemoteImageError("fetch_failed");
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > opts.maxBytes) {
          await reader.cancel();
          throw new RemoteImageError("too_large");
        }
        chunks.push(value);
      }
    }
    if (total === 0) throw new RemoteImageError("fetch_failed");

    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const filename = url.pathname.split("/").pop() || "image";
    return { buffer, contentType, filename };
  } catch (err) {
    if (err instanceof RemoteImageError) throw err;
    // Abort/timeout/network/redirect-refused all collapse to a generic failure.
    throw new RemoteImageError("fetch_failed");
  } finally {
    clearTimeout(timer);
  }
}
