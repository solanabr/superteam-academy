import { describe, it, expect } from "vitest";
import {
  DEFAULT_LAB_RPC_URL,
  labRpcCspSources,
  labRpcUrlOrDefault,
} from "../lab-rpc.mjs";

describe("labRpcUrlOrDefault", () => {
  it("is the public devnet endpoint by default", () => {
    expect(DEFAULT_LAB_RPC_URL).toBe("https://api.devnet.solana.com");
  });

  it.each([undefined, null, "", "   "])(
    "falls back to the default for %j",
    (value) => {
      expect(labRpcUrlOrDefault(value)).toBe(DEFAULT_LAB_RPC_URL);
    }
  );

  it("keeps a configured value, trimmed", () => {
    expect(labRpcUrlOrDefault(" https://devnet.rpc.example.com/v1 ")).toBe(
      "https://devnet.rpc.example.com/v1"
    );
  });
});

describe("labRpcCspSources", () => {
  it("is the default endpoint's origin and its WebSocket twin when unset", () => {
    expect(labRpcCspSources(undefined)).toEqual([
      "https://api.devnet.solana.com",
      "wss://api.devnet.solana.com",
    ]);
  });

  it("is the origin only: no path, query or credentials", () => {
    expect(
      labRpcCspSources("https://user:pw@devnet.rpc.example.com:8443/v1?k=v")
    ).toEqual([
      "https://devnet.rpc.example.com:8443",
      "wss://devnet.rpc.example.com:8443",
    ]);
  });

  it("pairs an http origin with ws", () => {
    expect(labRpcCspSources("http://localhost:8899")).toEqual([
      "http://localhost:8899",
      "ws://localhost:8899",
    ]);
  });

  it.each([
    "not a url",
    "https://*.rpc.example.com",
    "wss://devnet.rpc.example.com",
    "data:text/plain,x",
    "javascript:alert(1)",
  ])("adds nothing for %j", (value) => {
    expect(labRpcCspSources(value)).toEqual([]);
  });
});
