// app/src/hooks/useUser.ts
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";

export interface Enrollment {
    courseId: string;
    enrolledAt: string;
    progressPercent?: number; // <-- НОВОЕ ПОЛЕ
    completedLessons: number;
    totalLessons: number;
}

export function useUser() {
  const { publicKey } = useWallet();
  const { status } = useSession(); // Следим за статусом сессии NextAuth
  const [userDb, setUserDb] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    // Ждем, пока NextAuth определится со своим состоянием
    if (status === "loading") return;

    setLoading(true);
    const walletStr = publicKey ? publicKey.toString() : "";
    
    console.log(`[useUser Hook] Fetching data... Auth status: ${status}, Wallet: ${walletStr}`);

    try {
      const res = await fetch(`/api/user/me?wallet=${walletStr}`);
      if (res.ok) {
        const data = await res.json();
        console.log("[useUser Hook] Data received:", data);
        setUserDb(data);
        if (data.walletAddress) {
          const enrollRes = await fetch(`/api/user/enrollments?wallet=${data.walletAddress}`);
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            setEnrollments(enrollData);
          }
        }
      } else {
        console.log("[useUser Hook] User not found in DB or not logged in.");
        setUserDb(null);
        setEnrollments([]);
      }
    } catch (err) {
      console.error("[useUser Hook] Fetch failed:", err);
      setUserDb(null);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, status]);

  // Запускаем fetch при изменении кошелька или сессии
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
    enrollments,
    // ИСПРАВЛЕНИЕ: Добавляем achievements
    achievements: userDb?.achievements || [],
    loading,
    saveCode,
    refetchUser: fetchUser
  };
}