// app/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useProgram } from "@/hooks/useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";

const WalletButton = dynamic(
  () => import("@/components/WalletButton"),
  { ssr: false }
);

export default function Home() {
  const { fetchCourses, getXPBalance } = useProgram();
  const { connected } = useWallet(); // Добавляем хук для проверки подключения
  const [courses, setCourses] = useState<any[]>([]);
  const [xp, setXp] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      console.log("Fetching courses...");
      const data = await fetchCourses();
      console.log("Courses found:", data);
      setCourses(data);
      
      // Запрашиваем баланс только если кошелек подключен
      if (connected) {
        const balance = await getXPBalance();
        console.log("XP Balance:", balance);
        setXp(balance);
      } else {
        setXp(0);
      }
      setIsLoading(false);
    };

    loadData();
  }, [fetchCourses, getXPBalance, connected]); // Перезапускаем при подключении/отключении

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p>Superteam Academy LMS - Stage 2 Test</p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center lg:static lg:h-auto lg:w-auto lg:bg-none">
          <WalletButton />
        </div>
      </div>

      <div className="mt-10 w-full">
        <h2 className="text-2xl font-bold mb-4">On-Chain Data:</h2>
        
        {isLoading ? (
            <p>Loading blockchain data...</p>
        ) : (
            <>
                <div className="p-4 border rounded-lg mb-4">
                  <h3 className="text-xl">Your XP Balance: {xp}</h3>
                  {!connected && <p className="text-sm text-gray-500">Connect wallet to see your XP</p>}
                </div>

                <div className="grid gap-4">
                  <h3 className="text-xl">Active Courses ({courses.length}):</h3>
                  {courses.map((c) => (
                    <div key={c.publicKey.toString()} className="p-4 border rounded bg-gray-900 text-white">
                      <p><strong>ID:</strong> {c.account.courseId}</p>
                      <p><strong>Lessons:</strong> {c.account.lessonCount}</p>
                      <p><strong>XP per Lesson:</strong> {c.account.xpPerLesson.toString()}</p>
                    </div>
                  ))}
                </div>
            </>
        )}
      </div>
    </main>
  );
}