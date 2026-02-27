"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation"; 
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  const { status } = useSession();
  const router = useRouter();
  
  // УМНЫЙ usePathname ВОЗВРАЩАЕТ ПУТЬ БЕЗ ЛОКАЛИ (например, "/dashboard")
  const pathname = usePathname(); 
  const [isChecking, setIsChecking] = useState(true);

  // Список публичных путей, куда можно без логина
  const publicPaths = ["/", "/courses"]; 

  // Проверка: является ли текущий путь публичным
  // Также пускаем на детальные страницы курсов (например, /courses/anchor-101)
  const isPublic = publicPaths.includes(pathname) || pathname.startsWith("/courses/");

  useEffect(() => {
    // Если путь публичный - проверки не нужны, пропускаем сразу
    if (isPublic) {
        setIsChecking(false);
        return;
    }

    if (status === "loading") return;

    const isAuthenticated = connected || status === "authenticated";

    if (!isAuthenticated) {
      console.log("AuthGuard: Access denied, redirecting to /");
      router.replace("/"); // Кидаем на главную (на Лендинг)
    } else {
      setIsChecking(false);
    }
  }, [connected, status, router, pathname, isPublic]);

  if (isPublic) return <>{children}</>;

  if (isChecking || status === "loading") {
      return (
        <div className="h-screen w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  return <>{children}</>;
}