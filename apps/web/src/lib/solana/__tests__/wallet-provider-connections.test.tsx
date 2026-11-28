// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useLabConnection } from "../lab-connection";
import { SolanaWalletProvider } from "../wallet-provider";

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SOLANA_RPC_URL: "https://api.mainnet-beta.solana.com",
    NEXT_PUBLIC_LAB_RPC_URL: "https://api.devnet.solana.com",
  },
}));
vi.mock("@/components/auth/wallet-auth-handler", () => ({
  WalletAuthHandler: () => null,
}));
vi.mock("@solana/wallet-adapter-react-ui/styles.css", () => ({}));

afterEach(cleanup);

describe("SolanaWalletProvider", () => {
  it("keeps the app connection on the app RPC and gives the lab its own", () => {
    const seen = { app: "", lab: "" };
    function Probe() {
      seen.app = useConnection().connection.rpcEndpoint;
      seen.lab = useLabConnection().connection.rpcEndpoint;
      return null;
    }
    render(
      <SolanaWalletProvider>
        <Probe />
      </SolanaWalletProvider>
    );
    expect(seen.app).toBe("https://api.mainnet-beta.solana.com");
    expect(seen.lab).toBe("https://api.devnet.solana.com");
  });
});
