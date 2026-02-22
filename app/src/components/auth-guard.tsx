// app/src/components/auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { connected, publicKey } = useWallet();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 1. Если это главная страница - проверки не нужны, там своя логика редиректа ВНУТРЬ
    if (pathname === "/") {
        setIsChecking(false);
        return;
    }

    // 2. Ждем инициализации
    if (status === "loading") return;

    // 3. Проверяем авторизацию
    const isAuthenticated = connected || status === "authenticated";

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to /");
      router.replace("/"); // Используем replace, чтобы не засорять историю
    } else {
      setIsChecking(false);
    }
  }, [connected, status, router, pathname]);

  // Если мы на главной - рендерим сразу (там свой контент)
  if (pathname === "/") {
      return <>{children}</>;
  }

  // Если идет проверка или загрузка сессии - показываем лоадер
  if (isChecking || status === "loading") {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      );
  }

  // Если проверка пройдена
  return <>{children}</>;
}