// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import {
  ConnectionProvider,
  useConnection,
} from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import { LabConnectionProvider, useLabConnection } from "../lab-connection";

const APP_RPC = "https://api.mainnet-beta.solana.com";
const LAB_RPC = "https://devnet.rpc.example.com";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SOLANA_RPC_URL: "https://api.mainnet-beta.solana.com",
    NEXT_PUBLIC_LAB_RPC_URL: "https://devnet.rpc.example.com",
  },
}));

afterEach(cleanup);

function Probe({ seen }: { seen: { app: Connection[]; lab: Connection[] } }) {
  seen.app.push(useConnection().connection);
  seen.lab.push(useLabConnection().connection);
  return null;
}

describe("LabConnectionProvider", () => {
  it("gives the lab its own connection, next to the app connection", () => {
    const seen = { app: [] as Connection[], lab: [] as Connection[] };
    render(
      <ConnectionProvider endpoint={APP_RPC}>
        <LabConnectionProvider>
          <Probe seen={seen} />
        </LabConnectionProvider>
      </ConnectionProvider>
    );
    expect(seen.app[0]!.rpcEndpoint).toBe(APP_RPC);
    expect(seen.lab[0]!.rpcEndpoint).toBe(LAB_RPC);
    expect(seen.lab[0]!.commitment).toBe("confirmed");
  });

  it("keeps one connection across renders", () => {
    const seen = { app: [] as Connection[], lab: [] as Connection[] };
    const tree = () => (
      <ConnectionProvider endpoint={APP_RPC}>
        <LabConnectionProvider>
          <Probe seen={seen} />
        </LabConnectionProvider>
      </ConnectionProvider>
    );
    const { rerender } = render(tree());
    rerender(tree());
    rerender(tree());
    expect(seen.lab.length).toBeGreaterThanOrEqual(3);
    expect(new Set(seen.lab).size).toBe(1);
  });

  it("throws outside the provider instead of falling back to the app connection", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    function Lone() {
      useLabConnection();
      return null;
    }
    expect(() =>
      render(
        <ConnectionProvider endpoint={APP_RPC}>
          <Lone />
        </ConnectionProvider>
      )
    ).toThrow(/LabConnectionProvider/);
    error.mockRestore();
  });
});
