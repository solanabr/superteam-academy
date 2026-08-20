// @vitest-environment jsdom
import type { ReactNode } from "react";
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  AmbientWalletProvider,
  useHasAmbientWallet,
  useOptionalWallet,
} from "../optional-wallet";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AmbientWalletProvider>{children}</AmbientWalletProvider>
);

describe("useOptionalWallet (#1097)", () => {
  it("returns null with no provider stack above it", () => {
    const { result } = renderHook(() => useOptionalWallet());
    expect(result.current).toBeNull();
  });

  it("returns the wallet context under AmbientWalletProvider", () => {
    const { result } = renderHook(() => useOptionalWallet(), { wrapper });
    expect(result.current).not.toBeNull();
    // The wallet-adapter context shape, not some substitute.
    expect(result.current).toHaveProperty("connected");
  });
});

describe("useHasAmbientWallet (#1097)", () => {
  it("is false outside and true inside the provider", () => {
    expect(renderHook(() => useHasAmbientWallet()).result.current).toBe(false);
    expect(
      renderHook(() => useHasAmbientWallet(), { wrapper }).result.current
    ).toBe(true);
  });
});
