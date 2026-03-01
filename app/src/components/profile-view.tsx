// app/src/components/profile-view.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Twitter, Github, Calendar, ExternalLink, Share2, Award, BookOpen, Lock } from "lucide-react";
import { XpStatCard } from "@/components/xp-stat-card";
import { CredentialCard } from "@/components/credential-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useCredentials, CredentialNFT } from "@/hooks/useCredentials"; // Импортируем хук и тип
import dynamic from "next/dynamic";
import Image from "next/image"

// Тип для пропсов, чтобы обеспечить строгую типизацию
// В будущем его можно вынести в @/types/index.ts
type UserProfile = {
    id: string;
    image?: string | null;
    username?: string | null;
    walletAddress?: string | null;
    bio?: string | null;
    twitterHandle?: string | null;
    githubHandle?: string | null;
    xp: number;
    enrollments: { courseId: string; enrolledAt: string; }[];
    achievements: { 
        id: string;
        mintAddress: string | null;
        achievement: {
            id: string;
            name: string; 
            image: string; 
            description: string; 
        }; 
    }[];
};

interface ProfileViewProps {
  user: UserProfile;
  isPublic?: boolean; // Флаг, чтобы скрыть/показать кнопки управления
}

type AchievementType = {
    id: string;
    slug: string;
    name: string;
    description: string;
    image: string;
    xpReward: number;
};

const SkillChart = dynamic(
  () => import("@/components/skill-chart").then((mod) => mod.SkillChart),
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[350px] w-full rounded-full opacity-20" /> 
  }
);

export function ProfileView({ user, isPublic = false }: ProfileViewProps) {
  const { credentials, loading: nftLoading } = useCredentials(user.walletAddress || undefined);
  const [allAchievements, setAllAchievements] = useState<AchievementType[]>([]);
  
  
  const joinDate = new Date(parseInt(user.id.substring(0, 8), 16) * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
      fetch('/api/achievements').then(res => res.json()).then(setAllAchievements);
  }, []);

  const isUnlocked = (achId: string) => user.achievements.some(ua => ua.achievement.id === achId);

  const categories = {
      "Progress": allAchievements.filter(a => ["first-steps", "course-completer", "speed-runner"].includes(a.slug)),
      "Streaks": allAchievements.filter(a => a.slug.includes("streak") || ["week-warrior", "monthly-master", "consistency-king"].includes(a.slug)),
      "Skills": allAchievements.filter(a => ["rust-rookie", "anchor-expert", "full-stack-solana"].includes(a.slug)),
      "Community": allAchievements.filter(a => ["helper", "early-adopter"].includes(a.slug)),
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* 1. Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={user.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.walletAddress}`} alt={`${user.username || 'User'} avatar`} />
            <AvatarFallback>{user.username?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4">
            <div>
                <h1 className="text-3xl font-bold">{user.username || "Anonymous Learner"}</h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground mt-2 text-sm">
                    {user.walletAddress && (
                        <div className="flex items-center gap-1 font-mono bg-muted px-2 py-1 rounded">
                            {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </div>
                    )}
                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {joinDate}</div>
                </div>
            </div>
            
            {user.bio && <p className="text-muted-foreground max-w-2xl">{user.bio}</p>}

            <div className="flex gap-3">
                {user.twitterHandle && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`https://twitter.com/${user.twitterHandle}`, '_blank')}>
                        <Twitter className="h-4 w-4 text-blue-400" /> @{user.twitterHandle}
                    </Button>
                )}
                {user.githubHandle && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`https://github.com/${user.githubHandle}`, '_blank')}>
                        <Github className="h-4 w-4" /> {user.githubHandle}
                    </Button>
                )}
                <Button size="sm" className="gap-2 ml-auto md:ml-0">
                    <Share2 className="h-4 w-4" /> Share Profile
                </Button>
            </div>
        </div>
      </div>

      {/* 2. Stats Row */}
      <XpStatCard />

      {/* 3. Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8 mt-6">
            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader><CardTitle>Skill Radar</CardTitle></CardHeader>
                    <CardContent>
                        <SkillChart xp={user.xp} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Achievements</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(categories).map(([category, items]) => (
                            items.length > 0 && (
                                <div key={category}>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{category}</h4>
                                    <div className="grid grid-cols-4 gap-4">
                                        {items.map((ach) => {
                                            const unlocked = isUnlocked(ach.id);
                                            return (
                                                <div key={ach.id} className="flex flex-col items-center gap-2 text-center group relative cursor-help">
                                                    <div className={`h-14 w-14 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all ${unlocked ? 'border-yellow-500 shadow-lg bg-yellow-500/10' : 'border-muted bg-muted opacity-50 grayscale'}`}>
                                                        <Image src={ach.image} alt={ach.name} fill className="h-full w-full object-cover" />
                                                        {!unlocked && <Lock className="absolute h-5 w-5 text-muted-foreground/50" />}
                                                    </div>
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-2 hidden group-hover:block w-40 bg-popover text-popover-foreground text-xs p-2 rounded shadow-md z-20 border">
                                                        <p className="font-bold">{ach.name}</p>
                                                        <p className="text-muted-foreground">{ach.description}</p>
                                                        <p className="text-yellow-500 mt-1">+{ach.xpReward} XP</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        ))}
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
            <Card>
                <CardHeader><CardTitle>Enrolled Courses</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {user.enrollments.length > 0 ? user.enrollments.map((enrollment, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-purple-500/20 rounded flex items-center justify-center text-purple-500"><BookOpen className="h-5 w-5" /></div>
                                <div>
                                    <h4 className="font-semibold">{enrollment.courseId}</h4>
                                    <p className="text-xs text-muted-foreground">Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <Link href={`/courses/${enrollment.courseId}`}><Button variant="ghost" size="sm">Continue</Button></Link>
                        </div>
                    )) : (<p className="text-muted-foreground">No active courses.</p>)}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nftLoading ? (
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                ) : credentials.length > 0 ? (
                    credentials.map((nft: CredentialNFT) => (
                        <div key={nft.id} className="aspect-[3/4] cursor-pointer" onClick={() => window.open(`/certificates/${nft.id}`, '_blank')}>
                            <CredentialCard 
                                name={nft.name}
                                imageUrl={nft.image}
                                level={parseInt(nft.attributes.find(a => a.trait_type === "Level")?.value || "1")}
                            />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center border rounded-lg border-dashed">
                        <p className="text-muted-foreground">No credentials yet.</p>
                    </div>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}