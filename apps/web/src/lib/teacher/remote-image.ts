import "server-only";
import dns from "node:dns/promises";
import net from "node:net";
import https from "node:https";
import type { IncomingMessage } from "node:http";

/**
 * Fetch a remote image by URL, safely, so "add image by URL" can pin it into
 * Sanity (→ cdn.sanity.io) rather than embedding a foreign URL the lesson
 * renderer's CSP would block.
 *
 * SSRF hardening:
 *  - https-only, no embedded credentials.
 *  - The hostname is resolved once and every resolved address must be PUBLIC
 *    (private/loopback/link-local/CGNAT rejected).
 *  - The connection is then made DIRECTLY to that validated IP (not by hostname),
 *    with SNI + Host set to the original hostname. This closes the DNS-rebinding
 *    TOCTOU hole: a plain `fetch(url)` would re-resolve the hostname when opening
 *    the socket, so an attacker controlling the domain's DNS could return a
 *    public IP to the pre-flight check and a private one to the real request.
 *    Pinning the IP means the socket only ever goes to the address we validated.
 *  - Redirects are NOT followed (a 3xx could point at an internal host).
 *  - Size is capped by streaming, not by trusting Content-Length; idle sockets
 *    time out.
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

/**
 * Validate the URL and resolve it to a single PUBLIC IP to connect to. Returns
 * both the parsed URL (for SNI/Host/path) and the pinned address.
 */
async function resolvePublicTarget(
  raw: string
): Promise<{ url: URL; ip: string }> {
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
    return { url, ip: host };
  }

  let resolved: { address: string }[];
  try {
    resolved = await dns.lookup(host, { all: true });
  } catch {
    throw new RemoteImageError("blocked_host");
  }
  const first = resolved[0];
  if (!first || resolved.some((r) => isPrivateIp(r.address))) {
    throw new RemoteImageError("blocked_host");
  }
  return { url, ip: first.address };
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
  const { url, ip } = await resolvePublicTarget(raw);
  const timeoutMs = opts.timeoutMs ?? 10_000;

  // Connect straight to the validated IP; keep the real hostname for TLS SNI +
  // certificate verification and the HTTP Host header. No hostname re-resolution
  // happens, so DNS rebinding cannot swing the socket to a private address.
  const res = await new Promise<IncomingMessage>((resolve, reject) => {
    const request = https.request(
      {
        host: ip,
        servername: url.hostname,
        port: url.port ? Number(url.port) : 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: { host: url.host, accept: "image/*" },
        rejectUnauthorized: true,
      },
      resolve
    );
    request.setTimeout(timeoutMs, () => {
      request.destroy(new RemoteImageError("fetch_failed"));
    });
    request.on("error", (err) =>
      reject(
        err instanceof RemoteImageError
          ? err
          : new RemoteImageError("fetch_failed")
      )
    );
    request.end();
  });

  try {
    const status = res.statusCode ?? 0;
    // 3xx is refused, not followed — it could redirect to an internal host.
    if (status < 200 || status >= 300) {
      res.destroy();
      throw new RemoteImageError("fetch_failed");
    }
    const contentType = (
      (res.headers["content-type"] ?? "").split(";")[0] ?? ""
    )
      .trim()
      .toLowerCase();
    if (!opts.allowedTypes.has(contentType)) {
      res.destroy();
      throw new RemoteImageError("bad_type");
    }
    const declared = Number(res.headers["content-length"] ?? "0");
    if (Number.isFinite(declared) && declared > opts.maxBytes) {
      res.destroy();
      throw new RemoteImageError("too_large");
    }

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let total = 0;
      res.on("data", (chunk: Buffer) => {
        total += chunk.byteLength;
        if (total > opts.maxBytes) {
          res.destroy();
          reject(new RemoteImageError("too_large"));
          return;
        }
        chunks.push(chunk);
      });
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", (err) =>
        reject(
          err instanceof RemoteImageError
            ? err
            : new RemoteImageError("fetch_failed")
        )
      );
    });

    if (buffer.byteLength === 0) throw new RemoteImageError("fetch_failed");
    const filename = url.pathname.split("/").pop() || "image";
    return { buffer, contentType, filename };
  } catch (err) {
    if (err instanceof RemoteImageError) throw err;
    throw new RemoteImageError("fetch_failed");
  }
}
