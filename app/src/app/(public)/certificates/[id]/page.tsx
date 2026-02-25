// app/src/app/(public)/certificates/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Twitter, CheckCircle2, Share2 } from "lucide-react";
import Link from "next/link";

export default function CertificatePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/certificate/${id}`)
      .then((res) => res.json())
      .then((data) => {
          if (!data.error) setData(data);
          setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Skeleton className="h-96 w-96 rounded-xl" /></div>;
  if (!data) return <div className="flex h-screen items-center justify-center">Certificate Not Found</div>;

  // Парсим данные DAS API
  const name = data.content?.metadata?.name || "Unknown Certificate";
  const image = data.content?.links?.image || data.content?.files?.[0]?.uri;
  const attributes = data.content?.metadata?.attributes || [];
  const owner = data.ownership?.owner;

  // Ищем конкретные атрибуты
  const level = attributes.find((a: any) => a.trait_type === "Level")?.value;
  const xp = attributes.find((a: any) => a.trait_type === "Total XP")?.value;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : "";
  const shareText = `I just earned my ${name} on Superteam Academy! Check it out:`;

  return (
    <div className="container max-w-4xl py-20">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Image (3D Card Effect можно добавить сюда же) */}
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <img 
                src={image} 
                alt={name} 
                className="relative rounded-xl shadow-2xl w-full object-cover aspect-square border border-white/10" 
            />
        </div>

        {/* Right: Info */}
        <div className="space-y-8">
            <div>
                <Badge className="mb-4 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 px-4 py-1">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Verified On-Chain
                </Badge>
                <h1 className="text-4xl font-extrabold tracking-tight mb-2">{name}</h1>
                <p className="text-muted-foreground text-lg">Issued by Superteam Academy</p>
            </div>

            <Card className="bg-muted/30 border-muted">
                <CardContent className="p-6 grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Recipient</p>
                        <p className="font-mono text-sm truncate" title={owner}>
                            {owner?.slice(0, 6)}...{owner?.slice(-4)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Mint Address</p>
                        <Link href={`https://core.metaplex.com/explorer/${id}?env=devnet`} target="_blank" className="font-mono text-sm text-blue-400 hover:underline flex items-center gap-1">
                            {id.slice(0, 6)}... <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                    {level && (
                        <div>
                            <p className="text-sm text-muted-foreground">Level</p>
                            <p className="font-bold text-lg">{level}</p>
                        </div>
                    )}
                    {xp && (
                        <div>
                            <p className="text-sm text-muted-foreground">Total XP</p>
                            <p className="font-bold text-lg">{xp}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button className="flex-1 gap-2" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}>
                    <Twitter className="h-4 w-4" /> Share Achievement
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => navigator.clipboard.writeText(shareUrl)}>
                    <Share2 className="h-4 w-4" /> Copy Link
                </Button>
            </div>
        </div>

      </div>
    </div>
  );
}