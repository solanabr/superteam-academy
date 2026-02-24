"use client";

import { useMemo } from "react";
import { type Idl, Program } from "@coral-xyz/anchor";
import { useAnchorProvider } from "./use-anchor-provider";
import { IDL } from "@/anchor/idl";

export function useProgram(): Program<Idl> | null {
  const provider = useAnchorProvider();

  return useMemo(() => {
    if (!provider) return null;
    return new Program(IDL as Idl, provider);
  }, [provider]);
}
