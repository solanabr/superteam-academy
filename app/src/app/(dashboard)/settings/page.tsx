// app/src/app/(dashboard)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useWallet } from "@solana/wallet-adapter-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Wallet, LogOut, Unlink } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import dynamic from "next/dynamic";

const WalletButton = dynamic(() => import("@/components/WalletButton"), { ssr: false });

export default function SettingsPage() {
  const { publicKey } = useWallet();
  const { data: session, update: updateSession } = useSession();
  const { userDb, loading: userLoading, refetchUser } = useUser();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
  });

  // Заполнение формы, когда данные юзера загрузились
  useEffect(() => {
    if (userDb) {
      console.log("[Settings] Setting form data from userDb:", userDb);
      setFormData({
        username: userDb.username || "",
        bio: userDb.bio || "",
      });
    }
  }, [userDb]);

  // Логика привязки кошелька
  const linkWallet = async () => {
    if (!publicKey || !session) return;
    try {
      const res = await fetch("/api/user/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toString() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success("Wallet linked successfully!");
      await updateSession({ walletAddress: publicKey.toString() });
      await refetchUser(); // Перезапрашиваем данные с сервера
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Сохранение профиля
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey?.toString(), 
          username: formData.username,
          bio: formData.bio
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success("Profile updated successfully!");
      await refetchUser(); // Обновляем локальный state, чтобы заблокировать инпут username
    } catch (error) {
      toast.error("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const unlinkProvider = async (provider: string) => {
    try {
      const res = await fetch("/api/auth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) throw new Error("Failed to unlink");

      toast.success(`${provider} disconnected`);
      await refetchUser();
    } catch (error) {
      toast.error("Error disconnecting account");
    }
  };

  if (userLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  // Проверяем, привязан ли GitHub, просматривая массив accounts
  const githubAccount = userDb?.accounts?.find((acc: any) => acc.provider === "github");
  // Имя для отображения (берем из сессии или из БД)
  const githubDisplayName = githubAccount ? (userDb?.githubHandle || session?.user?.name || "Connected") : null;

  // Заблокирован ли инпут Username? (Если он уже есть в БД и он не пустой)
  const isUsernameLocked = !!userDb?.username && userDb.username.trim() !== "";

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* 1. Блок Кошелька */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>Required to receive XP and Credentials.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                        <p className="font-medium">Solana Wallet</p>
                        <p className="text-sm text-muted-foreground">
                            {userDb?.walletAddress 
                                ? `${userDb.walletAddress.slice(0, 6)}...${userDb.walletAddress.slice(-4)}` 
                                : "Not linked"}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                  {session && publicKey && (!userDb?.walletAddress || userDb.walletAddress !== publicKey.toString()) ? (
                      <Button size="sm" onClick={linkWallet} variant="secondary">
                          Link Current Wallet
                      </Button>
                  ) : null}
                    <WalletButton /> 
                </div>
            </div>
        </CardContent>
      </Card>

      {/* 2. Public Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>Your identity on the leaderboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="Set your unique username" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                disabled={isUsernameLocked} // Блокируем, если уже установлен
                className={isUsernameLocked ? "bg-muted cursor-not-allowed text-muted-foreground" : ""}
              />
              {isUsernameLocked && <p className="text-xs text-amber-500">Username cannot be changed once set.</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                placeholder="Tell us about yourself" 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            {/* Social Connections */}
            <div className="space-y-2 pt-2 border-t mt-6">
                <Label>GitHub Account</Label>
                {githubAccount ? (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                        <div className="flex items-center gap-2">
                            <FaGithub className="h-5 w-5" />
                            <span className="font-medium">{githubDisplayName}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => unlinkProvider('github')} type="button" className="text-muted-foreground hover:text-destructive">
                            <Unlink className="h-4 w-4 mr-2" /> Disconnect
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" className="w-full gap-2 justify-start" onClick={() => signIn('github')} type="button">
                        <FaGithub /> Connect GitHub
                    </Button>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Profile
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* 3. Опасная зона (Выход) */}
      {session && (
          <div className="flex justify-end">
             <Button variant="ghost" className="text-muted-foreground" onClick={() => signOut()}>
                 <LogOut className="mr-2 h-4 w-4" /> Sign Out
             </Button>
          </div>
      )}
    </div>
  );
}