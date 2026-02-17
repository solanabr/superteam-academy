"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Download,
  Share2,
  Linkedin,
  Link2,
  ExternalLink,
  GraduationCap,
} from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("certificates");

  const cert = {
    id,
    courseName: "Introduction to Solana",
    recipientName: "Developer",
    completedDate: "2026-02-10",
    credential: "Bronze",
    track: "Solana Core",
    xpEarned: 2500,
    solanaExplorerUrl: "#",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Certificate Visual */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-gold/20 to-green-accent/20 p-1">
          <CardContent className="rounded-lg bg-card p-8 sm:p-12">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>

              <h1 className="mt-6 text-3xl font-bold text-primary">
                {t("title")}
              </h1>

              <div className="mx-auto mt-2 h-0.5 w-24 bg-primary/30" />

              <p className="mt-6 text-sm text-muted-foreground">
                {t("issuedTo")}
              </p>
              <p className="mt-1 text-2xl font-bold">{cert.recipientName}</p>

              <p className="mt-6 text-sm text-muted-foreground">
                for completing
              </p>
              <p className="mt-1 text-xl font-semibold">{cert.courseName}</p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <Badge variant="outline">{cert.track}</Badge>
                <Badge variant="secondary">{cert.credential}</Badge>
                <Badge variant="secondary">{cert.xpEarned} XP</Badge>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                {t("completedOn")}{" "}
                {new Date(cert.completedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <div className="mx-auto mt-6 h-0.5 w-24 bg-primary/30" />

              <p className="mt-4 text-xs text-muted-foreground">
                Superteam Academy
              </p>
              <p className="text-xs text-muted-foreground">
                Certificate ID: {cert.id}
              </p>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          {t("download")}
        </Button>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="h-4 w-4" />
          {t("verifyOnChain")}
        </Button>
      </div>

      {/* Share */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <Share2 className="h-4 w-4" />
            {t("share")}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button variant="outline" className="gap-2">
              <XIcon className="h-4 w-4" />
              {t("shareX")}
            </Button>
            <Button variant="outline" className="gap-2">
              <Linkedin className="h-4 w-4" />
              {t("shareLinkedIn")}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success(t("linkCopied"));
              }}
            >
              <Link2 className="h-4 w-4" />
              {t("copyLink")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
