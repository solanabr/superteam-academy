// app/src/components/auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation"; 
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useUser } from "@/hooks/useUser"; // Импортируем useUser

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  const { status } = useSession();
  const { userDb, loading: userLoading } = useUser(); // Получаем данные юзера
  
  const router = useRouter();
  const pathname = usePathname(); 
  const locale = useLocale();
  const [isChecking, setIsChecking] = useState(true);

  const publicPaths = ["/", "/courses", "/onboarding"]; // Добавили onboarding в исключения

  const isPublic = publicPaths.includes(pathname) || pathname.startsWith("/courses/");

  useEffect(() => {
    if (isPublic) {
        setIsChecking(false);
        return;
    }

    // Ждем окончания загрузки сессии и данных юзера из БД
    if (status === "loading" || userLoading) return;

    const isAuthenticated = connected || status === "authenticated";

    if (!isAuthenticated) {
      console.log("AuthGuard: Access denied, redirecting to /");
      router.replace("/"); 
    } 
    // НОВАЯ ЛОГИКА: Если залогинен, но не прошел онбординг, и находится НЕ на странице онбординга
    else if (userDb && !userDb.hasCompletedOnboarding && pathname !== "/onboarding") {
        console.log("AuthGuard: User needs onboarding, redirecting...");
        router.replace("/onboarding");
    }
    else {
      setIsChecking(false);
    }
  }, [connected, status, router, pathname, isPublic, userDb, userLoading]);

  if (isPublic) return <>{children}</>;

  if (isChecking || status === "loading" || userLoading) {
      return (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  return <>{children}</>;
}