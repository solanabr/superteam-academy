"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export default function SettingsPage() {
  const { address, authenticated, login, logout } = useWallet();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");

  const switchLocale = (l: string) => {
    router.push(pathname.replace("/" + locale, "/" + l));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="flex flex-col gap-6">
        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="font-bold mb-4">Account</h2>
          <div className="flex items-center justify-between">
            <div><div className="text-sm font-medium">Wallet</div><div className="text-xs text-muted-foreground">{address || "Not connected"}</div></div>
            {authenticated ? <Button variant="outline" onClick={() => logout()}>Disconnect</Button> : <Button onClick={() => login()}>Connect</Button>}
          </div>
        </div>
        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="font-bold mb-4">Language</h2>
          <div className="flex gap-2">
            {["en", "pt-BR", "es"].map(l => (
              <button key={l} onClick={() => switchLocale(l)}
                className={"px-4 py-2 rounded-lg border text-sm transition-all " + (locale === l ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50")}
              >{l === "pt-BR" ? "Português" : l === "es" ? "Español" : "English"}</button>
            ))}
          </div>
        </div>
        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="font-bold mb-4">Privacy</h2>
          <div className="flex items-center justify-between">
            <div><div className="text-sm font-medium">Public Profile</div><div className="text-xs text-muted-foreground">Allow others to view your profile</div></div>
            <button className="w-12 h-6 rounded-full bg-primary relative"><span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}