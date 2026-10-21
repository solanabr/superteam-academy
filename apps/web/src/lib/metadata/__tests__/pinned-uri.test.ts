/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module import. */
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  UnpinnableOriginError,
  achievementMetadataUri,
  courseCollectionMetadataUri,
  credentialMetadataUri,
  pinnableOrigin,
} from "../pinned-uri";

const PROD = "https://www.st.academy";
const MAINNET_RPC = "https://mainnet.helius-rpc.com/?api-key=x";
const DEVNET_RPC = "https://api.devnet.solana.com";
const LOCAL_RPC = "http://127.0.0.1:8899";
const LOOPBACK_ORIGINS = [
  "http://localhost:3000",
  "https://localhost",
  "http://[::1]:3000",
  "http://127.0.0.1:3000",
];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("pinnableOrigin", () => {
  it("accepts an https site origin on any cluster", () => {
    for (const rpc of [MAINNET_RPC, DEVNET_RPC, LOCAL_RPC]) {
      expect(pinnableOrigin("https://www.st.academy/en?x=1", rpc)).toBe(PROD);
    }
  });

  it.each(LOOPBACK_ORIGINS)(
    "refuses the loopback origin %s against a mainnet or devnet RPC",
    (origin) => {
      for (const rpc of [MAINNET_RPC, DEVNET_RPC, "https://rpc.example.com"]) {
        expect(() => pinnableOrigin(origin, rpc)).toThrow(
          UnpinnableOriginError
        );
      }
    }
  );

  it.each(LOOPBACK_ORIGINS)(
    "allows the loopback origin %s against a local validator",
    (origin) => {
      vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "localnet");
      expect(pinnableOrigin(origin, LOCAL_RPC)).toBe(new URL(origin).origin);
      expect(pinnableOrigin(origin, "http://localhost:8899")).toBe(
        new URL(origin).origin
      );
    }
  );

  it("refuses a loopback origin on a local validator when the label says mainnet", () => {
    for (const label of ["mainnet", "mainnet-beta", " Mainnet "]) {
      vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", label);
      expect(() => pinnableOrigin("http://localhost:3000", LOCAL_RPC)).toThrow(
        /mainnet/
      );
    }
  });

  it("refuses loopback lookalikes on every cluster, local validator included", () => {
    for (const origin of [
      "http://localhost.evil.com",
      "https://localhost.evil.com",
      "http://127.0.0.1.nip.io:3000",
      "https://127.0.0.1.nip.io",
    ]) {
      for (const rpc of [MAINNET_RPC, DEVNET_RPC, LOCAL_RPC]) {
        expect(() => pinnableOrigin(origin, rpc)).toThrow(
          UnpinnableOriginError
        );
      }
    }
  });

  it("refuses plain http on a public host and non-URLs", () => {
    expect(() => pinnableOrigin("http://www.st.academy", DEVNET_RPC)).toThrow(
      /https/
    );
    expect(() => pinnableOrigin("ftp://www.st.academy", DEVNET_RPC)).toThrow(
      UnpinnableOriginError
    );
    expect(() => pinnableOrigin("/certificates", DEVNET_RPC)).toThrow(
      UnpinnableOriginError
    );
    expect(() => pinnableOrigin("", DEVNET_RPC)).toThrow(UnpinnableOriginError);
  });
});

describe("metadata URIs", () => {
  it("are built on the given origin with a stable path", () => {
    expect(achievementMetadataUri("achievement-first-steps", PROD)).toBe(
      "https://www.st.academy/api/achievements/metadata/achievement-first-steps"
    );
    expect(courseCollectionMetadataUri("course-solana-speedrun", PROD)).toBe(
      "https://www.st.academy/api/certificates/metadata/course-solana-speedrun"
    );
    expect(
      credentialMetadataUri("5b0e5c7e-1f2a-4c3d-9e8f-0a1b2c3d4e5f", PROD)
    ).toBe(
      "https://www.st.academy/api/certificates/metadata?id=5b0e5c7e-1f2a-4c3d-9e8f-0a1b2c3d4e5f"
    );
  });

  it("escape an id rather than letting it change the path", () => {
    expect(achievementMetadataUri("a/../b?c", PROD)).toBe(
      "https://www.st.academy/api/achievements/metadata/a%2F..%2Fb%3Fc"
    );
  });

  it("refuse by default with the test env's localhost origin and devnet RPC", () => {
    // vitest.setup.ts: NEXT_PUBLIC_APP_URL=http://localhost:3000 and a devnet
    // SOLANA_RPC_URL, the exact pairing that must never reach an NFT.
    expect(() => achievementMetadataUri("achievement-x")).toThrow(
      UnpinnableOriginError
    );
    expect(() => courseCollectionMetadataUri("course-x")).toThrow(
      UnpinnableOriginError
    );
    expect(() => credentialMetadataUri("row")).toThrow(UnpinnableOriginError);
  });
});
