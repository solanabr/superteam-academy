"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/lib/supabase";

interface ProfileData {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function useProfile() {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!publicKey || !supabase) { setProfile(null); return; }
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("wallet_address", publicKey.toBase58())
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [publicKey]);

  return profile;
}
