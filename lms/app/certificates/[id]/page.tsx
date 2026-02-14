"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Download, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TRACKS } from "@/types/course";

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Mock certificate data
  const certificate = {
    id,
    trackId: 1,
    trackName: "Anchor Framework",
    level: "Beginner",
    coursesCompleted: 1,
    totalXpEarned: 500,
    earnedAt: "2026-02-01T00:00:00Z",
    wallet: "7xKXt...abc1234",
  };

  const track = TRACKS[certificate.trackId];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </Link>

      {/* Certificate Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-solana-purple via-solana-purple/80 to-solana-green p-1">
          <div className="bg-background p-8 sm:p-12">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-solana-purple to-solana-green mb-6">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Certificate of Completion</p>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{certificate.trackName}</h1>
              <Badge className="mt-3" variant="outline">{certificate.level}</Badge>
              <Separator className="my-8" />
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-xp-gold">{certificate.totalXpEarned}</p>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{certificate.coursesCompleted}</p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{certificate.level}</p>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
              </div>
              <Separator className="my-8" />
              <div className="text-sm text-muted-foreground">
                <p>Awarded to</p>
                <p className="font-mono font-medium text-foreground mt-1">{certificate.wallet}</p>
                <p className="mt-3">
                  {new Date(certificate.earnedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4" /> View on Explorer
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" /> Download PNG
        </Button>
      </div>

      {/* Verification */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-3">On-Chain Verification</h2>
          <p className="text-sm text-muted-foreground">
            This credential is stored as a ZK-compressed account on the Solana blockchain.
            It is permanently verifiable and cannot be forged.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credential ID</span>
              <span className="font-mono">{id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Track</span>
              <span>{track?.display ?? certificate.trackName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span>Solana Devnet</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
