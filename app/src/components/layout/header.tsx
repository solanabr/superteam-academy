"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserStore } from "@/lib/store/user-store";
import type { Locale } from "@/types";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Moon, SunMedium } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export function Header() {
  const tCommon = useTranslations("Common");
  const tHeader = useTranslations("Header");
  const locale = useUserStore((state) => state.locale);
  const setLocale = useUserStore((state) => state.setLocale);
  const setWalletAddress = useUserStore((state) => state.setWalletAddress);
  const { resolvedTheme, setTheme } = useTheme();
  const wallet = useWallet();

  useEffect(() => {
    setWalletAddress(wallet.publicKey?.toBase58());
  }, [wallet.publicKey, setWalletAddress]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090c14]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono text-sm font-semibold tracking-[0.2em] text-white">
            {tCommon("brand")}
          </Link>
          <p className="hidden text-xs text-zinc-400 md:block">{tHeader("tagline")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            <SelectTrigger className="h-9 w-[108px] border-white/15 bg-zinc-900/60 text-xs text-zinc-200">
              <SelectValue placeholder={tCommon("language")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="pt-BR">PT-BR</SelectItem>
              <SelectItem value="es">ES</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-white/15 bg-zinc-900/60"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <WalletMultiButton className="!h-9 !rounded-md !bg-gradient-to-r !from-[#9945FF] !to-[#14F195] !px-3 !text-black" />
        </div>
      </div>
    </header>
  );
}
