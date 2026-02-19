// app/src/hooks/useUser.ts
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export function useUser() {
  const { publicKey } = useWallet();
  const [userDb, setUserDb] = useState<any>(null);

  // Синхронизация при подключении кошелька
  useEffect(() => {
    if (publicKey) {
      fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toString() }),
      })
      .then((res) => res.json())
      .then((data) => setUserDb(data))
      .catch((err) => console.error("Sync failed:", err));
    } else {
      setUserDb(null);
    }
  }, [publicKey]);

  const saveCode = useCallback(async (courseId: string, lessonIndex: number, code: string) => {
    if (!publicKey) return;
    
    await fetch("/api/lesson/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: publicKey.toString(),
        courseId,
        lessonIndex,
        code
      }),
    });
  }, [publicKey]);

  return {
    userDb,
    saveCode,
  };
}