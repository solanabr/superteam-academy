"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Award,
  Copy,
  Check,
  ExternalLink,
  Download,
  Twitter,
  Linkedin,
  Link2,
  ShieldCheck,
  BookOpen,
  Zap,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type CertificateViewData = {
  id: string;
  recipientName: string;
  recipientWallet: string;
  courseTitle: string;
  courseSlug: string;
  completionDate: string;
  mintAddress: string;
  trackName: string;
  trackLevel: string;
  coursesInTrack: number;
  totalTrackXp: number;
  programId: string;
  cluster: string;
};

function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>Copy {label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CertificateVisual({
  certificate,
}: {
  certificate: CertificateViewData;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30 p-1">
      {/* Decorative corner accents */}
      <div className="absolute left-0 top-0 h-16 w-16 border-l-2 border-t-2 border-primary/40 rounded-tl-xl" />
      <div className="absolute right-0 top-0 h-16 w-16 border-r-2 border-t-2 border-primary/40 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 h-16 w-16 border-b-2 border-l-2 border-primary/40 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 h-16 w-16 border-b-2 border-r-2 border-primary/40 rounded-br-xl" />

      {/* Inner decorative border */}
      <div className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm px-6 py-10 sm:px-10 sm:py-14">
        {/* Top accent line */}
        <div className="mx-auto mb-8 h-0.5 w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
            <Award className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-wider text-primary uppercase">
            Superteam Academy
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Certificate of Completion
        </h1>

        {/* Decorative divider */}
        <div className="mx-auto my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <div className="h-1.5 w-1.5 rotate-45 bg-primary/60" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>

        {/* Recipient */}
        <p className="text-center text-sm text-muted-foreground">
          This certifies that
        </p>
        <p className="mt-2 text-center text-xl font-bold text-foreground sm:text-2xl">
          {certificate.recipientName}
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground font-mono">
          {shortAddress(certificate.recipientWallet)}
        </p>

        {/* Course */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          has successfully completed
        </p>
        <p className="mt-2 text-center text-lg font-semibold text-foreground sm:text-xl">
          {certificate.courseTitle}
        </p>

        {/* Track badge */}
        <div className="mt-4 flex justify-center">
          <Badge
            variant="outline"
            className="border-primary/30 text-primary text-xs"
          >
            {certificate.trackName} &middot; {certificate.trackLevel}
          </Badge>
        </div>

        {/* Date */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Completed on{" "}
          <span className="font-medium text-foreground">
            {new Date(certificate.completionDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </p>

        {/* Bottom accent line */}
        <div className="mx-auto mt-8 h-0.5 w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* On-chain badge */}
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary ring-1 ring-primary/20">
            <ShieldCheck className="h-3 w-3" />
            Verified on Solana ({certificate.cluster})
          </div>
        </div>
      </div>
    </div>
  );
}

function OnChainVerification({
  certificate,
}: {
  certificate: CertificateViewData;
}) {
  const explorerUrl = `https://explorer.solana.com/address/${certificate.mintAddress}?cluster=${certificate.cluster}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          On-Chain Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mint Address */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Mint Address</span>
          <div className="flex items-center gap-1">
            <code className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-foreground">
              {shortAddress(certificate.mintAddress)}
            </code>
            <CopyButton text={certificate.mintAddress} label="mint address" />
          </div>
        </div>

        <Separator />

        {/* Program ID */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Program</span>
          <div className="flex items-center gap-1">
            <code className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-foreground">
              {shortAddress(certificate.programId)}
            </code>
            <CopyButton text={certificate.programId} label="program ID" />
          </div>
        </div>

        <Separator />

        {/* Owner Wallet */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Owner</span>
          <div className="flex items-center gap-1">
            <code className="rounded bg-secondary px-2 py-0.5 text-xs font-mono text-foreground">
              {shortAddress(certificate.recipientWallet)}
            </code>
            <CopyButton
              text={certificate.recipientWallet}
              label="wallet address"
            />
          </div>
        </div>

        <Separator />

        {/* Cluster */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Cluster</span>
          <Badge variant="outline" className="text-xs capitalize">
            {certificate.cluster}
          </Badge>
        </div>

        {/* Explorer Button */}
        <Button asChild className="w-full mt-2" variant="outline">
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Verify on Solana Explorer
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function TrackDetails({ certificate }: { certificate: CertificateViewData }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          Track Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <BookOpen className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">
              {certificate.trackName}
            </p>
            <p className="text-xs text-muted-foreground">Track</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <Award className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">
              {certificate.trackLevel}
            </p>
            <p className="text-xs text-muted-foreground">Level</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <Layers className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">
              {certificate.coursesInTrack}
            </p>
            <p className="text-xs text-muted-foreground">Courses in Track</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <Zap className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">
              {certificate.totalTrackXp.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SocialSharing({ certificate }: { certificate: CertificateViewData }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const certUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certificates/${certificate.id}`
      : `/certificates/${certificate.id}`;

  const tweetText = encodeURIComponent(
    `I just earned a certificate for completing "${certificate.courseTitle}" on @SuperteamDAO Academy! Verified on-chain on Solana.\n\n${certUrl}`,
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(certUrl).then(() => {
      setLinkCopied(true);
      toast.success("Certificate link copied to clipboard");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function handleDownload() {
    toast.info("Download as image is coming soon");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Share Certificate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
              <Twitter className="mr-2 h-4 w-4" />
              Share on X
            </a>
          </Button>

          <Button asChild variant="outline" size="sm">
            <a href={linkedInUrl} target="_blank" rel="noopener noreferrer">
              <Linkedin className="mr-2 h-4 w-4" />
              Share on LinkedIn
            </a>
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            {linkCopied ? (
              <Check className="mr-2 h-4 w-4 text-primary" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            {linkCopied ? "Copied" : "Copy Link"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CertificateNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Award className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">
        Certificate Not Found
      </h1>
      <p className="text-muted-foreground mb-6">
        The certificate you are looking for does not exist or the link is
        invalid. Check that the URL is correct and try again.
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/courses">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Courses
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function CertificatePage({
  certificate,
}: {
  certificate: CertificateViewData;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      {/* Certificate Visual */}
      <div className="mb-8">
        <CertificateVisual certificate={certificate} />
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <OnChainVerification certificate={certificate} />
        <TrackDetails certificate={certificate} />
      </div>

      {/* Social Sharing */}
      <div className="mt-6">
        <SocialSharing certificate={certificate} />
      </div>
    </div>
  );
}
