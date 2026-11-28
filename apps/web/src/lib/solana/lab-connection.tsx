"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Connection } from "@solana/web3.js";
import { env } from "@/lib/env";

interface LabConnectionState {
  connection: Connection;
}

const LabConnectionContext = createContext<LabConnectionState | null>(null);

/**
 * The lab's own connection, on `NEXT_PUBLIC_LAB_RPC_URL` (public devnet by
 * default). The deploy panel, the funding card and the program explorer read
 * it through {@link useLabConnection}. Enrolment and everything else keep the
 * app connection from wallet-adapter's `useConnection()`.
 */
export function LabConnectionProvider({ children }: { children: ReactNode }) {
  // One Connection for the provider's lifetime, like wallet-adapter's own.
  const value = useMemo<LabConnectionState>(
    () => ({
      connection: new Connection(env.NEXT_PUBLIC_LAB_RPC_URL, "confirmed"),
    }),
    []
  );
  return (
    <LabConnectionContext.Provider value={value}>
      {children}
    </LabConnectionContext.Provider>
  );
}

/**
 * The lab connection. Throws outside {@link LabConnectionProvider}: a lab
 * action must never fall back to the app connection, which can be on mainnet.
 */
export function useLabConnection(): LabConnectionState {
  const value = useContext(LabConnectionContext);
  if (!value) {
    throw new Error(
      "useLabConnection must be used inside LabConnectionProvider"
    );
  }
  return value;
}
