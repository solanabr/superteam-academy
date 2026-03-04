"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Twitter } from "lucide-react";

interface CertificateDownloadProps {
  courseName: string;
  ownerAddress: string | null;
  completionDate: string | null;
  xpEarned: string | null;
  /** Full URL of the certificate page, used for the Share on X intent */
  certificateUrl: string;
  /** Filename stem for the downloaded PNG (no extension) */
  filename?: string;
}

// Solana brand colours
const BG_COLOR = "#0a0a0f";
const PURPLE = "#9945FF";
const GREEN = "#14F195";
const WHITE = "#ffffff";
const MUTED = "#a0a0b0";

/** Draw a rounded rectangle path (ctx.roundRect polyfill-safe). */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Build a 1200×630 certificate PNG on an offscreen canvas and return a
 * data-URL. All drawing uses the Canvas 2D API — no external libraries.
 */
function buildCertificateCanvas(
  courseName: string,
  ownerAddress: string | null,
  completionDate: string | null,
  xpEarned: string | null,
): HTMLCanvasElement {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, W, H);

  // Subtle purple radial glow (top-left)
  const glowTL = ctx.createRadialGradient(0, 0, 0, 0, 0, 480);
  glowTL.addColorStop(0, "rgba(153,69,255,0.18)");
  glowTL.addColorStop(1, "rgba(153,69,255,0)");
  ctx.fillStyle = glowTL;
  ctx.fillRect(0, 0, W, H);

  // Subtle green radial glow (bottom-right)
  const glowBR = ctx.createRadialGradient(W, H, 0, W, H, 480);
  glowBR.addColorStop(0, "rgba(20,241,149,0.12)");
  glowBR.addColorStop(1, "rgba(20,241,149,0)");
  ctx.fillStyle = glowBR;
  ctx.fillRect(0, 0, W, H);

  // ── Outer border card ─────────────────────────────────────────────────────
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 24, W - 48, H - 48, 20);
  ctx.stroke();

  // Inner thin accent line
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  roundRect(ctx, 32, 32, W - 64, H - 64, 16);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ── Decorative corner circles ─────────────────────────────────────────────
  const drawCornerCircle = (cx: number, cy: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.15;
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  drawCornerCircle(-20, -20);
  drawCornerCircle(W + 20, -20);
  drawCornerCircle(-20, H + 20);
  drawCornerCircle(W + 20, H + 20);

  // ── Left accent bar ───────────────────────────────────────────────────────
  const barGrad = ctx.createLinearGradient(0, 80, 0, H - 80);
  barGrad.addColorStop(0, PURPLE);
  barGrad.addColorStop(1, GREEN);
  ctx.fillStyle = barGrad;
  ctx.fillRect(50, 80, 5, H - 160);

  // ── Header: app name ──────────────────────────────────────────────────────
  ctx.fillStyle = MUTED;
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.textAlign = "center";
  ctx.fillText("SUPERTEAM ACADEMY", W / 2, 110);
  ctx.letterSpacing = "0px";

  // ── Title ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = WHITE;
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText("Certificate of Completion", W / 2, 190);

  // ── Divider line ──────────────────────────────────────────────────────────
  const divGrad = ctx.createLinearGradient(200, 0, W - 200, 0);
  divGrad.addColorStop(0, "rgba(153,69,255,0)");
  divGrad.addColorStop(0.3, PURPLE);
  divGrad.addColorStop(0.7, GREEN);
  divGrad.addColorStop(1, "rgba(20,241,149,0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(200, 215);
  ctx.lineTo(W - 200, 215);
  ctx.stroke();

  // ── "This certifies that" label ───────────────────────────────────────────
  ctx.fillStyle = MUTED;
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText("This certifies that", W / 2, 260);

  // ── Recipient wallet address ───────────────────────────────────────────────
  const truncated = ownerAddress
    ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-6)}`
    : "Unknown Recipient";
  ctx.fillStyle = GREEN;
  ctx.font = "bold 28px 'Courier New', monospace";
  ctx.fillText(truncated, W / 2, 305);

  // ── "has successfully completed" label ────────────────────────────────────
  ctx.fillStyle = MUTED;
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText("has successfully completed", W / 2, 350);

  // ── Course name ───────────────────────────────────────────────────────────
  // Shrink font if the course name is long
  const maxCourseWidth = W - 200;
  let courseFontSize = 36;
  ctx.font = `bold ${courseFontSize}px system-ui, sans-serif`;
  while (ctx.measureText(courseName).width > maxCourseWidth && courseFontSize > 20) {
    courseFontSize -= 2;
    ctx.font = `bold ${courseFontSize}px system-ui, sans-serif`;
  }
  ctx.fillStyle = WHITE;
  ctx.fillText(courseName, W / 2, 405);

  // ── Metadata row ──────────────────────────────────────────────────────────
  const metaY = 480;
  const col1X = 320;
  const col2X = W / 2;
  const col3X = W - 320;

  // Completion date
  if (completionDate) {
    ctx.fillStyle = MUTED;
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("COMPLETION DATE", col1X, metaY - 22);
    ctx.fillStyle = WHITE;
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.fillText(completionDate, col1X, metaY + 4);
  }

  // XP earned
  if (xpEarned) {
    ctx.fillStyle = MUTED;
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("XP EARNED", col2X, metaY - 22);
    ctx.fillStyle = PURPLE;
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillText(`${xpEarned} XP`, col2X, metaY + 4);
  }

  // Blockchain badge
  ctx.fillStyle = MUTED;
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("NETWORK", col3X, metaY - 22);
  ctx.fillStyle = GREEN;
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText("Solana", col3X, metaY + 4);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerGrad = ctx.createLinearGradient(300, 0, W - 300, 0);
  footerGrad.addColorStop(0, PURPLE);
  footerGrad.addColorStop(1, GREEN);
  ctx.strokeStyle = footerGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(300, H - 90);
  ctx.lineTo(W - 300, H - 90);
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("Verified on Solana Blockchain  •  Powered by Metaplex Core", W / 2, H - 60);

  return canvas;
}

export function CertificateDownload({
  courseName,
  ownerAddress,
  completionDate,
  xpEarned,
  certificateUrl,
  filename = "superteam-certificate",
}: CertificateDownloadProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const canvas = buildCertificateCanvas(
        courseName,
        ownerAddress,
        completionDate,
        xpEarned,
      );
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob returned null"));
            return;
          }
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = `${filename}.png`;
          link.click();
          // Revoke after a short delay so the browser has time to start the download
          setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
          resolve();
        }, "image/png");
      });
    } finally {
      setDownloading(false);
    }
  }, [courseName, ownerAddress, completionDate, xpEarned, filename]);

  const handleShareX = useCallback(() => {
    const text = encodeURIComponent(
      `I just earned the "${courseName}" certificate on Superteam Academy! 🎓 #Solana #Web3 #SuperteamAcademy`,
    );
    const url = encodeURIComponent(certificateUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [courseName, certificateUrl]);

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button
        variant="default"
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleDownload}
        disabled={downloading}
        aria-label="Download certificate as PNG image"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {downloading ? "Generating…" : "Download Certificate"}
      </Button>

      <Button
        variant="outline"
        className="gap-2 border-[#14F195]/40 text-[#14F195] hover:border-[#14F195] hover:bg-[#14F195]/10"
        onClick={handleShareX}
        aria-label="Share certificate on X (Twitter)"
      >
        <Twitter className="h-4 w-4" aria-hidden="true" />
        Share on X
      </Button>
    </div>
  );
}
