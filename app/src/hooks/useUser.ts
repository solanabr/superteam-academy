// app/src/hooks/useUser.ts
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

// Тип для Enrollments
interface Enrollment {
    courseId: string;
    enrolledAt: string;
}

export function useUser() {
  const { publicKey } = useWallet();
  const [userDb, setUserDb] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Синхронизация при подключении кошелька
  useEffect(() => {
    if (publicKey) {
      setLoading(true);
      const wallet = publicKey.toString();

      // 1. Синхронизируем юзера
      fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet }),
      })
      .then((res) => res.json())
      .then((data) => setUserDb(data))
      .catch((err) => console.error("Sync failed:", err));

      // 2. Получаем список курсов
      fetch(`/api/user/enrollments?wallet=${wallet}`)
      .then((res) => res.json())
      .then((data) => setEnrollments(data))
      .catch((err) => console.error("Enrollments fetch failed:", err))
      .finally(() => setLoading(false));

    } else {
      setUserDb(null);
      setEnrollments([]);
      setLoading(false);
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
    enrollments, // Теперь возвращаем список курсов
    loading,
    saveCode,
  };
}