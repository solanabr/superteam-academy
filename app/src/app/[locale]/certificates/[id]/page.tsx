"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalLink, Copy, Share2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LevelBadge } from "@/components/gamification/level-badge";
import { toast } from "sonner";

export default function CertificatePage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("profile");

  // Mock credential data
  const credential = {
    address: id,
    name: "Solana 101 Credential",
    image: null,
    trackId: 1,
    level: 1,
    coursesCompleted: 3,
    totalXp: 4500,
    owner: "7xK4...3mNp",
    collection: "HgbT...feVX",
    uri: "https://arweave.net/credential-metadata",
  };

  const explorerUrl = `https://explorer.solana.com/address/${id}?cluster=devnet`;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(
      `I earned the "${credential.name}" credential on Superteam Academy! 🎓⚡`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`,
      "_blank"
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{credential.name}</h1>
        <p className="text-muted-foreground">{t("credential")}</p>
      </div>

      {/* Credential Display */}
      <Card className="mb-8 overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-superteam-purple/30 via-superteam-blue/20 to-superteam-green/30 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <p className="text-xl font-bold gradient-text">{credential.name}</p>
          </div>
        </div>
        <CardContent className="p-6">
          {/* Attributes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Track</div>
              <Badge variant="outline">Core Solana</Badge>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Level</div>
              <LevelBadge level={credential.level} size="sm" className="mx-auto" />
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Courses</div>
              <span className="font-bold">{credential.coursesCompleted}</span>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Total XP</div>
              <span className="font-bold text-superteam-green">
                {credential.totalXp.toLocaleString()}
              </span>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* On-chain Info */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mint Address</span>
              <code className="font-mono text-xs">{`${id.slice(0, 8)}...${id.slice(-8)}`}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner</span>
              <code className="font-mono text-xs">{credential.owner}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collection</span>
              <code className="font-mono text-xs">{credential.collection}</code>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={shareTwitter}>
              <Share2 className="h-4 w-4 mr-2" />
              Share on Twitter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
