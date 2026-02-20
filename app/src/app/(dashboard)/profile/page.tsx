// app/src/app/(dashboard)/profile/page.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Twitter, ExternalLink } from "lucide-react";
import { XpStatCard } from "@/components/xp-stat-card";
import { SkillChart } from "@/components/skill-chart";
import { CredentialCard } from "@/components/credential-card";

export default function ProfilePage() {
  const { publicKey } = useWallet();

  const handleShare = () => {
    const text = "I've reached Level 5 on Superteam Academy, the on-chain LMS for Solana developers! Check it out: ";
    const url = "https://your-project-url.com";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Шапка Профиля */}
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey.toString()}`} />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-3xl font-bold">Your Profile</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              {publicKey.toString()}
              <a href={`https://solscan.io/account/${publicKey.toString()}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </p>
          </div>
        </div>
        <Button onClick={handleShare}>
            <Twitter className="mr-2 h-4 w-4" /> Share on Twitter
        </Button>
      </div>

      {/* Статистика XP (переиспользуем компонент с дашборда) */}
      <XpStatCard />

      {/* Основная сетка: График + NFT */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>My Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillChart />
          </CardContent>
        </Card>
        
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
            <h3 className="col-span-full text-xl font-semibold">Credentials</h3>
            {/* Mock NFT */}
            <div className="aspect-[3/4]">
                <CredentialCard 
                    name="Solana Basics"
                    level={3}
                    imageUrl="https://arweave.net/Yx0n2TqR0GqNeJnoYx4SMCjZt0r9uS-KRwQoK_vG2Wc" // Красивая картинка для демо
                />
            </div>
            
            {/* Заглушка для будущего NFT */}
            <Card className="aspect-[3/4] flex items-center justify-center border-dashed">
                <p className="text-muted-foreground">Coming Soon</p>
            </Card>
        </div>
      </div>
    </div>
  );
}