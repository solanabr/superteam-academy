import { describe, it, expect } from "vitest";
import { cspOriginOf } from "../csp-origin.mjs";

// A CSP source list is split on spaces, a directive list on `;`, and a header
// list on `,`. An origin taken from an env URL goes into the header as text, so
// one that carries any of those would write its own directive.
describe("cspOriginOf", () => {
  it.each([
    ["https://rpc.example.com", "https://rpc.example.com"],
    ["http://localhost:8899", "http://localhost:8899"],
    // Only the origin: a path or a query can carry a key.
    [
      "https://rpc.example.com/v1/secret-key?api-key=secret-key#frag",
      "https://rpc.example.com",
    ],
    // No userinfo.
    ["https://user:secret@rpc.example.com/", "https://rpc.example.com"],
    // An explicit port is kept; a default port is not.
    ["https://rpc.example.com:8443/v1", "https://rpc.example.com:8443"],
    ["https://rpc.example.com:443", "https://rpc.example.com"],
    ["http://rpc.example.com:80", "http://rpc.example.com"],
    // Hosts are case-insensitive; the source is lowercase.
    ["HTTPS://RPC.Example.COM", "https://rpc.example.com"],
    // IPv4 and IPv6 literals.
    ["http://127.0.0.1:8899", "http://127.0.0.1:8899"],
    ["http://[::1]:8899/", "http://[::1]:8899"],
    ["https://[2001:db8::1]", "https://[2001:db8::1]"],
    // Space around the value is not part of it.
    ["  https://rpc.example.com  ", "https://rpc.example.com"],
  ])("reads %j as %j", (value, origin) => {
    expect(cspOriginOf(value)).toBe(origin);
  });

  it.each([
    // Would end the directive and start another.
    "https://a;script-src-elem",
    "https://a;sandbox",
    "https://rpc.example.com;script-src *",
    // Would end the policy in a header list.
    "https://a,b",
    "https://a.example.com,default-src *",
    // Quotes: keyword sources such as 'unsafe-inline' are quoted.
    "https://a'unsafe-inline'",
    "https://'self'",
    'https://a"b',
    // A space would start another source.
    "https://a b",
    "https://rpc.example.com *",
    // Wildcards.
    "https://*.example.com",
    "https://*",
    // Not http(s).
    "wss://rpc.example.com",
    "data:text/plain,x",
    "javascript:alert(1)",
    "blob:https://rpc.example.com/x",
    // Not a URL, or nothing at all.
    "rpc.example.com",
    "not a url",
    "https://",
    "",
    undefined,
    null,
  ])("gives no source for %j", (value) => {
    expect(cspOriginOf(value)).toBeNull();
  });

  it("never returns CSP syntax, whatever the value", () => {
    const values = [
      "https://a;b",
      "https://a,b",
      "https://a'b",
      'https://a"b',
      "https://a*b",
      `https://user:pw@h.example.com:1/p?q=;,'" *`,
      "http://[::1]:1/;",
    ];
    for (const value of values) {
      const origin = cspOriginOf(value);
      if (origin !== null)
        expect(origin).toMatch(/^https?:\/\/[a-z0-9.:[\]-]+$/);
    }
  });
});
