"use client";

import { useMemo } from "react";
import { Program } from "@coral-xyz/anchor";
import { useAnchorProvider } from "./use-anchor-provider";
import { IDL } from "@/anchor/idl";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useProgram(): Program<any> | null {
  const provider = useAnchorProvider();

  return useMemo(() => {
    if (!provider) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Program(IDL as any, provider);
  }, [provider]);
}
