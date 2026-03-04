"use client";

import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocale } from "@/contexts/locale-context";
import { useLearning } from "@/contexts/learning-context";
import { getCourseById } from "@/services/course-data";
import { SOLANA_NETWORK } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Award,
  ExternalLink,
  Twitter,
  CheckCircle,
  Zap,
  Copy,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

export default function CertificatePage() {
  const params = useParams();
  const id = params.id as string;
  const { t } = useLocale();
  const { publicKey } = useWallet();
  const { credentials } = useLearning();
  const [copied, setCopied] = useState(false);

  const course = getCourseById(id);
  const credential = credentials.find(
    (c) => c.assetId === id || c.trackId.toString() === id
  );

  const walletStr = publicKey?.toBase58() ?? "Unknown";
  const shortWallet = `${walletStr.slice(0, 8)}...${walletStr.slice(-4)}`;
  const mintAddress = credential?.mintAddress || "Cred1...xyz";
  const explorerUrl = `https://explorer.solana.com/address/${mintAddress}?cluster=${SOLANA_NETWORK}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `I just earned my ${course?.title || "Superteam Academy"} credential on @solana! Verified on-chain. #SuperteamAcademy #Solana`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      "_blank"
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Certificate Visual */}
        <Card className="relative overflow-hidden border-2 border-violet-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5" />
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />

          <CardContent className="relative p-8 sm:p-12">
            <div className="text-center">
              {/* Badge */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
                <Award className="h-10 w-10 text-white" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold sm:text-3xl">
                {t("certificate.title")}
              </h1>

              <Separator className="mx-auto my-6 w-24" />

              {/* Issued To */}
              <p className="text-sm text-muted-foreground">
                {t("certificate.issuedTo")}
              </p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {shortWallet}
              </p>

              <Separator className="mx-auto my-6 w-24" />

              {/* Course */}
              <p className="text-sm text-muted-foreground">
                {t("certificate.for")}
              </p>
              <h2 className="mt-1 text-xl font-bold gradient-text">
                {course?.title || credential?.name || "Superteam Academy Course"}
              </h2>

              {course && (
                <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.lessonCount} {t("courses.lessons")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-violet-500" />
                    {course.lessonCount * course.xpPerLesson} XP
                  </span>
                </div>
              )}

              <Separator className="mx-auto my-6 w-24" />

              {/* Verification Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-500">
                <CheckCircle className="h-4 w-4" />
                {t("certificate.onChain")}
              </div>

              {/* Decorative elements */}
              <div className="absolute left-4 top-4 h-16 w-16 rounded-full border-2 border-violet-500/10" />
              <div className="absolute right-4 top-4 h-16 w-16 rounded-full border-2 border-fuchsia-500/10" />
              <div className="absolute bottom-4 left-4 h-16 w-16 rounded-full border-2 border-fuchsia-500/10" />
              <div className="absolute bottom-4 right-4 h-16 w-16 rounded-full border-2 border-violet-500/10" />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("certificate.viewOnExplorer")}
            </a>
          </Button>
          <Button variant="outline" onClick={handleShareTwitter}>
            <Twitter className="mr-2 h-4 w-4" />
            {t("certificate.shareTwitter")}
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
        </div>

        {/* NFT Details */}
        <Card className="mt-8 border-border/40">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {t("certificate.nftDetails")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("certificate.mintAddress")}
                </span>
                <span className="font-mono">{mintAddress}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("certificate.collection")}
                </span>
                <span className="font-mono">
                  {credential?.collection || "Collection...abc"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("certificate.coursesCompleted")}
                </span>
                <span>{credential?.coursesCompleted || 1}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("certificate.totalXp")}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-violet-500" />
                  {credential?.totalXp || 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <Badge variant="outline">{SOLANA_NETWORK}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Standard</span>
                <span>Metaplex Core (Soulbound)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
