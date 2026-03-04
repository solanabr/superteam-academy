"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Share2,
  ExternalLink,
  Check,
  Copy,
  Shield,
  Award,
  Calendar,
  User,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { credentialService } from "@/services";
import { formatDate, truncateAddress } from "@/lib/utils";

interface CertificatePageProps {
  certificateId: string;
}

export function CertificatePage({ certificateId }: CertificatePageProps) {
  const t = useTranslations("certificate");
  const [copied, setCopied] = useState(false);

  const { data: credential, isLoading, error } = useQuery({
    queryKey: ["credential", certificateId],
    queryFn: () => credentialService.getCredential(certificateId),
  });

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="aspect-[4/3] bg-muted rounded-xl" />
          <div className="h-12 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!credential || error) {
    return (
      <div className="container max-w-4xl px-4 py-16 text-center">
        <div className="rounded-full bg-muted p-6 w-fit mx-auto mb-6">
          <Shield className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Certificate Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The certificate you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/profile?tab=credentials">View Your Credentials</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/profile?tab=credentials">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
      </Button>

      {/* Certificate Display */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Certificate Card */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative">
              {/* Certificate Image */}
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 via-background to-accent/5 relative">
                {credential.image ? (
                  <Image
                    src={credential.image}
                    alt={credential.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    {/* Decorative Border */}
                    <div className="absolute inset-4 border-2 border-primary/20 rounded-lg" />
                    <div className="absolute inset-6 border border-primary/10 rounded-lg" />

                    {/* Certificate Content */}
                    <Award className="h-16 w-16 text-primary/40 mb-4" />
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                      {t("title")}
                    </p>
                    <h2 className="text-2xl font-bold mb-4">{credential.name}</h2>
                    <p className="text-muted-foreground mb-4">
                      {t("awardedTo")}
                    </p>
                    <p className="text-lg font-medium">
                      {truncateAddress(credential.owner, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                      {t("completedOn", {
                        date: credential.mintedAt
                          ? formatDate(credential.mintedAt)
                          : "Pending",
                      })}
                    </p>

                    {/* Logo */}
                    <div className="absolute bottom-8 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">
                        Superteam Academy
                      </span>
                    </div>
                  </div>
                )}

                {/* Verified Badge */}
                {credential.verified && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="success" className="gap-1">
                      <Check className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {t("download")}
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              {t("share")}
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a
                href={`https://solscan.io/token/${credential.mint}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                {t("verify")}
              </a>
            </Button>
          </div>
        </div>

        {/* NFT Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("nftDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mint Address */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("mintAddress")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                    {credential.mint}
                  </code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyAddress(credential.mint)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy address</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Owner */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("owner")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                    {credential.owner}
                  </code>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyAddress(credential.owner)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy address</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Course */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Course</p>
                <p className="text-sm font-medium">{credential.name}</p>
              </div>

              {/* Issue Date */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Issued</p>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {credential.mintedAt
                    ? formatDate(credential.mintedAt)
                    : "Pending"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          {credential.attributes && credential.attributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {credential.attributes.map((attr: any, i: number) => (
                    <div
                      key={i}
                      className="bg-muted rounded-lg p-3 text-center"
                    >
                      <p className="text-xs text-muted-foreground uppercase">
                        {attr.trait_type}
                      </p>
                      <p className="font-medium text-sm">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
